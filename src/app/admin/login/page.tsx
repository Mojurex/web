import { currentTeacher } from "@/lib/admin";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await currentTeacher()) redirect("/admin");
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <p className="font-semibold text-indigo">Программчлал</p>
        <h1 className="text-3xl font-bold">Багшийн нэвтрэх</h1>
      </div>
      <LoginForm />
    </main>
  );
}
