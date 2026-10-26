"use client";

import { useEffect, useRef, useState } from "react";
import { focusLeaveAction, focusReturnAction } from "./actions";

export type FocusWarning = { count: number; limit: number };

const BLUR_GRACE_MS = 2000;

/**
 * Сурагч өөр таб (visibilitychange) эсвэл өөр цонх/програм (blur) руу шилжихийг
 * илрүүлнэ. Preview iframe дотор дарахад цонх blur болдог ч document.hasFocus()
 * үнэн хэвээр тул тооцохгүй. Iframe-д focus байхад өөр програм руу шилжвэл blur
 * дахин ирдэггүй тул hasFocus()-ийг секунд тутам бас шалгана.
 * Тоолуур сервер дээр; хязгаарт хүрвэл сервер шалгалтыг дуусгана.
 */
export function useFocusGuard({
  enabled,
  beforeLeave,
  onEnded,
}: {
  enabled: boolean;
  /** Гарахаас өмнө хадгалагдаагүй хариултыг хадгална. */
  beforeLeave: () => Promise<void>;
  onEnded: () => void;
}) {
  const [warning, setWarning] = useState<FocusWarning | null>(null);
  const away = useRef(false);
  const leftAt = useRef(0);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const callbacks = useRef({ beforeLeave, onEnded });
  callbacks.current = { beforeLeave, onEnded };

  useEffect(() => {
    const leave = async (since = Date.now()) => {
      if (away.current || !enabledRef.current) return;
      away.current = true;
      leftAt.current = since;
      await callbacks.current.beforeLeave().catch(() => {});
      const result = await focusLeaveAction().catch(() => null);
      if (!result) return;
      if (result.ended) callbacks.current.onEnded();
      else setWarning({ count: result.count, limit: result.limit });
    };
    const back = () => {
      if (!away.current) return;
      away.current = false;
      void focusReturnAction(Date.now() - leftAt.current).catch(() => {});
    };
    // Хөтчийн өөрийн цонх (нууц үг хадгалах г.м.) богино хугацаанд focus авахыг
    // тооцохгүйн тулд focus 2 секунд тасарсан үед л зөрчил гэж үзнэ. Таб солих нь шууд.
    let unfocusedSince: number | null = null;
    const check = () => {
      if (document.visibilityState === "hidden") return void leave();
      if (document.hasFocus()) {
        unfocusedSince = null;
        return back();
      }
      unfocusedSince ??= Date.now();
      if (Date.now() - unfocusedSince >= BLUR_GRACE_MS) void leave(unfocusedSince);
    };
    // blur-ийн үед focus iframe руу шилжсэн эсэх нь дараагийн tick-д л мэдэгдэнэ.
    const onBlur = () => setTimeout(check, 0);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", check);
    const poll = setInterval(check, 1000);
    return () => {
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", check);
      clearInterval(poll);
    };
  }, []);

  return { warning, dismiss: () => setWarning(null) };
}
