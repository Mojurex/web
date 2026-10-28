"use client";

import type { TypingSpec } from "@/content/types";
import { fmt1, typingStats, type TypingResponse } from "@/lib/typing";
import { useEffect, useRef, useState } from "react";

const clock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const latin = /[A-Za-z]/;

/** Эх текстийг үсэг бүрээр: шивсэн нь зөв/буруу, дараагийн үсэг доогуур зураастай. */
function TargetText({ target, typed, showCursor }: { target: string; typed: string; showCursor: boolean }) {
  return (
    <p className="rounded-xl border border-line bg-paper p-4 text-xl leading-loose md:text-2xl" aria-label="Шивэх текст">
      {[...target].map((ch, i) => {
        const done = i < typed.length;
        const ok = done && typed[i] === ch;
        const cls = !done
          ? i === typed.length && showCursor
            ? "border-b-2 border-indigo text-ink"
            : "text-muted"
          : ok
            ? "text-ink"
            : "rounded-sm bg-bad-tint text-bad";
        return (
          <span key={i} className={cls}>
            {ch}
          </span>
        );
      })}
    </p>
  );
}

function Stats({ spec, value }: { spec: TypingSpec; value: TypingResponse }) {
  const s = typingStats(spec.text, value.typed, value.elapsedMs, spec.seconds * 1000);
  const items: [string, string][] = [
    ["Хурд", `${fmt1(s.wpm)} үг/мин`],
    ["Нарийвчлал", `${fmt1(s.accuracy)}%`],
    ["Шивсэн", `${s.words} үг`],
    ["Хугацаа", clock(Math.min(value.elapsedMs, spec.seconds * 1000))],
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(([k, v]) => (
        <div key={k} className="rounded-xl border border-line bg-surface px-4 py-3">
          <dt className="text-sm text-muted">{k}</dt>
          <dd className="text-xl font-bold tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * 10 хурууны шивэх дасгал. «Эхлүүлэх» дармагц хугацаа явж, дуусахад шивсэн нь
 * түгжигдэнэ. Хуудсыг дахин ачаалбал эхлүүлсэн цагаас нь үргэлжилнэ. Хуулж буулгахыг
 * хориглоно.
 */
export function TypingTest({
  spec,
  value,
  onChange,
  readOnly = false,
}: {
  spec: TypingSpec;
  value: TypingResponse | undefined;
  onChange?: (v: TypingResponse) => void;
  readOnly?: boolean;
}) {
  const limit = spec.seconds * 1000;
  const target = spec.text.replace(/\s+/g, " ").trim();
  const [now, setNow] = useState(() => Date.now());
  const input = useRef<HTMLTextAreaElement>(null);
  const started = !!value?.startedAt;
  const left = started ? limit - (now - value.startedAt) : limit;
  const finished = !!value?.done || (started && left <= 0);
  const valueRef = useRef(value);
  valueRef.current = value;

  // Хугацаа дуусахад (дахин ачаалсны дараа ч) түгжинэ.
  useEffect(() => {
    if (readOnly || !started || value.done) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      const v = valueRef.current;
      if (v && !v.done && t - v.startedAt >= limit) onChange?.({ ...v, elapsedMs: limit, done: true });
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [readOnly, started, value?.done, limit, onChange]);

  if (readOnly) {
    if (!value?.startedAt) return <p className="text-muted">Шивэх дасгалыг эхлүүлээгүй.</p>;
    return (
      <div className="flex flex-col gap-4">
        <Stats spec={spec} value={value} />
        <TargetText target={target} typed={value.typed.replace(/\s+/g, " ").replace(/^ /, "")} showCursor={false} />
        <div>
          <p className="mb-1 text-sm font-semibold">Сурагчийн шивсэн нь</p>
          <p className="rounded-lg border border-line bg-surface p-3 whitespace-pre-wrap">{value.typed || "—"}</p>
        </div>
      </div>
    );
  }

  const start = () => {
    onChange?.({ typed: "", startedAt: Date.now(), elapsedMs: 0, done: false });
    setTimeout(() => input.current?.focus(), 0);
  };

  const type = (typed: string) => {
    if (!value || finished) return;
    const t = Date.now();
    const elapsedMs = Math.min(t - value.startedAt, limit);
    const complete = typed.replace(/\s+/g, " ").trimStart().length >= target.length;
    onChange?.({ ...value, typed, elapsedMs, done: complete || elapsedMs >= limit });
  };

  const typed = value?.typed ?? "";
  const shown = typed.replace(/\s+/g, " ").replace(/^ /, "");
  const wrongLayout = latin.test(typed.slice(-5)) && !latin.test(target);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
        <p className="text-muted">
          {finished
            ? "Дууслаа. Шивсэн чинь хадгалагдсан."
            : started
              ? "Доорх текстийг 10 хуруугаараа, гар руу харалгүй шивнэ."
              : `«Эхлүүлэх» дармагц ${clock(limit)} минут явна. Нэг л удаа эхлүүлнэ.`}
        </p>
        <div
          className={`font-mono text-3xl font-bold tabular-nums ${started && !finished && left < 30_000 ? "text-bad" : ""}`}
          role="timer"
          aria-label={`Үлдсэн хугацаа ${clock(left)}`}
        >
          {clock(finished ? 0 : left)}
        </div>
      </div>

      <TargetText target={target} typed={shown} showCursor={started && !finished} />

      {!started ? (
        <button type="button" className="btn btn-primary self-start px-8 py-3 text-lg" onClick={start}>
          Эхлүүлэх
        </button>
      ) : finished ? (
        <Stats spec={spec} value={{ ...value, elapsedMs: value.done ? value.elapsedMs : limit }} />
      ) : (
        <>
          {wrongLayout && (
            <p role="alert" className="rounded-lg bg-warn-tint px-3 py-2 text-warn">
              Гарын хэл англи байна. Монгол (кирилл) гар руу шилжүүлнэ үү: Windows дээр Alt+Shift, Mac дээр Control+Space.
            </p>
          )}
          <textarea
            ref={input}
            className="field min-h-36 text-xl leading-relaxed"
            value={typed}
            onChange={(e) => type(e.target.value)}
            onPaste={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Энд шивнэ"
            placeholder="Энд шивнэ үү…"
          />
        </>
      )}
    </div>
  );
}
