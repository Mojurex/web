import type { Unit } from "@/content/types";
import { examAttempts, itemScoresByAttempt } from "@/lib/admin";
import { fullQuestions, getExam } from "@/lib/exam";
import { unitAverages } from "@/lib/scoring";
import { workspaceOwner, type Question } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OpenToggle } from "../../OpenToggle";
import { AttemptActions, AutoRefresh, QuestionMover, RegenerateCode, SettingsForm } from "./ExamControls";

const tabs = [
  ["students", "Сурагчид"],
  ["questions", "Асуултууд"],
  ["results", "Дүнгийн шинжилгээ"],
  ["settings", "Тохиргоо"],
] as const;

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function timeLeft(deadline: Date | null) {
  if (!deadline) return "";
  const ms = deadline.getTime() - Date.now();
  if (ms <= 0) return "хугацаа дууссан";
  const m = Math.ceil(ms / 60_000);
  return `${m} мин үлдсэн`;
}

export default async function ExamPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "students" } = await searchParams;
  const exam = await getExam(id);
  if (!exam) notFound();
  const questions = await fullQuestions(id);

  return (
    <main>
      <Link href="/admin" className="text-sm text-indigo hover:underline">
        ← Шалгалтууд
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{exam.title}</h1>
          <p className="text-muted">{exam.topic}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted">Шалгалтын код</p>
            <p className="font-mono text-3xl font-bold tracking-[0.2em]">{exam.access_code}</p>
          </div>
          <OpenToggle examId={exam.id} open={exam.is_open} />
        </div>
      </div>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-line" aria-label="Хэсгүүд">
        {tabs.map(([key, label]) => (
          <Link
            key={key}
            href={`/admin/exams/${id}?tab=${key}`}
            aria-current={tab === key ? "page" : undefined}
            className={`-mb-px shrink-0 border-b-2 px-4 py-2 font-semibold ${
              tab === key ? "border-indigo text-indigo" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "students" && <Students examId={id} questions={questions} />}
        {tab === "questions" && <Questions examId={id} questions={questions} />}
        {tab === "results" && <Results examId={id} questions={questions} units={exam.units} />}
        {tab === "settings" && (
          <div className="flex max-w-xl flex-col gap-8">
            <SettingsForm exam={exam} />
            <RegenerateCode examId={exam.id} />
          </div>
        )}
      </div>
    </main>
  );
}

async function Students({ examId, questions }: { examId: string; questions: Question[] }) {
  const attempts = await examAttempts(examId, questions);
  if (attempts.length === 0) {
    return (
      <>
        <AutoRefresh />
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-muted">
          Одоогоор сурагч ороогүй байна. Шалгалтыг нээгээд кодыг самбар дээр бичнэ үү.
        </p>
      </>
    );
  }
  const maxA = questions.filter((q) => q.section === "A").reduce((s, q) => s + q.points, 0);
  const maxB = questions.filter((q) => q.section === "B").reduce((s, q) => s + q.points, 0);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">Жагсаалт 15 секунд тутам шинэчлэгдэнэ.</p>
        <a href={`/admin/exams/${examId}/export`} className="btn btn-ghost text-sm">
          Excel-д татах (CSV)
        </a>
      </div>
      <AutoRefresh />
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[48rem] text-left">
          <thead className="border-b border-line bg-paper text-sm text-muted">
            <tr>
              <th className="px-4 py-2 font-semibold">Сурагч</th>
              <th className="px-4 py-2 font-semibold">Төлөв</th>
              <th className="px-4 py-2 text-right font-semibold">А /{maxA}</th>
              <th className="px-4 py-2 text-right font-semibold">Б /{maxB}</th>
              <th className="px-4 py-2 text-right font-semibold">Нийт</th>
              <th className="px-4 py-2 font-semibold">
                <span className="sr-only">Үйлдэл</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a) => (
              <tr key={a.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/attempts/${a.id}`} className="font-semibold text-indigo hover:underline">
                    {a.student_name}
                  </Link>
                  <div className="text-sm text-muted">{a.student_code}</div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {a.section === "done" ? (
                    a.score.pending > 0 ? (
                      <span className="rounded-full bg-warn-tint px-2 py-0.5 font-semibold text-warn">
                        {a.score.pending} даалгавар шалгах
                      </span>
                    ) : (
                      <span className="rounded-full bg-good-tint px-2 py-0.5 font-semibold text-good">Шалгасан</span>
                    )
                  ) : (
                    <span>
                      {a.section === "A" ? "А хэсэг" : "Б хэсэг"} ·{" "}
                      <span className="text-muted">{timeLeft(a.section === "A" ? a.a_deadline : a.b_deadline)}</span>
                    </span>
                  )}
                  {a.token_hash === null && a.section !== "done" && (
                    <div className="text-warn">Дахин нэвтрэхийг зөвшөөрсөн</div>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">{fmt(a.score.A.score)}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">{fmt(a.score.B.score)}</td>
                <td className="px-4 py-3 text-right font-mono text-lg font-bold tabular-nums">{fmt(a.score.total)}</td>
                <td className="px-4 py-3">
                  <AttemptActions attemptId={a.id} section={a.section} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Questions({ examId, questions }: { examId: string; questions: Question[] }) {
  return (
    <div className="flex flex-col gap-8">
      {(["A", "B"] as const).map((section) => {
        const qs = questions.filter((q) => q.section === section);
        const total = qs.reduce((s, q) => s + q.points, 0);
        return (
          <section key={section}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {section === "A" ? "А хэсэг · Онол" : "Б хэсэг · Практик"}{" "}
                <span className="text-base font-normal text-muted">{total} оноо</span>
              </h2>
              <Link href={`/admin/exams/${examId}/questions/new?section=${section}`} className="btn btn-ghost text-sm">
                + {section === "A" ? "Асуулт" : "Даалгавар"} нэмэх
              </Link>
            </div>
            <ol className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
              {qs.map((q, i) => (
                <li key={q.id} className="flex items-center gap-4 px-4 py-3">
                  <span className="qnum shrink-0 text-sm">{q.number}</span>
                  <Link href={`/admin/exams/${examId}/questions/${q.id}`} className="min-w-0 flex-1 hover:text-indigo">
                    <span className="line-clamp-1">
                      {q.type === "task" ? q.payload.title : q.prompt.replace(/```[\s\S]*?```/g, "…").replace(/[`*]/g, "")}
                    </span>
                    <span className="text-sm text-muted">
                      {q.type === "mcq"
                        ? `Олон сонголттой · хариулт ${q.answer_key.answer}`
                        : q.type === "open"
                          ? `Задгай · ${q.rubric.length} шалгуур${q.rubric.some((r) => r.blank) ? " (зарим нь автомат)" : ""}`
                          : q.payload.tools === "offline"
                            ? "Практик · компьютер дээр, багш оноо оруулна"
                            : `Практик · ${q.payload.parts.length} хэсэг${
                                workspaceOwner(qs, q).id !== q.id ? ` · ${workspaceOwner(qs, q).number}-тэй нэг файлд` : ""
                              }`}
                    </span>
                  </Link>
                  <span className="shrink-0 font-mono text-sm tabular-nums">{q.points}</span>
                  <QuestionMover questionId={q.id} first={i === 0} last={i === qs.length - 1} />
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

async function Results({
  examId,
  questions,
  units,
}: {
  examId: string;
  questions: Question[];
  units: Unit[];
}) {
  const byAttempt = await itemScoresByAttempt(examId);
  const averages = unitAverages(units, questions, [...byAttempt.values()]);
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <p className="text-muted">
        Онолын хэсгийн нэгж бүрийн дундаж гүйцэтгэл ({byAttempt.size} дууссан сурагч). Бүлгийн дундаж 60%-иас доош бол
        бататгах цаг төлөвлөнө.
      </p>
      <ul className="flex flex-col gap-3">
        {averages.map(({ unit, percent }) => (
          <li key={unit.name} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-semibold">{unit.name}</span>
              <span
                className={`font-mono text-lg font-bold tabular-nums ${
                  percent === null ? "text-muted" : percent < 60 ? "text-bad" : "text-good"
                }`}
              >
                {percent === null ? "—" : `${Math.round(percent)}%`}
              </span>
            </div>
            <div className="mt-1 text-sm text-muted">
              Даалгавар {unit.questions} · {unit.points} оноо
            </div>
            <div className="mt-2 h-2 rounded-full bg-tint" aria-hidden>
              <div
                className={`h-full rounded-full ${percent !== null && percent < 60 ? "bg-bad" : "bg-indigo"}`}
                style={{ width: `${Math.min(100, percent ?? 0)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
