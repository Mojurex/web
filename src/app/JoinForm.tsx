"use client";

import { useActionState } from "react";
import { joinAction, type JoinState } from "./actions";

export function JoinForm() {
  const [state, action, pending] = useActionState<JoinState, FormData>(joinAction, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="font-semibold">Шалгалтын код</span>
        <input
          name="code"
          required
          defaultValue={state.values?.code}
          className="field font-mono text-2xl tracking-[0.3em] uppercase"
          maxLength={6}
          autoComplete="off"
          spellCheck={false}
          placeholder="K7Q2MX"
        />
        <span className="text-sm text-muted">Багшийн самбар дээр бичсэн 6 тэмдэгт</span>
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-semibold">Овог, нэр</span>
        <input name="name" required defaultValue={state.values?.name} className="field" placeholder="Бат Сараа" autoComplete="name" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-semibold">Сурагчийн код</span>
        <input name="studentCode" required defaultValue={state.values?.studentCode} className="field" autoComplete="off" />
        <span className="text-sm text-muted">Багшаас өгсөн дугаар. Нэг кодоор нэг л удаа өгнө.</span>
      </label>
      {state.error && (
        <p role="alert" className="rounded-lg bg-bad-tint px-3 py-2 text-bad">
          {state.error}
        </p>
      )}
      <button className="btn btn-primary py-3 text-lg" disabled={pending}>
        {pending ? "Шалгаж байна…" : "Шалгалт эхлүүлэх"}
      </button>
    </form>
  );
}
