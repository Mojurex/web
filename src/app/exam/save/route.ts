import { DbTimeoutError, withDbTimeout } from "@/lib/db";
import { saveAnswer } from "@/lib/exam";
import type { AnswerResponse } from "@/lib/types";

export const maxDuration = 30;

/**
 * Автомат хадгалалт. Server action биш route байх нь: Next.js action-уудыг нэг
 * нэгээр нь дараалуулдаг тул гацсан хадгалалт «Илгээх»-ийг хүртэл хориглоно;
 * fetch-ийг харин хөтөч таслаад дахин оролдож чадна.
 */
export async function POST(req: Request) {
  let body: { questionId?: unknown; response?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Буруу хүсэлт." }, { status: 400 });
  }
  const { questionId, response } = body;
  // uuid биш id нь DB-д алдаа өгч, клиент 5xx-ийг дахин оролдох тул энд татгалзана.
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (typeof questionId !== "string" || !uuid.test(questionId) || typeof response !== "object" || response === null) {
    return Response.json({ ok: false, error: "Буруу хүсэлт." }, { status: 400 });
  }
  try {
    return Response.json(await withDbTimeout(() => saveAnswer(questionId, response as AnswerResponse)));
  } catch (e) {
    if (e instanceof DbTimeoutError) return Response.json({ ok: false, error: e.message }, { status: 503 });
    throw e;
  }
}
