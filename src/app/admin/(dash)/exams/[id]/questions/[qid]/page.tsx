import { getExam } from "@/lib/exam";
import { sql } from "@/lib/db";
import type { Question } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuestionEditor } from "./QuestionEditor";

export default async function QuestionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; qid: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const { id, qid } = await params;
  const { section } = await searchParams;
  const exam = await getExam(id);
  if (!exam) notFound();
  let question: Question | null = null;
  if (qid !== "new") {
    [question] = await sql<Question[]>`select * from questions where id = ${qid} and exam_id = ${id}`;
    if (!question) notFound();
  }
  const [{ count }] = await sql<{ count: number }[]>`
    select count(*)::int as count from attempts where exam_id = ${id}`;
  return (
    <main className="flex flex-col gap-4">
      <Link href={`/admin/exams/${id}?tab=questions`} className="text-sm text-indigo hover:underline">
        ← {exam.title}
      </Link>
      <h1 className="text-3xl font-bold">{question ? `${question.number}-р асуулт засах` : "Шинэ асуулт"}</h1>
      {count > 0 && (
        <p className="rounded-lg bg-warn-tint px-3 py-2 text-warn">
          Энэ шалгалтад {count} сурагч орсон байна. Шалгуурыг өөрчилбөл өмнө өгсөн оноог дахин шалгах шаардлагатай.
        </p>
      )}
      <QuestionEditor examId={id} question={question} section={section === "B" ? "B" : question?.section ?? "A"} />
    </main>
  );
}
