import { requireTeacher } from "@/lib/admin";
import Link from "next/link";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const teacher = await requireTeacher();
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 md:px-6">
          <Link href="/admin" className="font-bold">
            Шалгалтууд
          </Link>
          <Link href="/admin/teachers" className="text-muted hover:text-ink">
            Багш нар
          </Link>
          <span className="ml-auto text-sm text-muted">{teacher.name}</span>
          <form action={logoutAction}>
            <button className="text-sm text-indigo hover:underline">Гарах</button>
          </form>
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">{children}</div>
    </div>
  );
}
