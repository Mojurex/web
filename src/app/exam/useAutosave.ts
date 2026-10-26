"use client";

import type { AnswerResponse } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { saveAnswerAction } from "./actions";

export type SaveStatus = "saved" | "saving" | "error" | "ended";

/**
 * Хариулт өөрчлөгдөх бүрт 1 секундын дараа хадгална. Алдаа гарвал 5 секунд
 * тутам дахин оролдоно. flush() нь илгээхийн өмнө бүх хүлээгдэж буйг хадгална.
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
        result = await saveAnswerAction(id, response);
      } catch {
        // Сүлжээний алдаа: дахин оролдоно.
        if (!pending.current.has(id)) pending.current.set(id, response);
        setStatus("error");
        setError("Интернэт тасарсан байж магадгүй. Дахин оролдож байна…");
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
    if (pending.current.size === 0) return;
    setStatus("saving");
    running.current = run().finally(() => (running.current = null));
    await running.current;
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
