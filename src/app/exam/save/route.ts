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
  if (typeof questionId !== "string" || typeof response !== "object" || response === null) {
    return Response.json({ ok: false, error: "Буруу хүсэлт." }, { status: 400 });
  }
  try {
    return Response.json(await withDbTimeout(() => saveAnswer(questionId, response as AnswerResponse)));
  } catch (e) {
    if (e instanceof DbTimeoutError) return Response.json({ ok: false, error: e.message }, { status: 503 });
    throw e;
  }
}
