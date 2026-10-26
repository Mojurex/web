"use server";

import type { ResponseInput } from "@/content/types";
import { newAccessCode } from "@/lib/content-to-db";
import { padScores, requireTeacher } from "@/lib/admin";
import { sql } from "@/lib/db";
import { endAttempt } from "@/lib/exam";
import { hashPassword, verifyPassword } from "@/lib/password";
import { validItemScore } from "@/lib/scoring";
import { clearTeacherSession, setTeacherSession } from "@/lib/session";
import type { Attempt, Question, TaskRubricItem } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/** values: алдаа гарсан үед формын утгыг сэргээнэ (React 19 action-ийн дараа формыг цэвэрлэдэг). */
export type FormState = { error?: string; ok?: string; values?: Record<string, string> };

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const [t] = await sql<{ id: string; password_hash: string }[]>`
    select id, password_hash from teachers where email = ${email}`;
  if (!t || !(await verifyPassword(password, t.password_hash))) {
    return { error: "Имэйл эсвэл нууц үг буруу байна.", values: { email } };
  }
  await setTeacherSession(t.id);
  redirect("/admin");
}

export async function logoutAction() {
  await clearTeacherSession();
  redirect("/admin/login");
}

// ── Шалгалт ──────────────────────────────────────────────────────────

export async function setExamOpen(examId: string, open: boolean) {
  await requireTeacher();
  await sql`update exams set is_open = ${open} where id = ${examId}`;
  revalidatePath("/admin", "layout");
}

export async function regenerateCode(examId: string) {
  await requireTeacher();
  await sql`update exams set access_code = ${newAccessCode()} where id = ${examId}`;
  revalidatePath("/admin", "layout");
}

export async function updateExamSettings(examId: string, _prev: FormState, form: FormData): Promise<FormState> {
  await requireTeacher();
  const a = Number(form.get("section_a_minutes"));
  const b = Number(form.get("section_b_minutes"));
  const focus = Number(form.get("focus_limit"));
  const title = String(form.get("title") ?? "").trim();
  if (!title) return { error: "Гарчиг хоосон байж болохгүй." };
  if (![a, b].every((m) => Number.isInteger(m) && m >= 1 && m <= 300)) {
    return { error: "Хугацаа 1–300 минутын бүхэл тоо байна." };
  }
  if (!Number.isInteger(focus) || focus < 0 || focus > 20) return { error: "Цонх солих хязгаар 0–20 байна." };
  await sql`
    update exams set title = ${title}, section_a_minutes = ${a}, section_b_minutes = ${b}, focus_limit = ${focus}
    where id = ${examId}`;
  revalidatePath("/admin", "layout");
  return { ok: "Хадгалагдлаа." };
}

// ── Сурагчийн оролдлого ─────────────────────────────────────────────

export async function allowRelogin(attemptId: string) {
  await requireTeacher();
  await sql`update attempts set token_hash = null where id = ${attemptId}`;
  revalidatePath("/admin", "layout");
}

export async function extendTime(attemptId: string, minutes: number) {
  await requireTeacher();
  const m = Math.max(1, Math.min(60, Math.round(minutes)));
  await sql`
    update attempts set
      a_deadline = case when section = 'A' then greatest(a_deadline, now()) + make_interval(mins => ${m}) else a_deadline end,
      b_deadline = case when section = 'B' then greatest(b_deadline, now()) + make_interval(mins => ${m}) else b_deadline end,
      note = trim(note || ' Хугацаа ' || ${m}::text || ' мин сунгасан.')
    where id = ${attemptId}`;
  revalidatePath("/admin", "layout");
}

export async function forceSubmit(attemptId: string) {
  await requireTeacher();
  const [attempt] = await sql<Attempt[]>`select * from attempts where id = ${attemptId}`;
  if (!attempt) return;
  await endAttempt(attempt);
  revalidatePath("/admin", "layout");
}

/** Санамсаргүй гарсан тохиолдолд цонх солих тоолуурыг тэглэнэ (бүртгэл хадгалагдана). */
export async function resetFocus(attemptId: string) {
  await requireTeacher();
  await sql`
    update attempts set focus_count = 0, note = trim(note || ' Цонх солих тоолуурыг багш тэглэв.')
    where id = ${attemptId}`;
  revalidatePath("/admin", "layout");
}

export async function deleteAttempt(attemptId: string, examId: string) {
  await requireTeacher();
  await sql`delete from attempts where id = ${attemptId}`;
  revalidatePath("/admin", "layout");
  redirect(`/admin/exams/${examId}`);
}

export async function saveNote(attemptId: string, note: string) {
  await requireTeacher();
  await sql`update attempts set note = ${note.slice(0, 1000)} where id = ${attemptId}`;
  revalidatePath("/admin", "layout");
}

// ── Үнэлгээ ─────────────────────────────────────────────────────────

export async function saveGrade(
  attemptId: string,
  questionId: string,
  scores: (number | null)[],
  comment: string,
): Promise<FormState> {
  await requireTeacher();
  const [q] = await sql<Question[]>`
    select q.* from questions q join attempts a on a.exam_id = q.exam_id
    where q.id = ${questionId} and a.id = ${attemptId}`;
  if (!q) return { error: "Асуулт олдсонгүй." };
  const padded = padScores(q, scores);
  const maxes = q.type === "mcq" ? [q.points] : q.rubric.map((r) => r.points);
  if (!padded.every((s, i) => validItemScore(s, maxes[i]))) {
    return { error: "Оноо 0-ээс шалгуурын дээд оноо хүртэл, 0.5-ын алхамтай байна." };
  }
  await sql`
    insert into answers (attempt_id, question_id, item_scores, comment)
    values (${attemptId}, ${questionId}, ${sql.json(padded)}, ${comment.slice(0, 2000)})
    on conflict (attempt_id, question_id)
    do update set item_scores = excluded.item_scores, comment = excluded.comment`;
  revalidatePath("/admin", "layout");
  return { ok: "Хадгалагдлаа." };
}

// ── Асуулт засах ────────────────────────────────────────────────────

export type QuestionDraft = {
  id?: string;
  examId: string;
  section: "A" | "B";
  type: "mcq" | "open" | "task";
  number: string;
  points: number;
  prompt: string;
  options?: [string, string][];
  answer?: string;
  input?: ResponseInput;
  rubric?: TaskRubricItem[];
  key?: string;
  /** task: payload-ийн бусад хэсэг (title, tools, files, images, workspace, parts). */
  task?: Record<string, unknown>;
};

function draftError(d: QuestionDraft): string | null {
  if (!d.number.trim()) return "Дугаар хоосон байна.";
  if (!d.prompt.trim()) return "Асуултын бичвэр хоосон байна.";
  if (!(d.points > 0)) return "Оноо 0-ээс их байна.";
  if (d.type === "mcq") {
    const opts = d.options ?? [];
    if (opts.length < 2 || opts.some(([k, t]) => !k.trim() || !t.trim())) return "Хамгийн багадаа 2 бөглөсөн сонголт хэрэгтэй.";
    if (!opts.some(([k]) => k === d.answer)) return "Зөв хариултыг сонгоно уу.";
    return null;
  }
  const rubric = d.rubric ?? [];
  if (rubric.length === 0) return "Шалгуур (рубрик) дор хаяж нэг мөртэй байна.";
  if (rubric.some((r) => !r.label.trim() || !(r.points > 0))) return "Шалгуур бүр нэр, 0-ээс их оноотой байна.";
  const sum = rubric.reduce((s, r) => s + r.points, 0);
  if (Math.abs(sum - d.points) > 1e-9) return `Шалгууруудын нийлбэр (${sum}) асуултын оноотой (${d.points}) тэнцүү байх ёстой.`;
  if (rubric.some((r) => r.blank && !r.accept?.length)) return "Автомат шалгах нүд бүрт зөв хариулт бичнэ үү.";
  if (d.type === "task") {
    const parts = (d.task?.parts ?? []) as { n: string; points: number }[];
    if (parts.length === 0 || parts.some((p) => !p.n.trim())) return "Даалгавар дор хаяж нэг дугаартай хэсэгтэй байна.";
    const partSum = parts.reduce((s, p) => s + p.points, 0);
    if (Math.abs(partSum - d.points) > 1e-9) return `Хэсгүүдийн нийлбэр (${partSum}) даалгаврын оноотой (${d.points}) тэнцүү байх ёстой.`;
    if (!d.task?.title) return "Даалгаврын гарчиг хоосон байна.";
    const tools = d.task.tools;
    if (tools !== "offline" && (!Array.isArray(tools) || tools.length === 0)) return "Ажлын орчноо сонгоно уу.";
  }
  return null;
}

export async function saveQuestion(d: QuestionDraft): Promise<FormState & { id?: string }> {
  await requireTeacher();
  const error = draftError(d);
  if (error) return { error };
  const payload =
    d.type === "mcq" ? { options: d.options } : d.type === "open" ? { input: d.input ?? "text" } : (d.task ?? {});
  const answerKey = d.type === "mcq" ? { answer: d.answer } : { key: d.key ?? "" };
  const rubric = d.type === "mcq" ? [] : (d.rubric ?? []);
  let id = d.id;
  if (id) {
    await sql`
      update questions set number = ${d.number.trim()}, points = ${d.points}, prompt = ${d.prompt},
        payload = ${sql.json(payload as never)}, answer_key = ${sql.json(answerKey as never)}, rubric = ${sql.json(rubric as never)}
      where id = ${id} and exam_id = ${d.examId}`;
  } else {
    const [row] = await sql<{ id: string }[]>`
      insert into questions (exam_id, section, position, number, type, points, prompt, payload, answer_key, rubric)
      values (${d.examId}, ${d.section},
        (select coalesce(max(position) + 1, 0) from questions where exam_id = ${d.examId} and section = ${d.section}),
        ${d.number.trim()}, ${d.type}, ${d.points}, ${d.prompt},
        ${sql.json(payload as never)}, ${sql.json(answerKey as never)}, ${sql.json(rubric as never)})
      returning id`;
    id = row.id;
  }
  revalidatePath("/admin", "layout");
  return { ok: "Хадгалагдлаа.", id };
}

export async function deleteQuestion(questionId: string, examId: string) {
  await requireTeacher();
  await sql`delete from questions where id = ${questionId} and exam_id = ${examId}`;
  revalidatePath("/admin", "layout");
  redirect(`/admin/exams/${examId}?tab=questions`);
}

export async function moveQuestion(questionId: string, direction: -1 | 1) {
  await requireTeacher();
  await sql.begin(async (tx) => {
    const [q] = await tx<Question[]>`select * from questions where id = ${questionId}`;
    if (!q) return;
    const [other] =
      direction < 0
        ? await tx<Question[]>`
            select * from questions where exam_id = ${q.exam_id} and section = ${q.section} and position < ${q.position}
            order by position desc limit 1`
        : await tx<Question[]>`
            select * from questions where exam_id = ${q.exam_id} and section = ${q.section} and position > ${q.position}
            order by position limit 1`;
    if (!other) return;
    await tx`update questions set position = ${other.position} where id = ${q.id}`;
    await tx`update questions set position = ${q.position} where id = ${other.id}`;
  });
  revalidatePath("/admin", "layout");
}

// ── Багш нар ────────────────────────────────────────────────────────

export async function addTeacher(_prev: FormState, form: FormData): Promise<FormState> {
  await requireTeacher();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const name = String(form.get("name") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const values = { email, name };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Имэйл буруу байна.", values };
  if (!name) return { error: "Нэрээ оруулна уу.", values };
  if (password.length < 8) return { error: "Нууц үг дор хаяж 8 тэмдэгт байна.", values };
  const [exists] = await sql`select 1 from teachers where email = ${email}`;
  if (exists) return { error: "Энэ имэйлтэй багш бүртгэлтэй байна.", values };
  await sql`insert into teachers (email, name, password_hash) values (${email}, ${name}, ${await hashPassword(password)})`;
  revalidatePath("/admin/teachers");
  return { ok: `${name} нэмэгдлээ.` };
}

export async function changePassword(_prev: FormState, form: FormData): Promise<FormState> {
  const me = await requireTeacher();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const [t] = await sql<{ password_hash: string }[]>`select password_hash from teachers where id = ${me.id}`;
  if (!(await verifyPassword(current, t.password_hash))) return { error: "Одоогийн нууц үг буруу байна." };
  if (next.length < 8) return { error: "Шинэ нууц үг дор хаяж 8 тэмдэгт байна." };
  await sql`update teachers set password_hash = ${await hashPassword(next)} where id = ${me.id}`;
  return { ok: "Нууц үг солигдлоо." };
}

export async function removeTeacher(teacherId: string) {
  const me = await requireTeacher();
  if (teacherId === me.id) return;
  await sql`delete from teachers where id = ${teacherId}`;
  revalidatePath("/admin/teachers");
}
