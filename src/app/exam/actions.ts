"use server";

import {
  recordFocusLeave,
  recordFocusReturn,
  saveAnswer,
  submitCurrentSection,
  type FocusResult,
  type SaveResult,
} from "@/lib/exam";
import type { AnswerResponse, Section } from "@/lib/types";

export async function saveAnswerAction(questionId: string, response: AnswerResponse): Promise<SaveResult> {
  return saveAnswer(questionId, response);
}

export async function submitSectionAction(section: Section): Promise<{ ok: boolean }> {
  const attempt = await submitCurrentSection(section);
  return { ok: attempt !== null };
}

export async function focusLeaveAction(): Promise<FocusResult | null> {
  return recordFocusLeave();
}

export async function focusReturnAction(awayMs: number): Promise<void> {
  await recordFocusReturn(awayMs);
}
