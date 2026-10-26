import { examAttempts, requireTeacher } from "@/lib/admin";
import { sql } from "@/lib/db";
import { fullQuestions, getExam } from "@/lib/exam";
import { itemCount, summarize } from "@/lib/grading";

export const dynamic = "force-dynamic";

const cell = (v: string | number) => {
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Дүн бүртгэх хуудастай ижил бүтэцтэй CSV (Excel-д UTF-8 BOM-той). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireTeacher();
  const { id } = await params;
  const exam = await getExam(id);
  if (!exam) return new Response("Олдсонгүй", { status: 404 });
  const questions = await fullQuestions(id);
  const attempts = await examAttempts(id, questions);
  const rows = await sql<{ attempt_id: string; question_id: string; item_scores: (number | null)[] | null }[]>`
    select ans.attempt_id, ans.question_id, ans.item_scores
    from answers ans join attempts a on a.id = ans.attempt_id where a.exam_id = ${id}`;
  const scores = new Map(rows.map((r) => [`${r.attempt_id}:${r.question_id}`, r.item_scores]));

  const variant = exam.variant === "A" ? "А" : "Б";
  const header = ["Сурагчийн нэр", "Код", "Хув.", ...questions.map((q) => q.number), "А", "Б", "Нийт", "Шалгаагүй", "Тэмдэглэл"];
  const lines = [header.map(cell).join(",")];
  for (const a of attempts) {
    const perQuestion = questions.map((q) => {
      const { score, graded } = summarize(scores.get(`${a.id}:${q.id}`), itemCount(q));
      return graded ? score : score ? `${score}?` : "";
    });
    lines.push(
      [a.student_name, a.student_code, variant, ...perQuestion, a.score.A.score, a.score.B.score, a.score.total, a.score.pending, a.note]
        .map(cell)
        .join(","),
    );
  }
  const filename = `${exam.grade}-angi-${exam.variant}-dun.csv`;
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
