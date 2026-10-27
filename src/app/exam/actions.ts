"use server";

import { withDbTimeout } from "@/lib/db";
import { recordFocusLeave, recordFocusReturn, submitCurrentSection, type FocusResult } from "@/lib/exam";
import type { FocusKind, Section } from "@/lib/types";

// Хадгалалт нь ./save/route.ts дээр.

export async function submitSectionAction(section: Section): Promise<{ ok: boolean }> {
  const attempt = await withDbTimeout(() => submitCurrentSection(section));
  return { ok: attempt !== null };
}

const validId = (id: unknown): id is string => typeof id === "string" && /^[\w-]{1,40}$/.test(id);
const validMs = (ms: unknown): ms is number => typeof ms === "number" && Number.isFinite(ms);

export async function focusLeaveAction(kind: FocusKind, id: string, awayMs?: number): Promise<FocusResult | null> {
  if ((kind !== "tab" && kind !== "window") || !validId(id)) return null;
  // Хязгаарт хүрвэл хоёр хэсгийг хоёуланг нь илгээдэг тул бусдаас удаан.
  return withDbTimeout(() => recordFocusLeave(kind, id, validMs(awayMs) ? awayMs : undefined), 20_000);
}

export async function focusReturnAction(id: string, awayMs: number): Promise<void> {
  if (!validId(id) || !validMs(awayMs)) return;
  await withDbTimeout(() => recordFocusReturn(id, awayMs));
}
