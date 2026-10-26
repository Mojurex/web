"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

/**
 * Supabase Realtime-ийн broadcast дохиог сонсож хуудсыг шинэчилнэ (db/realtime.sql).
 * Дохионд өгөгдөл байхгүй; өгөгдлийг сервер дахин уншина. Realtime тохируулаагүй
 * эсвэл тасарсан үед 15 секунд тутам шинэчилнэ.
 */
export function LiveRefresh({ topic }: { topic: string }) {
  const router = useRouter();
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const channel = supabase
      .channel(topic)
      .on("broadcast", { event: "changed" }, () => {
        // Нэг илгээлт олон мөр өөрчилдөг тул дохиог нэгтгэнэ.
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => router.refresh(), 600);
      })
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [topic, router]);

  useEffect(() => {
    const t = setInterval(() => router.refresh(), live ? 60_000 : 15_000);
    return () => clearInterval(t);
  }, [live, router]);

  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted" aria-live="polite">
      <span className={`h-2 w-2 rounded-full ${live ? "bg-good" : "bg-line"}`} aria-hidden />
      {live ? "Шууд шинэчлэгдэж байна" : "15 секунд тутам шинэчлэгдэнэ"}
    </span>
  );
}
