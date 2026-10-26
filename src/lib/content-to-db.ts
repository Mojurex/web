import type { ExamVariant, GradeContent, Variant } from "@/content/types";
import { randomInt } from "node:crypto";

// 0/O, 1/I зэрэг андуурагддаг тэмдэгтгүй.
const codeAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function newAccessCode(): string {
  return Array.from({ length: 6 }, () => codeAlphabet[randomInt(codeAlphabet.length)]).join("");
}

export type QuestionRow = {
  section: "A" | "B";
  position: number;
  number: string;
  type: "mcq" | "open" | "task";
  points: number;
  prompt: string;
  payload: Record<string, unknown>;
  answer_key: Record<string, unknown>;
  rubric: Record<string, unknown>[];
};

export function questionRows(v: ExamVariant): QuestionRow[] {
  const a: QuestionRow[] = v.sectionA.map((q, i) =>
    q.type === "mcq"
      ? {
          section: "A",
          position: i,
          number: q.n,
          type: "mcq",
          points: q.points,
          prompt: q.prompt,
          payload: { options: q.options },
          answer_key: { answer: q.answer },
          rubric: [],
        }
      : {
          section: "A",
          position: i,
          number: q.n,
          type: "open",
          points: q.points,
          prompt: q.prompt,
          payload: { input: q.input ?? "text" },
          answer_key: { key: q.key },
          rubric: q.rubric,
        },
  );
  const b: QuestionRow[] = v.sectionB.map((t, i) => ({
    section: "B",
    position: i,
    number: t.n,
    type: "task",
    points: t.points,
    prompt: t.prompt,
    payload: {
      title: t.title,
      tools: t.tools,
      files: t.files ?? {},
      images: t.images ?? {},
      workspace: t.workspace ?? null,
      parts: t.parts.map((p) => ({ n: p.n, text: p.text, points: p.points })),
    },
    answer_key: { key: t.key ?? "" },
    rubric: t.parts.flatMap((p) => p.rubric.map((r) => ({ ...r, part: p.n }))),
  }));
  return [...a, ...b];
}

export function examRow(g: GradeContent, variant: Variant) {
  return {
    grade: g.grade,
    variant,
    title: `Программчлал · ${g.roman} анги · Хувилбар ${variant === "A" ? "А" : "Б"}`,
    topic: g.topic,
    section_a_minutes: g.sectionAMinutes,
    section_b_minutes: g.sectionBMinutes,
    notes: g.notes,
    units: g.variants[variant].units,
  };
}
