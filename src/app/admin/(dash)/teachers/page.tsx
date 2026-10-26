import { requireTeacher } from "@/lib/admin";
import { sql } from "@/lib/db";
import { TeacherForms, RemoveTeacher } from "./TeacherForms";

export default async function TeachersPage() {
  const me = await requireTeacher();
  const teachers = await sql<{ id: string; name: string; email: string }[]>`
    select id, name, email from teachers order by name`;
  return (
    <main className="flex max-w-3xl flex-col gap-8">
      <h1 className="text-3xl font-bold">Багш нар</h1>
      <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
        {teachers.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="font-semibold">
                {t.name} {t.id === me.id && <span className="text-sm font-normal text-muted">(та)</span>}
              </p>
              <p className="text-sm text-muted">{t.email}</p>
            </div>
            {t.id !== me.id && <RemoveTeacher id={t.id} name={t.name} />}
          </li>
        ))}
      </ul>
      <TeacherForms />
    </main>
  );
}
