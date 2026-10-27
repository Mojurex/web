"use client";

import { Markdown } from "@/components/Markdown";
import type { AnswerResponse, PublicQuestion, Section } from "@/lib/types";
import { workspaceOwner } from "@/lib/types";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { submitSectionAction } from "./actions";
import { useAutosave, type SaveStatus } from "./useAutosave";
import { useFocusGuard } from "./useFocusGuard";

const CodeEditor = dynamic(() => import("@/components/CodeEditor").then((m) => m.CodeEditor), { ssr: false });
const FlowchartEditor = dynamic(() => import("@/components/FlowchartEditor").then((m) => m.FlowchartEditor), {
  ssr: false,
});
const Workspace = dynamic(() => import("@/components/Workspace").then((m) => m.Workspace), { ssr: false });

type Props = {
  title: string;
  studentName: string;
  section: Section;
  deadline: number;
  serverNow: number;
  sectionMinutes: number;
  questions: PublicQuestion[];
  initialAnswers: Record<string, AnswerResponse>;
  focusLimit: number;
  focusCount: number;
};

function isAnswered(q: PublicQuestion, r: AnswerResponse | undefined): boolean {
  if (!r) return false;
  if (q.type === "mcq") return !!r.choice;
  if (q.type === "open") {
    return !!r.text?.trim() || !!r.flowchart?.length || Object.values(r.blanks ?? {}).some((v) => v.trim());
  }
  const changed = r.files && Object.entries(r.files).some(([f, v]) => v !== (q.payload.files[f] ?? ""));
  return !!changed || !!r.flowchart?.length || !!r.notes?.trim();
}

function Timer({
  deadline,
  serverNow,
  offset,
  total,
  onExpire,
}: {
  deadline: number;
  serverNow: number;
  offset: number;
  total: number;
  onExpire: () => void;
}) {
  // Эхний render серверийн цагаар (hydration таарна), дараа нь хөтчийн цагаар шинэчилнэ.
  const [now, setNow] = useState(serverNow);
  const fired = useRef(false);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + offset), 500);
    return () => clearInterval(t);
  }, [offset]);
  const left = Math.max(0, deadline - now);
  useEffect(() => {
    if (left === 0 && !fired.current) {
      fired.current = true;
      onExpire();
    }
  }, [left, onExpire]);
  const s = Math.ceil(left / 1000);
  const label = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const low = left < 5 * 60_000;
  return (
    <>
      <div className={`font-mono text-2xl font-bold tabular-nums ${low ? "text-bad" : ""}`} role="timer" aria-label={`Үлдсэн хугацаа ${label}`}>
        {label}
      </div>
      {/* Хугацаа багасах тусам хорогдох зурвас. */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-tint">
        <div
          className={`h-full transition-[width] duration-500 ${low ? "bg-bad" : "bg-indigo"}`}
          style={{ width: `${Math.min(100, (left / (total * 60_000)) * 100)}%` }}
        />
      </div>
    </>
  );
}

function SaveBadge({ status, error }: { status: SaveStatus; error: string }) {
  const text = { saved: "Хадгалагдсан", saving: "Хадгалж байна…", error: error || "Хадгалж чадсангүй", ended: error }[status];
  return (
    <span aria-live="polite" className={`text-sm ${status === "error" || status === "ended" ? "text-bad" : "text-muted"}`}>
      {text}
    </span>
  );
}

function McqOptions({ q, value, onChange }: { q: Extract<PublicQuestion, { type: "mcq" }>; value?: string; onChange: (v: string) => void }) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={`${q.number}-р асуултын хариулт`}>
      {q.payload.options.map(([key, text]) => {
        const selected = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(key)}
            className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
              selected ? "border-indigo bg-tint" : "border-line bg-surface hover:border-indigo/50"
            }`}
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 font-bold ${
                selected ? "border-indigo bg-indigo text-white" : "border-ink"
              }`}
            >
              {key}
            </span>
            <span className="pt-0.5 font-medium break-words">{text}</span>
          </button>
        );
      })}
    </div>
  );
}

function OpenAnswer({
  q,
  value,
  onChange,
}: {
  q: Extract<PublicQuestion, { type: "open" }>;
  value: AnswerResponse;
  onChange: (v: AnswerResponse) => void;
}) {
  const input = q.payload.input;
  if (input === "none") return null;
  if (input === "flowchart") {
    return (
      <div className="mt-5">
        <FlowchartEditor nodes={value.flowchart ?? []} onChange={(flowchart) => onChange({ ...value, flowchart })} />
      </div>
    );
  }
  if (typeof input === "object") {
    return (
      <div className="mt-5">
        <CodeEditor value={value.text ?? ""} onChange={(text) => onChange({ ...value, text })} lang={input.code} />
      </div>
    );
  }
  return (
    <textarea
      className="field mt-5 min-h-40"
      value={value.text ?? ""}
      onChange={(e) => onChange({ ...value, text: e.target.value })}
      aria-label="Хариулт"
      placeholder="Хариултаа энд бичнэ үү"
    />
  );
}

export function ExamClient(props: Props) {
  const { section, questions } = props;
  const router = useRouter();
  const [answers, setAnswers] = useState(props.initialAnswers);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const offset = useMemo(() => props.serverNow - Date.now(), [props.serverNow]);

  const onEnded = useCallback(() => router.refresh(), [router]);
  const { queue, flush, status, error } = useAutosave(onEnded);

  const update = (q: PublicQuestion, response: AnswerResponse) => {
    setAnswers((a) => ({ ...a, [q.id]: response }));
    queue(q.id, response);
  };

  const submit = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(false);
    // Сервер түр гацвал хэдэн удаа дахин оролдоно.
    for (let i = 0; i < 4; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 3000));
      if (!(await flush())) continue;
      if (await submitSectionAction(section).then(() => true, () => false)) return router.refresh();
    }
    setSubmitting(false);
    setSubmitError(true);
  }, [flush, router, section]);

  const focus = useFocusGuard({ enabled: !submitting, initialCount: props.focusCount, beforeLeave: flush, onEnded });
  const focusCount = focus.count;

  // Б хэсэгт workspace хуваалцдаг даалгавруудыг нэг таб болгоно.
  const groups = useMemo(() => {
    const owners = new Map<string, PublicQuestion[]>();
    for (const q of questions) {
      const owner = workspaceOwner(questions, q);
      owners.set(owner.id, [...(owners.get(owner.id) ?? []), q]);
    }
    return [...owners.entries()].map(([ownerId, members]) => ({ ownerId, members }));
  }, [questions]);

  const items = section === "A" ? questions.map((q) => ({ ownerId: q.id, members: [q] })) : groups;
  const [index, setIndex] = useState(0);
  const current = items[Math.min(index, items.length - 1)];
  const unanswered = items.filter((g) => !isAnswered(g.members[0], answers[g.ownerId])).length;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
        <div className="relative mx-auto flex max-w-[110rem] items-center gap-4 px-4 py-3 md:px-6">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{props.title}</p>
            <p className="truncate text-sm text-muted">
              {props.studentName} · {section === "A" ? "А хэсэг · Онол" : "Б хэсэг · Практик"}
            </p>
          </div>
          {focusCount > 0 && (
            <span className="rounded-full bg-warn-tint px-2.5 py-0.5 text-sm font-semibold text-warn">
              Таб сольсон: {focusCount}
              {props.focusLimit > 0 && `/${props.focusLimit}`}
            </span>
          )}
          {submitError ? (
            <span role="alert" className="text-sm text-bad">
              Илгээж чадсангүй. Дахин илгээнэ үү.
            </span>
          ) : (
            <SaveBadge status={status} error={error} />
          )}
          <Timer
            deadline={props.deadline}
            serverNow={props.serverNow}
            offset={offset}
            total={props.sectionMinutes}
            onExpire={submit}
          />
        </div>
      </header>

      <div
        className={`mx-auto grid w-full max-w-[110rem] flex-1 content-start gap-6 px-4 py-6 md:px-6 ${
          section === "A" ? "lg:grid-cols-[13rem_1fr]" : ""
        }`}
      >
        <nav
          aria-label={section === "A" ? "Асуултууд" : "Даалгаврууд"}
          className={section === "A" ? "lg:sticky lg:top-24 lg:self-start" : "flex flex-wrap items-center gap-x-6 gap-y-3"}
        >
          <ol
            className={`flex gap-2 ${
              section === "A" ? "-mx-1 overflow-x-auto px-1 py-1 lg:grid lg:grid-cols-4 lg:overflow-visible" : "flex-wrap"
            }`}
          >
            {items.map((g, i) => {
              const done = isAnswered(g.members[0], answers[g.ownerId]);
              const label = g.members.map((m) => m.number).join("–");
              return (
                <li key={g.ownerId} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-current={i === index ? "step" : undefined}
                    aria-label={`${label}-р ${section === "A" ? "асуулт" : "даалгавар"}${done ? ", хариулсан" : ""}`}
                    className={`grid h-10 min-w-10 place-items-center rounded-full border-2 px-2 text-sm font-bold tabular-nums ${
                      done ? "border-indigo bg-indigo text-white" : "border-line bg-surface text-ink"
                    } ${i === index ? "ring-2 ring-indigo ring-offset-2" : ""}`}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ol>
          <p className={`text-sm text-muted ${section === "A" ? "mt-4" : ""}`}>
            {unanswered === 0 ? "Бүгдэд хариулсан." : `${unanswered} ${section === "A" ? "асуулт" : "даалгавар"} хариулаагүй.`}
          </p>
          <button
            type="button"
            className={`btn btn-primary ${section === "A" ? "mt-4 w-full" : "ml-auto"}`}
            onClick={() => setConfirming(true)}
            disabled={submitting}
          >
            {section === "A" ? "А хэсгийг илгээх" : "Шалгалтыг дуусгах"}
          </button>
          {section === "A" && (
            <p className="mt-4 text-sm text-muted">
              Шалгалтын үеэр өөр таб руу шилжих, цонхоо жижигрүүлэхийг багш харна.
              {props.focusLimit > 0 && ` ${props.focusLimit} удаа шилжвэл шалгалт автоматаар дуусна.`}
            </p>
          )}
        </nav>

        <main>
          {section === "A" ? (
            <QuestionView
              q={current.members[0]}
              value={answers[current.ownerId] ?? {}}
              onChange={(r) => update(current.members[0], r)}
            />
          ) : (
            <TaskView
              key={current.ownerId}
              members={current.members}
              value={answers[current.ownerId] ?? {}}
              onChange={(r) => update(current.members[0], r)}
            />
          )}
          <div className={`mt-8 flex justify-between ${section === "A" ? "max-w-3xl" : ""}`}>
            <button type="button" className="btn btn-ghost" onClick={() => setIndex(index - 1)} disabled={index === 0}>
              ← Өмнөх
            </button>
            {index < items.length - 1 && (
              <button type="button" className="btn btn-ghost" onClick={() => setIndex(index + 1)}>
                Дараах →
              </button>
            )}
          </div>
        </main>
      </div>

      {focus.warning && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-ink/60 p-4" role="alertdialog" aria-modal aria-labelledby="focus-title">
          <div className="w-full max-w-md rounded-2xl border-t-4 border-warn bg-surface p-6">
            <h2 id="focus-title" className="text-xl font-bold">
              Та өөр таб руу шилжлээ
            </h2>
            <p className="mt-3">
              Энэ нь {focus.warning.count} дахь удаа бөгөөд багшид бүртгэгдлээ.
              {focus.warning.limit > 0 &&
                (focus.warning.limit - focus.warning.count === 1
                  ? " Дахин гарвал шалгалт тань автоматаар дуусна."
                  : ` Нийт ${focus.warning.limit} удаа гарвал шалгалт автоматаар дуусна.`)}
            </p>
            <div className="mt-6 flex justify-end">
              <button type="button" className="btn btn-primary" onClick={focus.dismiss} autoFocus>
                Ойлголоо, үргэлжлүүлэх
              </button>
            </div>
          </div>
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-ink/40 p-4" role="dialog" aria-modal aria-labelledby="confirm-title">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6">
            <h2 id="confirm-title" className="text-xl font-bold">
              {section === "A" ? "А хэсгийг илгээх үү?" : "Шалгалтыг дуусгах уу?"}
            </h2>
            <p className="mt-3">
              Илгээсний дараа хариултаа өөрчлөх боломжгүй.
              {section === "A" && " Хэрэв практик хэсэгтэй бол түүний хугацаа шууд эхэлнэ."}
            </p>
            {unanswered > 0 && (
              <p className="mt-3 rounded-lg bg-warn-tint px-3 py-2 text-warn">
                {unanswered} {section === "A" ? "асуултад" : "даалгаварт"} хариулаагүй байна.
              </p>
            )}
            {submitError && (
              <p className="mt-3 rounded-lg bg-bad-tint px-3 py-2 text-bad">
                Сервер хариу өгсөнгүй. Хэсэг хүлээгээд дахин «Илгээх» дарна уу.
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)} disabled={submitting}>
                Буцах
              </button>
              <button type="button" className="btn btn-primary" onClick={submit} disabled={submitting}>
                {submitting ? "Илгээж байна…" : "Илгээх"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionView({ q, value, onChange }: { q: PublicQuestion; value: AnswerResponse; onChange: (r: AnswerResponse) => void }) {
  return (
    <article className="max-w-3xl rounded-2xl border border-line bg-surface p-5 md:p-8" aria-labelledby={`q-${q.id}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="qnum" id={`q-${q.id}`} aria-label={`${q.number}-р асуулт`}>
          {q.number}
        </span>
        <span className="text-sm text-muted">{q.points} оноо</span>
      </div>
      <div className="text-[1.05rem]">
        <Markdown
          source={q.prompt}
          blanks={value.blanks}
          onBlankChange={(id, v) => onChange({ ...value, blanks: { ...value.blanks, [id]: v } })}
        />
      </div>
      {q.type === "mcq" && <McqOptions q={q} value={value.choice} onChange={(choice) => onChange({ ...value, choice })} />}
      {q.type === "open" && <OpenAnswer q={q} value={value} onChange={onChange} />}
    </article>
  );
}

function TaskView({
  members,
  value,
  onChange,
}: {
  members: PublicQuestion[];
  value: AnswerResponse;
  onChange: (r: AnswerResponse) => void;
}) {
  const tasks = members.filter((m): m is Extract<PublicQuestion, { type: "task" }> => m.type === "task");
  const owner = tasks[0];
  const tools = owner.payload.tools === "offline" ? [] : owner.payload.tools;
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(20rem,26rem)_1fr]">
      <aside className="flex flex-col gap-6">
        {tasks.map((t) => (
          <section key={t.id} className="rounded-2xl border border-line bg-surface p-5">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-bold">
                {t.number}. {t.payload.title}
              </h2>
              <span className="shrink-0 text-sm text-muted">{t.points} оноо</span>
            </div>
            <Markdown source={t.prompt} />
            <ol className="mt-3 flex flex-col gap-2">
              {t.payload.parts.map((p) => (
                <li key={p.n} className="flex gap-3 border-t border-line pt-2 text-[0.95rem]">
                  <span className="w-12 shrink-0 font-semibold text-indigo">{p.n}</span>
                  <span className="flex-1">{p.text}</span>
                  <span className="shrink-0 text-sm text-muted">{p.points}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </aside>
      <section aria-label="Ажлын орчин" className="min-w-0">
        <Workspace
          tools={tools}
          initialFiles={owner.payload.files}
          images={owner.payload.images}
          value={value}
          onChange={onChange}
        />
      </section>
    </div>
  );
}
