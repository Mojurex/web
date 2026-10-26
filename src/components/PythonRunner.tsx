"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Line = { stream: "stdout" | "stderr" | "stdin"; text: string };
type Status = "loading" | "idle" | "running" | "waiting" | "unsupported";

const MAX_CHARS = 200_000;

/**
 * Pyodide worker-ийг удирдана. input()-д хариулт бичих консол, зогсоох товчтой.
 * Хөтөч cross-origin isolated биш бол (SharedArrayBuffer байхгүй) ажиллахгүй.
 */
export function PythonRunner({ code, autoload = true }: { code: string; autoload?: boolean }) {
  const workerRef = useRef<Worker | null>(null);
  const sabRef = useRef<{ ctrl: Int32Array; data: Uint8Array; interrupt: Uint8Array } | null>(null);
  const [status, setStatus] = useState<Status>(autoload ? "loading" : "idle");
  const runOnReady = useRef(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const sizeRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  const append = useCallback((line: Line) => {
    sizeRef.current += line.text.length;
    if (sizeRef.current > MAX_CHARS) return;
    setLines((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.stream === line.stream && !last.text.endsWith("\n")) {
        return [...prev.slice(0, -1), { ...last, text: last.text + line.text }];
      }
      return [...prev, line];
    });
  }, []);

  const start = useCallback(() => {
    if (typeof SharedArrayBuffer === "undefined" || !crossOriginIsolated) {
      setStatus("unsupported");
      return;
    }
    workerRef.current?.terminate();
    const sab = new SharedArrayBuffer(8 + 64 * 1024);
    const interrupt = new SharedArrayBuffer(1);
    sabRef.current = { ctrl: new Int32Array(sab, 0, 2), data: new Uint8Array(sab, 8), interrupt: new Uint8Array(interrupt) };
    const worker = new Worker("/py-worker.mjs", { type: "module" });
    worker.onmessage = ({ data: msg }) => {
      if (msg.type === "ready") {
        setStatus("idle");
        if (runOnReady.current) {
          runOnReady.current = false;
          runRef.current();
        }
      }
      else if (msg.type === "out") append({ stream: msg.stream, text: msg.text });
      else if (msg.type === "input") {
        setStatus("waiting");
        setTimeout(() => inputRef.current?.focus(), 0);
      } else if (msg.type === "done") {
        setStatus("idle");
        if (sizeRef.current > MAX_CHARS) append({ stream: "stderr", text: "\n… гаралт хэт урт тул таслав.\n" });
      } else if (msg.type === "fatal") {
        setStatus("unsupported");
        append({ stream: "stderr", text: `Python ачаалж чадсангүй: ${msg.text}\n` });
      }
    };
    worker.postMessage({ type: "init", sab, interrupt });
    workerRef.current = worker;
    setStatus("loading");
  }, [append]);

  useEffect(() => {
    if (autoload) start();
    return () => workerRef.current?.terminate();
  }, [start, autoload]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [lines]);

  const run = () => {
    if (!workerRef.current) {
      // autoload=false: анх дарахад Python-ийг ачаалаад дараа нь ажиллуулна.
      runOnReady.current = true;
      start();
      return;
    }
    if (!sabRef.current) return;
    sabRef.current.interrupt[0] = 0;
    sizeRef.current = 0;
    setLines([]);
    setStatus("running");
    workerRef.current.postMessage({ type: "run", code });
  };

  const runRef = useRef(run);
  runRef.current = run;

  const reply = (text: string | null) => {
    const s = sabRef.current;
    if (!s) return;
    const bytes = new TextEncoder().encode(text ?? "").slice(0, s.data.length);
    s.data.set(bytes);
    Atomics.store(s.ctrl, 1, text === null ? -1 : bytes.length);
    Atomics.store(s.ctrl, 0, 1);
    Atomics.notify(s.ctrl, 0);
  };

  const submitInput = (e: React.FormEvent) => {
    e.preventDefault();
    append({ stream: "stdin", text: `${input}\n` });
    reply(input);
    setInput("");
    setStatus("running");
  };

  const stop = () => {
    const s = sabRef.current;
    if (!s) return;
    if (status === "waiting") {
      s.interrupt[0] = 2;
      reply(null);
    } else {
      s.interrupt[0] = 2; // KeyboardInterrupt
      // Python код interrupt шалгахгүй удаан ажиллавал worker-ийг дахин эхлүүлнэ.
      setTimeout(() => {
        if (workerRef.current && statusRef.current === "running") {
          append({ stream: "stderr", text: "Програмыг зогсоолоо.\n" });
          start();
        }
      }, 1500);
    }
  };
  const busy = status === "running" || status === "waiting";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button type="button" className="btn btn-primary" onClick={run} disabled={status !== "idle"}>
          ▶ Ажиллуулах
        </button>
        {busy && (
          <button type="button" className="btn btn-danger" onClick={stop}>
            ■ Зогсоох
          </button>
        )}
        <span className="text-sm text-muted" aria-live="polite">
          {status === "loading" && "Python ачаалж байна…"}
          {status === "running" && "Ажиллаж байна…"}
          {status === "waiting" && "Програм таны оруулахыг хүлээж байна"}
        </span>
      </div>
      {status === "unsupported" ? (
        <p className="rounded-lg bg-bad-tint p-3 text-bad">
          Энэ хөтөч дээр Python ажиллуулах боломжгүй байна. Chrome, Edge эсвэл Firefox-ын шинэ хувилбар ашиглана уу.
        </p>
      ) : (
        <div
          className="max-h-72 min-h-28 overflow-y-auto rounded-lg bg-ink px-3 py-2 font-mono text-[0.85rem] leading-relaxed text-white"
          role="log"
          aria-label="Консол"
          onClick={() => inputRef.current?.focus()}
        >
          {lines.length === 0 && status === "idle" && <span className="text-white/50">Гаралт энд харагдана.</span>}
          {lines.map((l, i) => (
            <span
              key={i}
              className={`whitespace-pre-wrap ${l.stream === "stderr" ? "text-[#ff9b93]" : l.stream === "stdin" ? "text-[#a8e6b8]" : ""}`}
            >
              {l.text}
            </span>
          ))}
          {status === "waiting" && (
            <form onSubmit={submitInput} className="inline">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-48 border-b border-white/60 bg-transparent text-[#a8e6b8] outline-none"
                aria-label="Програмд оруулах утга"
                autoComplete="off"
                spellCheck={false}
              />
            </form>
          )}
          <div ref={endRef} />
        </div>
      )}
    </div>
  );
}
