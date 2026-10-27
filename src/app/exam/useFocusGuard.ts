"use client";

import type { FocusKind } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { focusLeaveAction, focusReturnAction } from "./actions";

export type FocusWarning = { count: number; limit: number };

/** Хуудас ийм удаан харагдахгүй байвал таб сольсонд тооцно (богино анивчилтыг алгасна). */
const TAB_GRACE_MS = 1500;
/** Хуудас харагдаж байгаа ч focus ийм удаан алдвал багшид бүртгэнэ (тоологдохгүй). */
const WINDOW_GRACE_MS = 2000;

type Away = { since: number; id: string | null; reported: Promise<unknown> | null };

/**
 * Хоёр төрлийн гаралтыг тусад нь хянана:
 * - tab: хуудас харагдахгүй болох (өөр таб, цонх жижигрүүлэх, өөр цонх бүтэн дарах).
 *   Зөвхөн энэ нь тоологдож, хязгаарт хүрвэл сервер шалгалтыг дуусгана.
 * - window: хуудас харагдаж байгаа ч focus-гүй (хаягийн мөр, хөтчийн popup, өөр програм).
 *   Шалгалтгүй үйлдлээс ч болдог тул зөвхөн багшид харагдана.
 * Preview iframe дотор дарахад document.hasFocus() үнэн хэвээр тул тооцохгүй. Iframe-д
 * focus байхад өөр програм руу шилжвэл blur ирдэггүй тул секунд тутам бас шалгана.
 */
export function useFocusGuard({
  enabled,
  initialCount,
  beforeLeave,
  onEnded,
}: {
  enabled: boolean;
  initialCount: number;
  /** Гарахаас өмнө хадгалагдаагүй хариултыг хадгална. */
  beforeLeave: () => Promise<unknown>;
  onEnded: () => void;
}) {
  const [warning, setWarning] = useState<FocusWarning | null>(null);
  const [count, setCount] = useState(initialCount);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const callbacks = useRef({ beforeLeave, onEnded });
  callbacks.current = { beforeLeave, onEnded };

  useEffect(() => {
    let hidden: Away | null = null;
    let unfocused: Away | null = null;

    const report = (away: Away, kind: FocusKind, awayMs?: number) => {
      if (!enabledRef.current) return;
      away.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      void callbacks.current.beforeLeave().catch(() => {});
      away.reported = send(kind, away.id, awayMs).then((result) => {
        if (!result) return;
        if (kind === "tab") setCount(result.count);
        if (result.ended) callbacks.current.onEnded();
        else if (kind === "tab") setWarning({ count: result.count, limit: result.limit });
      });
    };
    // Сервер түр гацвал дахин илгээнэ; ижил id тул давхар тоологдохгүй.
    const send = async (kind: FocusKind, id: string, awayMs?: number) => {
      for (let i = 0; i < 3; i++) {
        try {
          return await focusLeaveAction(kind, id, awayMs);
        } catch {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
      return null;
    };
    // Буцаж ирснийг гарсан бичлэг серверт хүрсний дараа л илгээнэ.
    const close = (away: Away) => {
      const { id, reported } = away;
      const ms = Date.now() - away.since;
      if (id && reported) void reported.then(() => focusReturnAction(id, ms)).catch(() => {});
    };

    const check = () => {
      const now = Date.now();
      if (document.visibilityState === "hidden") {
        hidden ??= { since: now, id: null, reported: null };
        if (!hidden.id && now - hidden.since >= TAB_GRACE_MS) report(hidden, "tab");
        return;
      }
      if (hidden) {
        // Safari зэрэг далд табын timer-ийг зогсоодог тул буцаж ирэхэд нь л мэдэгдэж болно.
        if (hidden.id) close(hidden);
        else if (now - hidden.since >= TAB_GRACE_MS) report(hidden, "tab", now - hidden.since);
        hidden = null;
      }
      if (document.hasFocus()) {
        if (unfocused?.id) close(unfocused);
        unfocused = null;
        return;
      }
      // Хөтчийн өөрийн цонх (нууц үг хадгалах г.м.) богино хугацаанд focus авахыг алгасна.
      unfocused ??= { since: now, id: null, reported: null };
      if (!unfocused.id && now - unfocused.since >= WINDOW_GRACE_MS) report(unfocused, "window");
    };
    // blur-ийн үед focus iframe руу шилжсэн эсэх нь дараагийн tick-д л мэдэгдэнэ.
    const onBlur = () => setTimeout(check, 0);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", check);
    const poll = setInterval(check, 500);
    return () => {
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", check);
      clearInterval(poll);
    };
  }, []);

  return { warning, count, dismiss: () => setWarning(null) };
}
