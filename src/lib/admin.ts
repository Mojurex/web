import "server-only";
import { redirect } from "next/navigation";
import { sql } from "./db";
import { itemCount } from "./grading";
import { scoreAttempt, type AttemptScore } from "./scoring";
import { readTeacherId } from "./session";
import type { AnswerRow, Attempt, Exam, Question } from "./types";

export type Teacher = { id: string; email: string; name: string };

export async function currentTeacher(): Promise<Teacher | null> {
  const id = await readTeacherId();
  if (!id) return null;
  const [t] = await sql<Teacher[]>`select id, email, name from teachers where id = ${id}`;
  return t ?? null;
}

export async function requireTeacher(): Promise<Teacher> {
  const t = await currentTeacher();
  if (!t) redirect("/admin/login");
  return t;
}

export type ExamListItem = Exam & { started: number; finished: number; active: number };

export async function examList(): Promise<ExamListItem[]> {
  return sql<ExamListItem[]>`
    select e.*,
      count(a.id)::int as started,
      count(a.id) filter (where a.section = 'done')::int as finished,
      count(a.id) filter (where a.section <> 'done')::int as active
    from exams e left join attempts a on a.exam_id = e.id
    group by e.id
    order by e.grade, e.variant`;
}

export type AttemptWithScore = Attempt & { score: AttemptScore };

export async function examAttempts(examId: string, questions: Question[]): Promise<AttemptWithScore[]> {
  const attempts = await sql<Attempt[]>`
    select * from attempts where exam_id = ${examId} order by student_name, created_at`;
  const answers = await sql<Pick<AnswerRow, "attempt_id" | "question_id" | "item_scores">[]>`
    select ans.attempt_id, ans.question_id, ans.item_scores
    from answers ans join attempts a on a.id = ans.attempt_id
    where a.exam_id = ${examId}`;
  const byAttempt = new Map<string, Map<string, (number | null)[] | null>>();
  for (const a of answers) {
    if (!byAttempt.has(a.attempt_id)) byAttempt.set(a.attempt_id, new Map());
    byAttempt.get(a.attempt_id)!.set(a.question_id, a.item_scores);
  }
  return attempts.map((a) => ({ ...a, score: scoreAttempt(questions, byAttempt.get(a.id) ?? new Map()) }));
}

export async function itemScoresByAttempt(examId: string) {
  const rows = await sql<Pick<AnswerRow, "attempt_id" | "question_id" | "item_scores">[]>`
    select ans.attempt_id, ans.question_id, ans.item_scores
    from answers ans join attempts a on a.id = ans.attempt_id
    where a.exam_id = ${examId} and a.section = 'done'`;
  const map = new Map<string, Map<string, (number | null)[] | null>>();
  for (const r of rows) {
    if (!map.has(r.attempt_id)) map.set(r.attempt_id, new Map());
    map.get(r.attempt_id)!.set(r.question_id, r.item_scores);
  }
  return map;
}

export async function attemptAnswers(attemptId: string): Promise<Map<string, AnswerRow>> {
  const rows = await sql<AnswerRow[]>`select * from answers where attempt_id = ${attemptId}`;
  return new Map(rows.map((r) => [r.question_id, r]));
}

/** Хоосон item_scores-ийг рубрикийн уртад тааруулна. */
export function padScores(q: Question, scores: (number | null)[] | null | undefined): (number | null)[] {
  const n = itemCount(q);
  return Array.from({ length: n }, (_, i) => scores?.[i] ?? null);
}
