import { attemptAnswers, padScores } from "@/lib/admin";
import { sql } from "@/lib/db";
import { fullQuestions, getExam } from "@/lib/exam";
import { scoreAttempt } from "@/lib/scoring";
import type { Attempt } from "@/lib/types";
import { isOnlineTask, workspaceOwner } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AttemptHeaderActions, GradeCard, McqTable } from "./Grading";

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [attempt] = await sql<Attempt[]>`select * from attempts where id = ${id}`;
  if (!attempt) notFound();
  const exam = (await getExam(attempt.exam_id))!;
  const questions = await fullQuestions(exam.id);
  const answers = await attemptAnswers(id);
  const score = scoreAttempt(questions, new Map([...answers].map(([k, v]) => [k, v.item_scores])));

  const [next] = await sql<{ id: string }[]>`
    select id from attempts
    where exam_id = ${exam.id} and section = 'done' and id <> ${id} and student_name > ${attempt.student_name}
    order by student_name limit 1`;

  const mcqs = questions.filter((q) => q.type === "mcq");
  const others = questions.filter((q) => q.type !== "mcq");

  return (
    <main className="flex flex-col gap-6">
      <div>
        <Link href={`/admin/exams/${exam.id}`} className="text-sm text-indigo hover:underline">
          ← {exam.title}
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{attempt.student_name}</h1>
            <p className="text-muted">
              Сурагчийн код {attempt.student_code} ·{" "}
              {attempt.section === "done" ? "Шалгалт дууссан" : `${attempt.section === "A" ? "А" : "Б"} хэсгийг өгч байна`}
            </p>
          </div>
          <dl className="flex gap-6 text-right">
            <div>
              <dt className="text-sm text-muted">А хэсэг</dt>
              <dd className="font-mono text-xl font-bold tabular-nums">
                {fmt(score.A.score)}/{score.A.max}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Б хэсэг</dt>
              <dd className="font-mono text-xl font-bold tabular-nums">
                {fmt(score.B.score)}/{score.B.max}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Нийт</dt>
              <dd className="font-mono text-3xl font-bold text-indigo tabular-nums">{fmt(score.total)}</dd>
            </div>
          </dl>
        </div>
        <p className={`mt-3 text-sm ${score.pending ? "text-warn" : "text-good"}`}>
          {score.pending ? `${score.pending} даалгаврыг шалгах шаардлагатай.` : "Бүх даалгаврыг шалгасан."}
        </p>
        <AttemptHeaderActions attemptId={attempt.id} examId={exam.id} note={attempt.note} nextId={next?.id} />
      </div>

      <section>
        <h2 className="mb-3 text-xl font-bold">Олон сонголттой</h2>
        <McqTable
          attemptId={attempt.id}
          rows={mcqs.map((q) => ({
            id: q.id,
            number: q.number,
            points: q.points,
            prompt: q.prompt,
            options: q.type === "mcq" ? q.payload.options : [],
            answer: q.answer_key.answer ?? "",
            choice: answers.get(q.id)?.response.choice ?? null,
            score: padScores(q, answers.get(q.id)?.item_scores)[0],
          }))}
        />
      </section>

      {(["A", "B"] as const).map((section) => {
        const qs = others.filter((q) => q.section === section);
        if (qs.length === 0) return null;
        return (
          <section key={section} className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">{section === "A" ? "Задгай даалгавар" : "Практик"}</h2>
            {qs.map((q) => {
              const owner = workspaceOwner(questions, q);
              const sharedFrom = owner.id !== q.id ? owner.number : null;
              return (
                <GradeCard
                  key={q.id}
                  attemptId={attempt.id}
                  question={{
                    id: q.id,
                    type: q.type,
                    number: q.number,
                    points: q.points,
                    prompt: q.prompt,
                    payload: q.payload,
                    rubric: q.rubric,
                    keyText: q.answer_key.key ?? "",
                    offline: q.type === "task" && !isOnlineTask(q),
                  }}
                  response={answers.get(owner.id)?.response ?? {}}
                  sharedFrom={sharedFrom}
                  initialScores={padScores(q, answers.get(q.id)?.item_scores)}
                  initialComment={answers.get(q.id)?.comment ?? ""}
                />
              );
            })}
          </section>
        );
      })}
    </main>
  );
}
