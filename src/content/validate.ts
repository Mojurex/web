import type { GradeContent, Question } from "./types";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** {{id}} нүдний id-нуудыг prompt-оос гаргана. */
export function blankIds(prompt: string): string[] {
  return [...prompt.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
}

/** Тухайн нэгжийн "1–4, 11" гэх мэт асуултын дугааруудыг задлана. */
function expandRange(spec: string): string[] {
  return spec.split(",").flatMap((part) => {
    const [a, b] = part.trim().split(/[–-]/).map((x) => Number(x.trim()));
    if (b === undefined || Number.isNaN(b)) return [String(a)];
    return Array.from({ length: b - a + 1 }, (_, i) => String(a + i));
  });
}

export function validateGrade(g: GradeContent): string[] {
  const errors: string[] = [];
  for (const [variant, v] of Object.entries(g.variants)) {
    const at = (where: string, msg: string) => errors.push(`${g.grade}-р анги ${variant} ${where}: ${msg}`);

    v.sectionA.forEach((q: Question, i) => {
      if (q.n !== String(i + 1)) at(`А${q.n}`, `дугаар дараалалгүй (хүлээсэн ${i + 1})`);
      if (q.type === "mcq") {
        if (!q.options.some(([k]) => k === q.answer)) at(`А${q.n}`, `хариулт ${q.answer} сонголтуудад алга`);
        if (new Set(q.options.map(([k]) => k)).size !== q.options.length) at(`А${q.n}`, "сонголтын үсэг давхардсан");
      } else {
        const ids = blankIds(q.prompt);
        if (new Set(ids).size !== ids.length) at(`А${q.n}`, "нүдний id давхардсан");
        const rubricSum = sum(q.rubric.map((r) => r.points));
        if (rubricSum !== q.points) at(`А${q.n}`, `рубрик ${rubricSum} ≠ ${q.points}`);
        for (const r of q.rubric) {
          if (r.blank && !ids.includes(r.blank)) at(`А${q.n}`, `рубрик "${r.label}" байхгүй нүд ${r.blank}`);
          if (r.blank && !r.accept?.length) at(`А${q.n}`, `рубрик "${r.label}" accept-гүй`);
        }
        if (q.input === "none" && ids.length === 0) at(`А${q.n}`, "хариулах талбаргүй");
      }
    });
    const aTotal = sum(v.sectionA.map((q) => q.points));
    if (aTotal !== 40) at("А хэсэг", `нийт ${aTotal} ≠ 40`);

    const unitQs = v.units.flatMap((u) => expandRange(u.questions));
    const allQs = v.sectionA.map((q) => q.n);
    if ([...unitQs].sort().join() !== [...allQs].sort().join()) at("нэгж", "асуултуудыг бүрэн хамраагүй");
    for (const u of v.units) {
      const pts = sum(expandRange(u.questions).map((n) => v.sectionA.find((q) => q.n === n)?.points ?? 0));
      if (pts !== u.points) at(`нэгж «${u.name}»`, `${pts} ≠ ${u.points}`);
    }

    const bTotal = sum(v.sectionB.map((t) => t.points));
    if (bTotal !== 60) at("Б хэсэг", `нийт ${bTotal} ≠ 60`);
    for (const t of v.sectionB) {
      const partSum = sum(t.parts.map((p) => p.points));
      if (partSum !== t.points) at(t.n, `хэсгүүд ${partSum} ≠ ${t.points}`);
      for (const p of t.parts) {
        const r = sum(p.rubric.map((x) => x.points));
        if (r !== p.points) at(p.n, `рубрик ${r} ≠ ${p.points}`);
        if (!p.n.startsWith(`${t.n}.`)) at(p.n, `${t.n}-д хамаарахгүй дугаар`);
      }
      if (t.tools !== "offline" && t.tools.some((x) => x !== "flowchart" && x !== "notes") && !t.files)
        at(t.n, "эхлэх файл алга");
    }
  }
  return errors;
}
