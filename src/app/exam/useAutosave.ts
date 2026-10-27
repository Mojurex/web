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

/** Бичиж дуусгаад ийм хугацаа өнгөрвөл хадгална. */
const DEBOUNCE_MS = 3000;
/** Тасралтгүй бичиж байсан ч ийм хугацаанаас удаан хүлээлгэхгүй. */
const MAX_WAIT_MS = 10_000;

/**
 * Хариулт өөрчлөгдсөнөөс 3 секундын дараа (тасралтгүй бичвэл 10 секунд тутам)
 * хадгална. Алдаа гарвал 5 секунд тутам дахин оролдоно. flush() нь бүх хүлээгдэж
 * буйг хадгалаад, сүлжээний алдаагаар үлдсэн зүйл байхгүй бол true буцаана.
 */
export function useAutosave(onEnded: () => void) {
  const pending = useRef(new Map<string, AnswerResponse>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Хадгалагдаагүй өөрчлөлт анх гарсан цаг (max-wait-д). */
  const dirtySince = useRef<number | null>(null);
  const running = useRef<Promise<void> | null>(null);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [error, setError] = useState("");

  /**
   * Эхлэх мөчийн өөрчлөлтүүдийг л хадгална: хадгалж байх хооронд бичсэн нь дараагийн
   * удаад үлдэнэ (эс бөгөөс тасралтгүй бичихэд хүсэлт зогсолтгүй явна).
   * Сүлжээний алдаагүй дууссан бол true.
   */
  const run = useCallback(async (): Promise<boolean> => {
    const batch = [...pending.current];
    pending.current.clear();
    let rejected = "";
    for (const [i, [id, response]] of batch.entries()) {
      let result;
      try {
        result = await saveRequest(id, response);
      } catch {
        // Сүлжээ эсвэл сервер түр гацсан: хадгалагдаагүйг (шинэ нь ирээгүй бол) буцааж дахин оролдоно.
        for (const [rid, r] of batch.slice(i)) if (!pending.current.has(rid)) pending.current.set(rid, r);
        setStatus("error");
        setError("Хадгалж чадсангүй. Дахин оролдож байна…");
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void saveRef.current(), 5000);
        return false;
      }
      if (!result.ok) {
        if (result.ended) {
          pending.current.clear();
          setStatus("ended");
          setError(result.error);
          onEnded();
          return true;
        }
        rejected = result.error;
      }
    }
    setStatus(rejected ? "error" : pending.current.size > 0 ? "saving" : "saved");
    setError(rejected);
    return true;
  }, [onEnded]);

  /** Хүлээгдэж буйг нэг удаа хадгална (timer-ээс). */
  const save = useCallback(async (): Promise<boolean> => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    dirtySince.current = null;
    while (running.current) await running.current;
    if (pending.current.size === 0) return true;
    setStatus("saving");
    const done = run();
    running.current = done.then(() => {}).finally(() => (running.current = null));
    return done;
  }, [run]);
  const saveRef = useRef(save);
  saveRef.current = save;

  /** Илгээх, цонхноос гарахын өмнө: бүгдийг хадгалж дуустал (эсвэл сүлжээ тасартал). */
  const flush = useCallback(async () => {
    while (pending.current.size > 0 || running.current) {
      if (!(await save())) break;
    }
    return pending.current.size === 0;
  }, [save]);

  const queue = useCallback(
    (questionId: string, response: AnswerResponse) => {
      pending.current.set(questionId, response);
      setStatus("saving");
      const now = Date.now();
      dirtySince.current ??= now;
      if (timer.current) clearTimeout(timer.current);
      const wait = Math.min(DEBOUNCE_MS, dirtySince.current + MAX_WAIT_MS - now);
      timer.current = setTimeout(() => void save(), Math.max(0, wait));
    },
    [save],
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
