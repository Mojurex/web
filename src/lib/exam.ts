import "server-only";
import { autoScore } from "./grading";
import { sql } from "./db";
import { issueAttemptCookie, readAttemptCookie } from "./session";
import type { AnswerResponse, Attempt, Exam, FocusEvent, FocusKind, PublicQuestion, Question, Section } from "./types";
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
  if (attempt.section === "B" && !attempt.b_deadline) {
    // Багш Б хэсгийг дараа нь нээсэн: цаг нь сурагч хуудсаа нээхэд эхэлнэ.
    const [started] = await sql<Attempt[]>`
      update attempts a set b_started_at = now(), b_deadline = now() + make_interval(mins => e.section_b_minutes)
      from exams e
      where a.id = ${attempt.id} and e.id = a.exam_id and a.b_deadline is null
      returning a.*`;
    if (started) attempt = started;
  }
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
  const cookie = await readAttemptCookie();
  if (!cookie) return { ok: false, error: "Шалгалтын холболт тасарсан. Хуудсаа дахин ачаална уу.", ended: true };
  // Хамгийн олон дуудагддаг хүсэлт тул бүх шалгалтыг нэг query-д: зөв сурагч, одоогийн
  // хэсгийн асуулт, хугацаа дуусаагүй. Мөр буцаахгүй бол доор шалтгааныг тодруулна.
  const saved = await sql`
    insert into answers (attempt_id, question_id, response, updated_at)
    select a.id, q.id, ${sql.json(response as never)}, now()
    from attempts a join questions q on q.exam_id = a.exam_id and q.section = a.section
    where a.id = ${cookie.attemptId} and a.token_hash = ${cookie.tokenHash} and q.id = ${questionId}
      and now() <= (case a.section when 'A' then a.a_deadline else a.b_deadline end)
        + make_interval(secs => ${GRACE_MS / 1000})
    on conflict (attempt_id, question_id)
    do update set response = excluded.response, updated_at = now()
    returning 1`;
  if (saved.length > 0) return { ok: true };

  const attempt = await attemptFromCookie();
  if (!attempt) return { ok: false, error: "Шалгалтын холболт тасарсан. Хуудсаа дахин ачаална уу.", ended: true };
  const deadline = deadlineOf(attempt);
  if (!deadline || Date.now() > deadline.getTime() + GRACE_MS) {
    return { ok: false, error: "Энэ хэсгийн хугацаа дууссан.", ended: true };
  }
  const [q] = await sql<{ section: Section }[]>`
    select section from questions where id = ${questionId} and exam_id = ${attempt.exam_id}`;
  if (!q || q.section !== attempt.section) return { ok: false, error: "Энэ асуулт одоогийн хэсэгт хамаарахгүй." };
  // Серверийн цаг DB-ийнхээс зөрсөн хил дээрх тохиолдол.
  return { ok: false, error: "Энэ хэсгийн хугацаа дууссан.", ended: true };
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

const clampMs = (ms: number) => Math.max(0, Math.min(Math.round(ms), 24 * 3600_000));

/**
 * Сурагч шалгалтын цонхноос гарсныг бүртгэнэ. Зөвхөн tab тоологдоно; тоолуур сервер
 * дээр байдаг тул хуудсыг дахин ачаалж тэглэх боломжгүй. Хязгаарт хүрвэл шалгалтыг
 * дуусгана. id нь клиентээс ирэх тул дахин илгээсэн ч хоёр удаа тоологдохгүй.
 * awayMs: хөтөч далд табын timer-ийг зогсоосон бол буцаж ирэхэд л мэдэгдэнэ.
 */
export async function recordFocusLeave(kind: FocusKind, id: string, awayMs?: number): Promise<FocusResult | null> {
  const attempt = await attemptFromCookie();
  if (!attempt || attempt.section === "done") return null;
  const event: FocusEvent = {
    at: new Date(Date.now() - (awayMs ?? 0)).toISOString(),
    section: attempt.section,
    kind,
    id,
    ...(awayMs !== undefined && { awayMs: clampMs(awayMs) }),
  };
  const [inserted] = await sql<{ focus_count: number; focus_limit: number }[]>`
    update attempts a set
      focus_count = a.focus_count + ${kind === "tab" ? 1 : 0},
      focus_log = a.focus_log || ${sql.json([event])}
    from exams e
    where a.id = ${attempt.id} and e.id = a.exam_id and not a.focus_log @> ${sql.json([{ id }])}
    returning a.focus_count, e.focus_limit`;
  // Дахин илгээлт: өмнөх оролдлого тоолоод дуусгаж амжаагүй байж болох тул одоогийн тоогоор шийднэ.
  const [row] = inserted
    ? [inserted]
    : await sql<{ focus_count: number; focus_limit: number }[]>`
        select a.focus_count, e.focus_limit from attempts a join exams e on e.id = a.exam_id where a.id = ${attempt.id}`;
  const ended = row.focus_limit > 0 && row.focus_count >= row.focus_limit;
  if (ended) {
    const done = await endAttempt(attempt);
    await sql`
      update attempts set ended_by_focus = true,
        note = trim(note || ' Өөр таб руу ' || ${row.focus_count}::text || ' удаа шилжсэн тул автоматаар дуусгав.')
      where id = ${done.id}`;
  }
  return { count: row.focus_count, limit: row.focus_limit, ended };
}

/** Буцаж ирэхэд тухайн тохиолдлын хугацааг бичнэ. */
export async function recordFocusReturn(id: string, awayMs: number): Promise<void> {
  const attempt = await attemptFromCookie();
  if (!attempt) return;
  await sql`
    update attempts set focus_log = (
      select jsonb_agg(case when e->>'id' = ${id} then e || jsonb_build_object('awayMs', ${clampMs(awayMs)}::int) else e end order by i)
      from jsonb_array_elements(focus_log) with ordinality as t(e, i))
    where id = ${attempt.id} and focus_log @> ${sql.json([{ id }])}`;
}
