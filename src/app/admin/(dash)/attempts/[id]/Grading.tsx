"use client";

import { Markdown } from "@/components/Markdown";
import { FlowDiagram } from "@/components/Flow";
import { matches } from "@/lib/grading";
import type { AnswerResponse, FocusEvent, TaskPayload, TaskRubricItem } from "@/lib/types";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteAttempt, resetFocus, saveGrade, saveNote } from "../../../actions";

const CodeEditor = dynamic(() => import("@/components/CodeEditor").then((m) => m.CodeEditor), { ssr: false });
const Workspace = dynamic(() => import("@/components/Workspace").then((m) => m.Workspace), { ssr: false });

type Status = "idle" | "saving" | "saved" | "error";

/** Оноо өөрчлөгдөхөд 700мс-ийн дараа хадгална. */
function useGradeSaver(attemptId: string, questionId: string) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(null);
  const save = (scores: (number | null)[], comment: string) => {
    if (timer.current) clearTimeout(timer.current);
    setStatus("saving");
    timer.current = setTimeout(async () => {
      try {
        const res = await saveGrade(attemptId, questionId, scores, comment);
        setStatus(res.error ? "error" : "saved");
        setError(res.error ?? "");
      } catch {
        setStatus("error");
        setError("Хадгалж чадсангүй. Интернэтээ шалгана уу.");
      }
    }, 700);
  };
  return { status, error, save };
}

function StatusText({ status, error }: { status: Status; error: string }) {
  if (status === "idle") return null;
  return (
    <span aria-live="polite" className={`text-sm ${status === "error" ? "text-bad" : "text-muted"}`}>
      {status === "saving" ? "Хадгалж байна…" : status === "saved" ? "Хадгалагдсан" : error}
    </span>
  );
}

function ScoreInput({
  value,
  max,
  onChange,
  label,
}: {
  value: number | null;
  max: number;
  onChange: (v: number | null) => void;
  label: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(0)}
        className={`h-8 w-8 rounded-md border text-sm font-semibold ${value === 0 ? "border-bad bg-bad-tint text-bad" : "border-line"}`}
        aria-label={`${label}: 0 оноо`}
      >
        0
      </button>
      <input
        type="number"
        min={0}
        max={max}
        step={0.5}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className="field h-8 w-16 px-2 py-0 text-right font-mono tabular-nums"
        aria-label={label}
      />
      <button
        type="button"
        onClick={() => onChange(max)}
        className={`h-8 min-w-8 rounded-md border px-1.5 text-sm font-semibold ${
          value === max ? "border-good bg-good-tint text-good" : "border-line"
        }`}
        aria-label={`${label}: бүтэн оноо`}
      >
        {max}
      </button>
    </div>
  );
}

type McqRow = {
  id: string;
  number: string;
  points: number;
  prompt: string;
  options: [string, string][];
  answer: string;
  choice: string | null;
  score: number | null;
};

export function McqTable({ attemptId, rows }: { attemptId: string; rows: McqRow[] }) {
  const total = rows.reduce((s, r) => s + (r.score ?? 0), 0);
  const max = rows.reduce((s, r) => s + r.points, 0);
  return (
    <details className="rounded-xl border border-line bg-surface">
      <summary className="cursor-pointer px-4 py-3">
        <span className="font-semibold">
          {rows.filter((r) => r.choice === r.answer).length}/{rows.length} зөв
        </span>{" "}
        <span className="text-muted">
          · {total}/{max} оноо · автоматаар шалгасан
        </span>
        <span className="mt-2 flex flex-wrap gap-1.5" aria-hidden>
          {rows.map((r) => (
            <span
              key={r.id}
              className={`grid h-8 min-w-8 place-items-center rounded-full px-1.5 text-xs font-bold ${
                r.choice === r.answer ? "bg-good-tint text-good" : r.choice ? "bg-bad-tint text-bad" : "bg-paper text-muted"
              }`}
              title={`${r.number}: ${r.choice ?? "хариулаагүй"}`}
            >
              {r.number}
            </span>
          ))}
        </span>
      </summary>
      <ul className="divide-y divide-line border-t border-line">
        {rows.map((r) => (
          <McqLine key={r.id} attemptId={attemptId} row={r} />
        ))}
      </ul>
    </details>
  );
}

function McqLine({ attemptId, row }: { attemptId: string; row: McqRow }) {
  const [score, setScore] = useState(row.score);
  const { status, error, save } = useGradeSaver(attemptId, row.id);
  const chosen = row.options.find(([k]) => k === row.choice)?.[1];
  const correct = row.options.find(([k]) => k === row.answer)?.[1];
  return (
    <li className="grid gap-2 px-4 py-3 md:grid-cols-[2.5rem_1fr_auto]">
      <span className="qnum h-8 min-w-8 text-sm">{row.number}</span>
      <div className="min-w-0 text-sm">
        <Markdown source={row.prompt} />
        <p>
          Сонгосон:{" "}
          <b className={row.choice === row.answer ? "text-good" : "text-bad"}>
            {row.choice ? `${row.choice} — ${chosen}` : "хариулаагүй"}
          </b>
          {row.choice !== row.answer && (
            <>
              {" "}
              · Зөв: <b>{row.answer} — {correct}</b>
            </>
          )}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <ScoreInput
          value={score}
          max={row.points}
          label={`${row.number}-р асуултын оноо`}
          onChange={(v) => {
            setScore(v);
            save([v], "");
          }}
        />
        <StatusText status={status} error={error} />
      </div>
    </li>
  );
}

type GradeQuestion = {
  id: string;
  type: "mcq" | "open" | "task";
  number: string;
  points: number;
  prompt: string;
  payload: unknown;
  rubric: TaskRubricItem[];
  keyText: string;
  offline: boolean;
};

function StudentAnswer({ q, response, sharedFrom }: { q: GradeQuestion; response: AnswerResponse; sharedFrom: string | null }) {
  if (q.offline) {
    return <p className="rounded-lg bg-paper p-3 text-muted">Компьютер дээр гүйцэтгэсэн. Ажлыг нь үзээд шалгуурын дагуу оноо өгнө.</p>;
  }
  if (q.type === "task") {
    const p = q.payload as TaskPayload;
    if (p.tools === "offline") return null;
    return (
      <div className="flex flex-col gap-2">
        {sharedFrom && <p className="text-sm text-muted">{sharedFrom}-тэй ижил файлууд дээр гүйцэтгэсэн.</p>}
        <Workspace tools={p.tools} initialFiles={p.files} images={p.images} typing={p.typing} value={response} readOnly />
      </div>
    );
  }
  const input = (q.payload as { input?: unknown }).input;
  return (
    <div className="flex flex-col gap-3">
      {input === "flowchart" && <FlowDiagram nodes={response.flowchart ?? []} vertical />}
      {typeof input === "object" && input !== null && (
        <CodeEditor value={response.text ?? ""} lang={(input as { code: "python" }).code} readOnly minHeight="4rem" />
      )}
      {input === "text" || input === undefined ? (
        response.text?.trim() ? (
          <p className="rounded-lg border border-line bg-paper p-3 whitespace-pre-wrap">{response.text}</p>
        ) : (
          <p className="text-muted">Бичсэн хариулт алга.</p>
        )
      ) : null}
    </div>
  );
}

export function GradeCard({
  attemptId,
  question: q,
  response,
  sharedFrom,
  initialScores,
  initialComment,
}: {
  attemptId: string;
  question: GradeQuestion;
  response: AnswerResponse;
  sharedFrom: string | null;
  initialScores: (number | null)[];
  initialComment: string;
}) {
  const [scores, setScores] = useState(initialScores);
  const [comment, setComment] = useState(initialComment);
  const { status, error, save } = useGradeSaver(attemptId, q.id);
  const total = scores.reduce<number>((s, x) => s + (x ?? 0), 0);
  const graded = scores.every((s) => s !== null);
  const parts = q.type === "task" ? (q.payload as TaskPayload).parts : [];

  const marks = Object.fromEntries(
    q.rubric.filter((r) => r.blank && r.accept).map((r) => [r.blank!, matches(response.blanks?.[r.blank!], r.accept!)]),
  );

  const set = (i: number, v: number | null) => {
    const next = scores.map((s, j) => (j === i ? v : s));
    setScores(next);
    save(next, comment);
  };

  // Рубрикийг практик даалгаврын хэсгээр (П1.1, П1.2…) бүлэглэнэ.
  const groups: { title: string | null; items: { item: TaskRubricItem; index: number }[] }[] = [];
  q.rubric.forEach((item, index) => {
    const title = item.part ? `${item.part}. ${parts.find((p) => p.n === item.part)?.text ?? ""}` : null;
    const last = groups[groups.length - 1];
    if (last && last.title === title) last.items.push({ item, index });
    else groups.push({ title, items: [{ item, index }] });
  });

  return (
    <article className="grid gap-5 rounded-2xl border border-line bg-surface p-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="qnum">{q.number}</span>
          {q.type === "task" && <h3 className="text-lg font-bold">{(q.payload as TaskPayload).title}</h3>}
        </div>
        <Markdown source={q.prompt} blanks={response.blanks ?? {}} marks={marks} />
        <StudentAnswer q={q} response={response} sharedFrom={sharedFrom} />
        {q.keyText && (
          <details className="rounded-lg bg-good-tint/60 px-3 py-2">
            <summary className="cursor-pointer text-sm font-semibold text-good">Жишиг хариулт</summary>
            <pre className="mt-2 font-mono text-[0.85rem] whitespace-pre-wrap">{q.keyText}</pre>
          </details>
        )}
      </div>
      <aside className="flex flex-col gap-3 xl:border-l xl:border-line xl:pl-5">
        <div className="flex items-baseline justify-between">
          <span className="font-semibold">Шалгуур</span>
          <span className={`font-mono text-xl font-bold tabular-nums ${graded ? "" : "text-warn"}`}>
            {total}/{q.points}
          </span>
        </div>
        {groups.map((g, gi) => (
          <div key={gi} className="flex flex-col gap-2">
            {g.title && <p className="border-t border-line pt-2 text-sm font-semibold text-indigo">{g.title}</p>}
            {g.items.map(({ item, index }) => (
              <div key={index} className="flex items-start justify-between gap-3">
                <span className="text-sm">
                  {item.label}
                  {item.blank && <span className="ml-1 rounded bg-tint px-1 text-xs text-indigo">автомат</span>}
                </span>
                <ScoreInput value={scores[index]} max={item.points} label={item.label} onChange={(v) => set(index, v)} />
              </div>
            ))}
          </div>
        ))}
        <button
          type="button"
          className="btn btn-ghost self-start text-sm"
          onClick={() => {
            const full = q.rubric.map((r) => r.points);
            setScores(full);
            save(full, comment);
          }}
        >
          Бүгдэд бүтэн оноо
        </button>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Тайлбар</span>
          <textarea
            className="field min-h-16 text-sm"
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              save(scores, e.target.value);
            }}
          />
        </label>
        <StatusText status={status} error={error} />
      </aside>
    </article>
  );
}

export function AttemptHeaderActions({
  attemptId,
  examId,
  note,
  nextId,
}: {
  attemptId: string;
  examId: string;
  note: string;
  nextId?: string;
}) {
  const [value, setValue] = useState(note);
  const [pending, start] = useTransition();
  useEffect(() => setValue(note), [note]);
  return (
    <div className="mt-4 flex flex-wrap items-end gap-3">
      <label className="flex min-w-64 flex-1 flex-col gap-1">
        <span className="text-sm font-semibold">Тэмдэглэл (уншиж өгсөн, техникийн саад г.м.)</span>
        <input
          className="field"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => value !== note && start(() => saveNote(attemptId, value))}
        />
      </label>
      {nextId && (
        <Link href={`/admin/attempts/${nextId}`} className="btn btn-primary">
          Дараагийн сурагч →
        </Link>
      )}
      <button
        type="button"
        className="btn btn-danger"
        disabled={pending}
        onClick={() =>
          confirm("Энэ сурагчийн оролдлогыг бүх хариулттай нь устгах уу? Буцаах боломжгүй.") &&
          start(() => deleteAttempt(attemptId, examId))
        }
      >
        Оролдлогыг устгах
      </button>
    </div>
  );
}

function formatAway(ms?: number) {
  if (ms === undefined) return "буцаж ирээгүй";
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} сек` : `${Math.floor(s / 60)} мин ${s % 60} сек`;
}

export function FocusLog({
  attemptId,
  log,
  count,
  limit,
  ended,
  canReset,
}: {
  attemptId: string;
  log: FocusEvent[];
  count: number;
  limit: number;
  ended: boolean;
  canReset: boolean;
}) {
  const [pending, start] = useTransition();
  const tone = ended ? "bad" : count > 0 ? "warn" : "muted";
  return (
    <section
      className={`rounded-xl border p-4 ${
        tone === "bad" ? "border-bad bg-bad-tint" : tone === "warn" ? "border-warn bg-warn-tint" : "border-line bg-surface"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={`font-bold ${tone === "bad" ? "text-bad" : tone === "warn" ? "text-warn" : ""}`}>
          {ended
            ? `Өөр таб руу ${count} удаа шилжсэн тул автоматаар дуусгасан`
            : `Таб сольсон: ${count}${limit > 0 ? `/${limit}` : ""}`}
        </h2>
        {canReset && (
          <button
            type="button"
            className="btn btn-ghost py-1 text-sm"
            disabled={pending}
            onClick={() =>
              confirm("Тоолуурыг тэглэх үү? Санамсаргүй гарсан үед ашиглана. Бүртгэл хадгалагдана.") &&
              start(() => resetFocus(attemptId))
            }
          >
            Тоолуурыг тэглэх
          </button>
        )}
      </div>
      <ol className="mt-2 flex flex-col gap-1 text-sm">
        {log.map((e, i) => (
          <li key={i} className="flex gap-3">
            <span className="w-6 text-right text-muted">{i + 1}.</span>
            <span className="font-mono tabular-nums">
              {new Date(e.at).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
            </span>
            <span>{e.section === "A" ? "А хэсэг" : "Б хэсэг"}</span>
            <span className={e.kind === "window" ? "text-muted" : "font-semibold"}>
              {e.kind === "window" ? "Хуудаснаас гадна дарсан" : "Таб сольсон"}
            </span>
            <span className="text-muted">· {formatAway(e.awayMs)}</span>
          </li>
        ))}
      </ol>
      {log.some((e) => e.kind === "window") && (
        <p className="mt-2 text-sm text-muted">
          «Хуудаснаас гадна дарсан» нь хаягийн мөр, хөтчийн popup эсвэл өөр програм дээр дарсан гэсэн үг. Тоологдохгүй.
        </p>
      )}
    </section>
  );
}
