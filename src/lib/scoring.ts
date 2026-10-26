import type { Unit } from "@/content/types";
import { itemCount, summarize } from "./grading";
import type { Question, Section } from "./types";

export type SectionScore = { score: number; max: number; pending: number };
export type AttemptScore = { A: SectionScore; B: SectionScore; total: number; max: number; pending: number };

type ItemScores = (number | null)[] | null | undefined;

/** Нэг оролдлогын хэсэг тус бүрийн оноо. pending = багш шалгаагүй асуултын тоо. */
export function scoreAttempt(questions: Question[], itemScores: Map<string, ItemScores>): AttemptScore {
  const empty = (): SectionScore => ({ score: 0, max: 0, pending: 0 });
  const out = { A: empty(), B: empty() } as Record<Section, SectionScore>;
  for (const q of questions) {
    const { score, graded } = summarize(itemScores.get(q.id), itemCount(q));
    out[q.section].score += score;
    out[q.section].max += q.points;
    if (!graded) out[q.section].pending += 1;
  }
  return {
    ...out,
    total: out.A.score + out.B.score,
    max: out.A.max + out.B.max,
    pending: out.A.pending + out.B.pending,
  };
}

/** «1–4, 11» → ["1","2","3","4","11"] */
export function unitQuestions(spec: string): string[] {
  return spec.split(",").flatMap((part) => {
    const [a, b] = part.trim().split(/[–-]/).map((x) => Number(x.trim()));
    if (b === undefined || Number.isNaN(b)) return [String(a)];
    return Array.from({ length: b - a + 1 }, (_, i) => String(a + i));
  });
}

/** Нэгж бүрийн бүлгийн дундаж гүйцэтгэл (%). Багшийн хөтчийн «Дүнгийн шинжилгээ». */
export function unitAverages(
  units: Unit[],
  questions: Question[],
  attempts: Map<string, ItemScores>[],
): { unit: Unit; percent: number | null }[] {
  return units.map((unit) => {
    const qs = unitQuestions(unit.questions)
      .map((n) => questions.find((q) => q.section === "A" && q.number === n))
      .filter((q): q is Question => !!q);
    if (attempts.length === 0 || unit.points === 0) return { unit, percent: null };
    const total = attempts.reduce(
      (sum, scores) => sum + qs.reduce((s, q) => s + summarize(scores.get(q.id), itemCount(q)).score, 0),
      0,
    );
    return { unit, percent: (total / (attempts.length * unit.points)) * 100 };
  });
}

/** Оноо 0-ээс дээд оноо хүртэл, 0.5-ын алхамтай эсэх. */
export function validItemScore(value: number | null, max: number): boolean {
  return value === null || (Number.isFinite(value) && value >= 0 && value <= max && Math.round(value * 2) === value * 2);
}
