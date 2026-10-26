"use client";

import { useActionState } from "react";
import { loginAction, type FormState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
      <label className="flex flex-col gap-1">
        <span className="font-semibold">Имэйл</span>
        <input name="email" type="email" required className="field" autoComplete="username" defaultValue={state.values?.email} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-semibold">Нууц үг</span>
        <input name="password" type="password" required className="field" autoComplete="current-password" />
      </label>
      {state.error && (
        <p role="alert" className="rounded-lg bg-bad-tint px-3 py-2 text-bad">
          {state.error}
        </p>
      )}
      <button className="btn btn-primary py-2.5" disabled={pending}>
        {pending ? "Нэвтэрч байна…" : "Нэвтрэх"}
      </button>
    </form>
  );
}
