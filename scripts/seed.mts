// Хэрэглээ:
//   npm run db:seed                       — байхгүй шалгалтуудыг нэмнэ
//   npm run db:seed -- --teacher имэйл "Нэр" нууцүг   — багш нэмнэ
//   npm run db:seed -- --replace 4        — 4-р ангийн асуултуудыг агуулгаас шинэчилнэ
//   npm run db:seed -- --replace 4 B      — зөвхөн Б хэсгийг (А-ийн хариултуудыг хөндөхгүй)
import postgres from "postgres";
import { grades } from "@/content";
import type { Variant } from "@/content/types";
import { examRow, newAccessCode, questionRows } from "@/lib/content-to-db";
import { hashPassword } from "@/lib/password";

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
const args = process.argv.slice(2);

const t = args.indexOf("--teacher");
if (t >= 0) {
  const [email, name, password] = args.slice(t + 1, t + 4);
  if (!email || !name || !password || password.length < 8) {
    console.error('Хэрэглээ: --teacher имэйл "Нэр" нууцүг (нууц үг 8+ тэмдэгт)');
    process.exit(1);
  }
  await sql`
    insert into teachers (email, name, password_hash)
    values (${email.toLowerCase()}, ${name}, ${await hashPassword(password)})
    on conflict (email) do update set name = excluded.name, password_hash = excluded.password_hash`;
  console.log(`Багш: ${email}`);
}

// --replace 4 [A|B]: тухайн ангийн шалгалтын асуултуудыг (эсвэл нэг хэсгийг) агуулгаас дахин
// үүсгэнэ (код, нээлттэй эсэх, хязгаар хэвээр). Сурагчийн хариулт холбогдсон асуултыг хөндөхгүй.
const r = args.indexOf("--replace");
if (r >= 0) {
  const grade = Number(args[r + 1]);
  const only = ["A", "B"].includes(args[r + 2]) ? (args[r + 2] as "A" | "B") : null;
  const g = grades.find((x) => x.grade === grade);
  if (!g) {
    console.error(`Хэрэглээ: --replace анги (${grades.map((x) => x.grade).join(", ")})`);
    process.exit(1);
  }
  // Ижил дугаартай асуултыг байранд нь шинэчилнэ (id хэвээр тул сурагчийн хариулт холбоотой
  // үлдэнэ). Хариулттай асуултыг устгах эсвэл шалгуурын тоог өөрчлөх бол юуг ч хийлгүй зогсоно.
  for (const variant of ["A", "B"] as Variant[]) {
    try {
      await sql.begin(async (tx) => {
        const row = examRow(g, variant);
        const [exam] = await tx`
          update exams set ${tx({ ...row, notes: tx.json(row.notes), units: tx.json(row.units) })}
          where grade = ${grade} and variant = ${variant} returning id, access_code`;
        if (!exam) return;
        const rows = questionRows(g.variants[variant]).filter((q) => !only || q.section === only);
        const existing = await tx<{ id: string; section: string; number: string; items: number; answers: number }[]>`
          select q.id, q.section, q.number,
            (case when q.type = 'mcq' then 1 else jsonb_array_length(q.rubric) end)::int items,
            (select count(*)::int from answers a where a.question_id = q.id) answers
          from questions q where q.exam_id = ${exam.id} ${only ? tx`and q.section = ${only}` : tx``}`;
        const items = (q: (typeof rows)[number]) => (q.type === "mcq" ? 1 : q.rubric.length);
        const match = (e: (typeof existing)[number]) => rows.find((q) => q.section === e.section && q.number === e.number);
        const problems = existing
          .filter((e) => e.answers > 0)
          .flatMap((e) => {
            const q = match(e);
            if (!q) return [`${e.number}: ${e.answers} хариулттай тул устгах боломжгүй`];
            if (items(q) !== e.items) return [`${e.number}: ${e.answers} хариулттай, шалгуурын тоо ${e.items} → ${items(q)} өөрчлөгдөнө`];
            return [];
          });
        if (problems.length) throw new Error(problems.join("; "));

        for (const e of existing) if (!match(e)) await tx`delete from questions where id = ${e.id}`;
        for (const q of rows) {
          const values = {
            ...q,
            payload: tx.json(q.payload as never),
            answer_key: tx.json(q.answer_key as never),
            rubric: tx.json(q.rubric as never),
          };
          const old = existing.find((e) => e.section === q.section && e.number === q.number);
          if (old) await tx`update questions set ${tx(values)} where id = ${old.id}`;
          else await tx`insert into questions ${tx({ ...values, exam_id: exam.id })}`;
        }
        const kept = existing.filter((e) => e.answers > 0).length;
        console.log(
          `↻ ${grade}-р анги ${variant}: ${only ? `${only} хэсгийг` : "асуултуудыг"} шинэчлэв (код ${exam.access_code}` +
            `${kept ? `, хариулттай ${kept} асуулт хадгалагдсан` : ""})`,
        );
      });
    } catch (e) {
      console.error(`${grade}-р анги ${variant}: шинэчлээгүй — ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
}

for (const g of grades) {
  for (const variant of ["A", "B"] as Variant[]) {
    const [existing] = await sql`select id from exams where grade = ${g.grade} and variant = ${variant}`;
    if (existing) continue;
    await sql.begin(async (tx) => {
      const row = examRow(g, variant);
      const [exam] = await tx`
        insert into exams ${tx({ ...row, notes: tx.json(row.notes), units: tx.json(row.units), access_code: newAccessCode() })}
        returning id, access_code`;
      for (const q of questionRows(g.variants[variant])) {
        await tx`
          insert into questions ${tx({
            ...q,
            exam_id: exam.id,
            payload: tx.json(q.payload as never),
            answer_key: tx.json(q.answer_key as never),
            rubric: tx.json(q.rubric as never),
          })}`;
      }
      console.log(`+ ${g.grade}-р анги ${variant}: код ${exam.access_code}`);
    });
  }
}
await sql.end();
