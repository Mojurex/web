"use client";

import type { Exam } from "@/lib/types";
import { useActionState, useState, useTransition } from "react";
import {
  allowRelogin,
  extendTime,
  forceSubmit,
  moveQuestion,
  openSectionB,
  regenerateCode,
  updateExamSettings,
  type FormState,
} from "../../../actions";

export function AttemptActions({ attemptId, section }: { attemptId: string; section: string }) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  if (section === "done") return null;
  const run = (fn: () => Promise<void>) => start(async () => {
    await fn();
    setOpen(false);
  });
  return (
    <div className="relative">
      <button type="button" className="btn btn-ghost px-3 py-1 text-sm" onClick={() => setOpen(!open)} aria-expanded={open} disabled={pending}>
        Үйлдэл
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 flex w-60 flex-col rounded-xl border border-line bg-surface p-1 text-sm shadow-lg">
          <button type="button" className="rounded-lg px-3 py-2 text-left hover:bg-tint" onClick={() => run(() => extendTime(attemptId, 5))}>
            Хугацааг 5 минут сунгах
          </button>
          <button type="button" className="rounded-lg px-3 py-2 text-left hover:bg-tint" onClick={() => run(() => allowRelogin(attemptId))}>
            Өөр компьютерээс үргэлжлүүлэхийг зөвшөөрөх
          </button>
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-left text-bad hover:bg-bad-tint"
            onClick={() => confirm("Сурагчийн шалгалтыг одоо дуусгах уу? Хадгалсан хариултууд илгээгдэнэ.") && run(() => forceSubmit(attemptId))}
          >
            Шалгалтыг дуусгах
          </button>
        </div>
      )}
    </div>
  );
}

export function QuestionMover({ questionId, first, last }: { questionId: string; first: boolean; last: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" className="btn btn-ghost h-8 w-8 p-0" disabled={first || pending} onClick={() => start(() => moveQuestion(questionId, -1))} aria-label="Дээш зөөх">
        ↑
      </button>
      <button type="button" className="btn btn-ghost h-8 w-8 p-0" disabled={last || pending} onClick={() => start(() => moveQuestion(questionId, 1))} aria-label="Доош зөөх">
        ↓
      </button>
    </div>
  );
}

export function SettingsForm({ exam }: { exam: Exam }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateExamSettings.bind(null, exam.id), {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">Ерөнхий тохиргоо</h2>
      <label className="flex flex-col gap-1">
        <span className="font-semibold">Гарчиг</span>
        <input name="title" defaultValue={exam.title} className="field" required />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-semibold">А хэсэг (минут)</span>
          <input name="section_a_minutes" type="number" min={1} max={300} defaultValue={exam.section_a_minutes} className="field" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-semibold">Б хэсэг (минут)</span>
          <input name="section_b_minutes" type="number" min={1} max={300} defaultValue={exam.section_b_minutes} className="field" />
        </label>
      </div>
      <p className="text-sm text-muted">Хугацааны өөрчлөлт шинээр эхлэх сурагчдад үйлчилнэ.</p>
      <label className="flex flex-col gap-1">
        <span className="font-semibold">Таб солих хязгаар</span>
        <input name="focus_limit" type="number" min={0} max={20} defaultValue={exam.focus_limit} className="field w-32" />
        <span className="text-sm text-muted">
          Сурагч өөр таб руу энэ олон удаа шилжвэл (эсвэл цонхоо жижигрүүлбэл) шалгалт автоматаар дуусна. 0 бол зөвхөн бүртгэнэ. Хаягийн мөр, өөр програм руу түр шилжихийг тоолохгүй, зөвхөн бүртгэнэ.
        </span>
      </label>
      {state.error && <p className="text-bad">{state.error}</p>}
      {state.ok && <p className="text-good">{state.ok}</p>}
      <button className="btn btn-primary self-start" disabled={pending}>
        Хадгалах
      </button>
    </form>
  );
}

export function RegenerateCode({ examId }: { examId: string }) {
  const [pending, start] = useTransition();
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl font-bold">Шалгалтын код</h2>
      <p className="text-muted">
        Шинэ код үүсгэвэл хуучин кодоор шинээр орох боломжгүй болно. Эхэлсэн сурагчдын шалгалт үргэлжилнэ.
      </p>
      <button
        type="button"
        className="btn btn-ghost self-start"
        disabled={pending}
        onClick={() => confirm("Шинэ код үүсгэх үү?") && start(() => regenerateCode(examId))}
      >
        Шинэ код үүсгэх
      </button>
    </section>
  );
}

/** Б хэсгийг өгөлгүй дууссан сурагчдад Б хэсгийг нээнэ. */
export function OpenSectionB({ examId, count }: { examId: string; count: number }) {
  const [pending, start] = useTransition();
  const [opened, setOpened] = useState<number | null>(null);
  if (opened !== null) {
    return (
      <p className="rounded-xl bg-good-tint px-4 py-3 text-good" role="status">
        {opened} сурагчид Б хэсгийг нээлээ. Сурагчид нүүр хуудаснаас шалгалтын код, сурагчийн кодоо дахин оруулж орно.
        Цаг нь сурагч бүрийг орж ирэхэд эхэлнэ.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warn bg-warn-tint px-4 py-3">
      <p className="text-warn">{count} сурагч А хэсгийг өгөөд Б хэсгийг өгөөгүй дууссан байна.</p>
      <button
        type="button"
        className="btn btn-primary text-sm"
        disabled={pending}
        onClick={() =>
          confirm(`${count} сурагчид Б хэсгийг нээх үү? Тэд кодоороо дахин орж Б хэсгийг гүйцэтгэнэ.`) &&
          start(async () => setOpened(await openSectionB(examId)))
        }
      >
        Б хэсгийг нээх
      </button>
    </div>
  );
}
