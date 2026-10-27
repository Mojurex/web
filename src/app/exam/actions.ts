"use server";

import { withDbTimeout } from "@/lib/db";
import { recordFocusLeave, recordFocusReturn, submitCurrentSection, type FocusResult } from "@/lib/exam";
import type { Section } from "@/lib/types";

// Хадгалалт нь ./save/route.ts дээр.

export async function submitSectionAction(section: Section): Promise<{ ok: boolean }> {
  const attempt = await withDbTimeout(() => submitCurrentSection(section));
  return { ok: attempt !== null };
}

export async function focusLeaveAction(): Promise<FocusResult | null> {
  return withDbTimeout(() => recordFocusLeave());
}

export async function focusReturnAction(awayMs: number): Promise<void> {
  await withDbTimeout(() => recordFocusReturn(awayMs));
}
