// Хэрэглээ:
//   npm run db:seed                       — байхгүй шалгалтуудыг нэмнэ
//   npm run db:seed -- --teacher имэйл "Нэр" нууцүг   — багш нэмнэ
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
