import "server-only";
import { autoScore } from "./grading";
import { sql } from "./db";
import { issueAttemptCookie, readAttemptCookie } from "./session";
import type { AnswerResponse, Attempt, Exam, PublicQuestion, Question, Section } from "./types";
import { isOnlineTask } from "./types";

/** Хугацаа дууссаны дараа сүүлийн хадгалалтыг хүлээн авах хугацаа. */
export const GRACE_MS = 20_000;

export async function getExam(id: string): Promise<Exam | null> {
  const [exam] = await sql<Exam[]>`select * from exams where id = ${id}`;
  return exam ?? null;
}

export async function publicQuestions(examId: string, section?: Section): Promise<PublicQuestion[]> {
  return sql<PublicQuestion[]>`
    select id, exam_id, section, position, number, type, points, prompt, payload from questions
    where exam_id = ${examId} ${section ? sql`and section = ${section}` : sql``}
    order by section, position`;
}

export async function fullQuestions(examId: string): Promise<Question[]> {
  return sql<Question[]>`select * from questions where exam_id = ${examId} order by section, position`;
}

export type JoinResult = { ok: true } | { ok: false; error: string };

export async function joinExam(code: string, name: string, studentCode: string): Promise<JoinResult> {
  const [exam] = await sql<Exam[]>`select * from exams where access_code = ${code.trim().toUpperCase()}`;
  if (!exam) return { ok: false, error: "Ийм кодтой шалгалт олдсонгүй. Кодоо шалгаад дахин оруулна уу." };
  if (!exam.is_open) return { ok: false, error: "Энэ шалгалт одоогоор хаалттай байна. Багш нээхийг хүлээнэ үү." };

  const cookie = await readAttemptCookie();
  const [existing] = await sql<Attempt[]>`
    select * from attempts where exam_id = ${exam.id} and student_code = ${studentCode}`;

  if (existing) {
    if (existing.section === "done") return { ok: false, error: "Та энэ шалгалтыг аль хэдийн өгсөн байна." };
    const sameBrowser = cookie?.attemptId === existing.id && cookie.tokenHash === existing.token_hash;
    if (sameBrowser) return { ok: true };
    if (existing.token_hash !== null) {
      return {
        ok: false,
        error: "Энэ сурагчийн кодоор шалгалт өөр төхөөрөмж дээр эхэлсэн байна. Үргэлжлүүлэх бол багшдаа хандана уу.",
      };
    }
    // Багш дахин нэвтрэхийг зөвшөөрсөн: энэ браузерт шилжүүлнэ.
    const tokenHash = await issueAttemptCookie(existing.id);
    await sql`update attempts set token_hash = ${tokenHash} where id = ${existing.id}`;
    return { ok: true };
  }

  const [attempt] = await sql<Attempt[]>`
    insert into attempts (exam_id, student_name, student_code, a_deadline)
    values (${exam.id}, ${name}, ${studentCode}, now() + make_interval(mins => ${exam.section_a_minutes}))
    returning *`;
  const tokenHash = await issueAttemptCookie(attempt.id);
  await sql`update attempts set token_hash = ${tokenHash} where id = ${attempt.id}`;
  return { ok: true };
}

async function attemptFromCookie(): Promise<Attempt | null> {
  const cookie = await readAttemptCookie();
  if (!cookie) return null;
  const [attempt] = await sql<Attempt[]>`
    select * from attempts where id = ${cookie.attemptId} and token_hash = ${cookie.tokenHash}`;
  return attempt ?? null;
}

/** Cookie-ийн оролдлогыг уншиж, хугацаа хэтэрсэн хэсгийг автоматаар илгээнэ. */
export async function currentAttempt(): Promise<Attempt | null> {
  let attempt = await attemptFromCookie();
  if (!attempt) return null;
  const now = Date.now();
  if (attempt.section === "A" && now > attempt.a_deadline.getTime() + GRACE_MS) {
    attempt = await submitSection(attempt, "A");
  }
  if (attempt.section === "B" && attempt.b_deadline && now > attempt.b_deadline.getTime() + GRACE_MS) {
    attempt = await submitSection(attempt, "B");
  }
  return attempt;
}

export function deadlineOf(attempt: Attempt): Date | null {
  if (attempt.section === "A") return attempt.a_deadline;
  if (attempt.section === "B") return attempt.b_deadline;
  return null;
}

export async function answersFor(attemptId: string): Promise<Record<string, AnswerResponse>> {
  const rows = await sql<{ question_id: string; response: AnswerResponse }[]>`
    select question_id, response from answers where attempt_id = ${attemptId}`;
  return Object.fromEntries(rows.map((r) => [r.question_id, r.response]));
}

export type SaveResult = { ok: true } | { ok: false; error: string; ended?: boolean };

export async function saveAnswer(questionId: string, response: AnswerResponse): Promise<SaveResult> {
  if (JSON.stringify(response).length > 300_000) return { ok: false, error: "Хариулт хэт урт байна." };
  const attempt = await attemptFromCookie();
  if (!attempt) return { ok: false, error: "Шалгалтын холболт тасарсан. Хуудсаа дахин ачаална уу.", ended: true };
  const deadline = deadlineOf(attempt);
  if (!deadline || Date.now() > deadline.getTime() + GRACE_MS) {
    return { ok: false, error: "Энэ хэсгийн хугацаа дууссан.", ended: true };
  }
  const [q] = await sql<{ section: Section }[]>`
    select section from questions where id = ${questionId} and exam_id = ${attempt.exam_id}`;
  if (!q || q.section !== attempt.section) return { ok: false, error: "Энэ асуулт одоогийн хэсэгт хамаарахгүй." };
  await sql`
    insert into answers (attempt_id, question_id, response, updated_at)
    values (${attempt.id}, ${questionId}, ${sql.json(response as never)}, now())
    on conflict (attempt_id, question_id)
    do update set response = excluded.response, updated_at = now()`;
  return { ok: true };
}

/** Хэсгийн хариултуудыг автоматаар шалгаад дараагийн хэсэг рүү шилжүүлнэ. */
export async function submitSection(attempt: Attempt, section: Section): Promise<Attempt> {
  if (attempt.section !== section) return attempt;
  return sql.begin(async (tx) => {
    const questions = await tx<Question[]>`
      select * from questions where exam_id = ${attempt.exam_id} order by section, position`;
    const responses = await tx<{ question_id: string; response: AnswerResponse }[]>`
      select question_id, response from answers where attempt_id = ${attempt.id}`;
    const byId = new Map(responses.map((r) => [r.question_id, r.response]));

    // Нэг query-гээр: илгээх үед олон сурагч зэрэг ирдэг тул транзакцийг богино байлгана.
    const scored = questions
      .filter((q) => q.section === section && (q.type !== "task" || isOnlineTask(q)))
      .map((q) => ({ question_id: q.id, item_scores: autoScore(q, byId.get(q.id)) }));
    if (scored.length > 0) {
      await tx`
        insert into answers (attempt_id, question_id, item_scores)
        select ${attempt.id}, x.question_id, x.item_scores
        from jsonb_to_recordset(${tx.json(scored)}) as x(question_id uuid, item_scores jsonb)
        on conflict (attempt_id, question_id) do update set item_scores = excluded.item_scores`;
    }

    const hasOnlineB = questions.some((q) => q.section === "B" && isOnlineTask(q));
    const [exam] = await tx<Exam[]>`select section_b_minutes from exams where id = ${attempt.exam_id}`;
    const [updated] =
      section === "A"
        ? hasOnlineB
          ? await tx<Attempt[]>`
              update attempts set a_submitted_at = now(), section = 'B', b_started_at = now(),
                b_deadline = now() + make_interval(mins => ${exam.section_b_minutes})
              where id = ${attempt.id} and section = 'A' returning *`
          : await tx<Attempt[]>`
              update attempts set a_submitted_at = now(), section = 'done'
              where id = ${attempt.id} and section = 'A' returning *`
        : await tx<Attempt[]>`
            update attempts set b_submitted_at = now(), section = 'done'
            where id = ${attempt.id} and section = 'B' returning *`;
    // Зэрэг ирсэн хоёр дахь илгээлт: өмнөх нь аль хэдийн шилжүүлсэн.
    if (!updated) return (await tx<Attempt[]>`select * from attempts where id = ${attempt.id}`)[0];
    return updated;
  });
}

export async function submitCurrentSection(section: Section): Promise<Attempt | null> {
  const attempt = await attemptFromCookie();
  if (!attempt) return null;
  return submitSection(attempt, section);
}

export type FocusResult = { count: number; limit: number; ended: boolean };

/** Хадгалсан хариултуудыг илгээж оролдлогыг бүхэлд нь дуусгана (А → Б → дууссан). */
export async function endAttempt(attempt: Attempt): Promise<Attempt> {
  let current = attempt;
  if (current.section === "A") current = await submitSection(current, "A");
  if (current.section === "B") current = await submitSection(current, "B");
  return current;
}

/**
 * Сурагч шалгалтын цонхноос гарсныг бүртгэнэ. Тоолуур сервер дээр байдаг тул
 * хуудсыг дахин ачаалж тэглэх боломжгүй. Хязгаарт хүрвэл шалгалтыг дуусгана.
 */
export async function recordFocusLeave(): Promise<FocusResult | null> {
  const attempt = await attemptFromCookie();
  if (!attempt || attempt.section === "done") return null;
  const event = { at: new Date().toISOString(), section: attempt.section };
  const [row] = await sql<{ focus_count: number; focus_limit: number }[]>`
    update attempts a set
      focus_count = a.focus_count + 1,
      focus_log = a.focus_log || ${sql.json([event])}
    from exams e
    where a.id = ${attempt.id} and e.id = a.exam_id
    returning a.focus_count, e.focus_limit`;
  const ended = row.focus_limit > 0 && row.focus_count >= row.focus_limit;
  if (ended) {
    const done = await endAttempt(attempt);
    await sql`
      update attempts set ended_by_focus = true,
        note = trim(note || ' Шалгалтын цонхноос ' || ${row.focus_count}::text || ' удаа гарсан тул автоматаар дуусгав.')
      where id = ${done.id}`;
  }
  return { count: row.focus_count, limit: row.focus_limit, ended };
}

/** Буцаж ирэхэд сүүлийн тохиолдлын хугацааг бичнэ. */
export async function recordFocusReturn(awayMs: number): Promise<void> {
  const attempt = await attemptFromCookie();
  if (!attempt || attempt.focus_log.length === 0) return;
  const ms = Math.max(0, Math.min(Math.round(awayMs), 24 * 3600_000));
  await sql`
    update attempts set focus_log = jsonb_set(
      focus_log, array[(jsonb_array_length(focus_log) - 1)::text, 'awayMs'], to_jsonb(${ms}::int))
    where id = ${attempt.id} and jsonb_array_length(focus_log) > 0`;
}
