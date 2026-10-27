"use client";

import type { SaveResult } from "@/lib/exam";
import type { AnswerResponse } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "saved" | "saving" | "error" | "ended";

/** Сервер гацвал хүсэлтийг таслаад дахин оролдоно (Vercel өөрөө 30 с хүлээдэг). */
const SAVE_TIMEOUT_MS = 15_000;

/** Сүлжээ тасрах, хугацаа хэтрэх, сервер 5xx өгөх үед throw хийнэ. */
async function saveRequest(questionId: string, response: AnswerResponse): Promise<SaveResult> {
  const res = await fetch("/exam/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionId, response }),
    signal: AbortSignal.timeout(SAVE_TIMEOUT_MS),
  });
  if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Хариулт өөрчлөгдөх бүрт 1 секундын дараа хадгална. Алдаа гарвал 5 секунд
 * тутам дахин оролдоно. flush() нь бүх хүлээгдэж буйг хадгалаад, сүлжээний
 * алдаагаар үлдсэн зүйл байхгүй бол true буцаана.
 */
export function useAutosave(onEnded: () => void) {
  const pending = useRef(new Map<string, AnswerResponse>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = useRef<Promise<void> | null>(null);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [error, setError] = useState("");

  const run = useCallback(async () => {
    let rejected = "";
    while (pending.current.size > 0) {
      const [id, response] = pending.current.entries().next().value!;
      pending.current.delete(id);
      let result;
      try {
        result = await saveRequest(id, response);
      } catch {
        // Сүлжээ эсвэл сервер түр гацсан: дахин оролдоно.
        if (!pending.current.has(id)) pending.current.set(id, response);
        setStatus("error");
        setError("Хадгалж чадсангүй. Дахин оролдож байна…");
        timer.current = setTimeout(() => void flushRef.current(), 5000);
        return;
      }
      if (!result.ok) {
        if (result.ended) {
          pending.current.clear();
          setStatus("ended");
          setError(result.error);
          onEnded();
          return;
        }
        rejected = result.error;
      }
    }
    setStatus(rejected ? "error" : "saved");
    setError(rejected);
  }, [onEnded]);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (running.current) await running.current;
    if (pending.current.size > 0) {
      setStatus("saving");
      running.current = run().finally(() => (running.current = null));
      await running.current;
    }
    return pending.current.size === 0;
  }, [run]);
  const flushRef = useRef(flush);
  flushRef.current = flush;

  const queue = useCallback(
    (questionId: string, response: AnswerResponse) => {
      pending.current.set(questionId, response);
      setStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), 1000);
    },
    [flush],
  );

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (pending.current.size > 0) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  return { queue, flush, status, error };
}
