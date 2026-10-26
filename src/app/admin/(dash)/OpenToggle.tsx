"use client";

import { useTransition } from "react";
import { setExamOpen } from "../actions";

export function OpenToggle({ examId, open }: { examId: string; open: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={open}
      disabled={pending}
      onClick={() => start(() => setExamOpen(examId, !open))}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${
        open ? "border-good bg-good-tint text-good" : "border-line bg-paper text-muted"
      }`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${open ? "bg-good" : "bg-line"}`} />
      {open ? "Нээлттэй" : "Хаалттай"}
    </button>
  );
}
