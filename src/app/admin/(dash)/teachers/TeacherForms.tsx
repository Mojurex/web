"use client";

import { useActionState, useTransition } from "react";
import { addTeacher, changePassword, removeTeacher, type FormState } from "../../actions";

function Message({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="text-bad">{state.error}</p>;
  if (state.ok) return <p className="text-good">{state.ok}</p>;
  return null;
}

export function TeacherForms() {
  const [addState, add, adding] = useActionState<FormState, FormData>(addTeacher, {});
  const [pwState, change, changing] = useActionState<FormState, FormData>(changePassword, {});
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <form action={add} className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Багш нэмэх</h2>
        <input name="name" placeholder="Нэр" className="field" required defaultValue={addState.values?.name} />
        <input name="email" type="email" placeholder="Имэйл" className="field" required defaultValue={addState.values?.email} />
        <input name="password" type="password" placeholder="Нууц үг (8+ тэмдэгт)" className="field" required minLength={8} autoComplete="new-password" />
        <Message state={addState} />
        <button className="btn btn-primary self-start" disabled={adding}>
          Нэмэх
        </button>
      </form>
      <form action={change} className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Нууц үг солих</h2>
        <input name="current" type="password" placeholder="Одоогийн нууц үг" className="field" required autoComplete="current-password" />
        <input name="next" type="password" placeholder="Шинэ нууц үг (8+ тэмдэгт)" className="field" required minLength={8} autoComplete="new-password" />
        <Message state={pwState} />
        <button className="btn btn-primary self-start" disabled={changing}>
          Солих
        </button>
      </form>
    </div>
  );
}

export function RemoveTeacher({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="btn btn-danger py-1 text-sm"
      disabled={pending}
      onClick={() => confirm(`${name}-г хасах уу?`) && start(() => removeTeacher(id))}
    >
      Хасах
    </button>
  );
}
