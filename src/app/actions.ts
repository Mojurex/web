"use server";

import { joinExam } from "@/lib/exam";
import { redirect } from "next/navigation";

export type JoinState = { error?: string; values?: { code: string; name: string; studentCode: string } };

export async function joinAction(_prev: JoinState, form: FormData): Promise<JoinState> {
  const values = {
    code: String(form.get("code") ?? "").trim(),
    name: String(form.get("name") ?? "").trim().replace(/\s+/g, " "),
    studentCode: String(form.get("studentCode") ?? "").trim(),
  };
  if (!values.code || !values.name || !values.studentCode) {
    return { error: "Гурван талбарыг бүгдийг бөглөнө үү.", values };
  }
  if (values.name.length > 80 || values.studentCode.length > 40) return { error: "Нэр эсвэл код хэт урт байна.", values };
  const result = await joinExam(values.code, values.name, values.studentCode);
  if (!result.ok) return { error: result.error, values };
  redirect("/exam");
}
