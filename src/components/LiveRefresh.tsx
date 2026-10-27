"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

/** Шалгалт эхлэхэд олон сурагч зэрэг ордог тул хуудсыг үүнээс ойр шинэчлэхгүй. */
const MIN_REFRESH_MS = 5000;

/**
 * Supabase Realtime-ийн broadcast дохиог сонсож хуудсыг шинэчилнэ (db/realtime.sql).
 * Дохионд өгөгдөл байхгүй; өгөгдлийг сервер дахин уншина. Realtime тохируулаагүй
 * эсвэл тасарсан үед 15 секунд тутам шинэчилнэ. Таб далд байхад шинэчлэхгүй,
 * буцаж ирэхэд хоцорсон өөрчлөлтийг нэг удаа татна.
 */
export function LiveRefresh({ topic }: { topic: string }) {
  const router = useRouter();
  const [live, setLive] = useState(false);
  const refresh = useThrottledRefresh(() => router.refresh());

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel(topic)
      .on("broadcast", { event: "changed" }, refresh.request)
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      supabase.removeChannel(channel);
    };
  }, [topic, refresh]);

  useEffect(() => {
    const t = setInterval(refresh.request, live ? 60_000 : 15_000);
    return () => clearInterval(t);
  }, [live, refresh]);

  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted" aria-live="polite">
      <span className={`h-2 w-2 rounded-full ${live ? "bg-good" : "bg-line"}`} aria-hidden />
      {live ? "Шууд шинэчлэгдэж байна" : "15 секунд тутам шинэчлэгдэнэ"}
    </span>
  );
}

/**
 * request() дуудагдахад хамгийн ихдээ MIN_REFRESH_MS-д нэг удаа run() хийнэ. Нэг илгээлт
 * олон мөр өөрчилдөг тул эхний дохиог ч бага зэрэг хүлээж нэгтгэнэ. Өмнөх шинэчлэлт
 * дуусаагүй бол шинийг эхлүүлэхгүй: Next.js шинэ refresh-ээр хуучныг цуцалдаг тул
 * сервер удаан үед хуудас огт шинэчлэгдэхгүй болно.
 */
function useThrottledRefresh(refresh: () => void) {
  const [busy, startTransition] = useTransition();
  const runRef = useRef(() => startTransition(refresh));
  runRef.current = () => startTransition(refresh);
  const state = useRef({ last: 0, timer: null as ReturnType<typeof setTimeout> | null, stale: false, busy: false });

  const api = useMemo(() => {
    const s = state.current;
    const request = () => {
      if (document.visibilityState === "hidden") {
        s.stale = true;
        return;
      }
      if (s.timer) return;
      s.timer = setTimeout(
        () => {
          s.timer = null;
          // Таб далд болсон бол буцаж ирэхэд, өмнөх нь дуусаагүй бол дууссаны дараа.
          if (document.visibilityState === "hidden" || s.busy) {
            s.stale = true;
            return;
          }
          s.last = Date.now();
          runRef.current();
        },
        Math.max(600, s.last + MIN_REFRESH_MS - Date.now()),
      );
    };
    return { request };
  }, []);

  useEffect(() => {
    const s = state.current;
    s.busy = busy;
    if (!busy && s.stale && document.visibilityState === "visible") {
      s.stale = false;
      api.request();
    }
  }, [busy, api]);

  useEffect(() => {
    const s = state.current;
    const onVisible = () => {
      if (document.visibilityState === "visible" && s.stale) {
        s.stale = false;
        api.request();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (s.timer) clearTimeout(s.timer);
      s.timer = null;
    };
  }, [api]);

  return api;
}
