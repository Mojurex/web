import { answersFor, currentAttempt, deadlineOf, getExam, publicQuestions } from "@/lib/exam";
import { isOnlineTask } from "@/lib/types";
import { redirect } from "next/navigation";
import { ExamClient } from "./ExamClient";

export const dynamic = "force-dynamic";

export default async function ExamPage() {
  const attempt = await currentAttempt();
  if (!attempt) redirect("/");
  const exam = await getExam(attempt.exam_id);
  if (!exam) redirect("/");

  if (attempt.section === "done") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-4">
        <span className="qnum self-start">✓</span>
        <h1 className="text-3xl font-bold">Шалгалт дууслаа</h1>
        <p className="text-lg">
          {attempt.student_name}, таны хариултууд хадгалагдлаа. Дүнг багш шалгасны дараа мэдэгдэнэ.
        </p>
        <p className="text-muted">{exam.title}</p>
      </main>
    );
  }

  const questions = (await publicQuestions(exam.id, attempt.section)).filter(
    (q) => q.type !== "task" || isOnlineTask(q),
  );
  const answers = await answersFor(attempt.id);
  const deadline = deadlineOf(attempt)!;

  return (
    <ExamClient
      key={attempt.section}
      title={exam.title}
      studentName={attempt.student_name}
      section={attempt.section}
      deadline={deadline.getTime()}
      serverNow={Date.now()}
      sectionMinutes={attempt.section === "A" ? exam.section_a_minutes : exam.section_b_minutes}
      questions={questions}
      initialAnswers={answers}
    />
  );
}
