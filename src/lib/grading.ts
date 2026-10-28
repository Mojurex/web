import type { RubricItem, TypingSpec } from "@/content/types";
import { levelScore, typingStats, type TypingResponse } from "./typing";

export type QuestionType = "mcq" | "open" | "task";

export type Gradable = {
  type: QuestionType;
  points: number;
  answer_key: { answer?: string };
  rubric: RubricItem[];
  /** Даалгаврын payload; шивэх дасгалын текстийг эндээс авна. */
  payload?: unknown;
};

export type Response = {
  choice?: string;
  blanks?: Record<string, string>;
  typing?: TypingResponse;
};

// Латин, кирилл ижил харагддаг үсгүүд: сурагч аль гараар бичсэн ч тэнцүү гэж үзнэ.
const lookalikes: Record<string, string> = {
  a: "а", b: "в", c: "с", e: "е", h: "н", k: "к", m: "м", o: "о", p: "р", t: "т", x: "х", y: "у",
};

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[−–—]/g, "-")
    .replace(/[«»“”"']/g, "")
    .replace(/[abcehkmoptxy]/g, (ch) => lookalikes[ch])
    .replace(/\s+/g, " ")
    .trim();
}

/** Нүдний хариултыг рубрикийн accept хувилбаруудтай тулгана. */
export function matches(answer: string | undefined, accept: string[]): boolean {
  if (!answer?.trim()) return false;
  const got = normalize(answer);
  return accept.some((a) => {
    if (a.startsWith("~")) {
      return normalize(a.slice(1))
        .split(" ")
        .every((word) => got.includes(word));
    }
    return got.replace(/ /g, "") === normalize(a).replace(/ /g, "");
  });
}

/**
 * Рубрикийн мөр бүрийн автомат оноо. null = багш шалгана.
 * mcq бол ганц мөртэй (асуултын бүтэн оноо).
 */
export function autoScore(q: Gradable, response: Response | undefined): (number | null)[] {
  if (q.type === "mcq") {
    return [response?.choice && response.choice === q.answer_key.answer ? q.points : 0];
  }
  const spec = (q.payload as { typing?: TypingSpec | null } | undefined)?.typing;
  const t = response?.typing;
  const stats = spec ? typingStats(spec.text, t?.typed ?? "", t?.elapsedMs ?? 0, spec.seconds * 1000) : null;
  return q.rubric.map((item) => {
    if (item.typing && stats) {
      return levelScore(item.typing.metric === "wpm" ? stats.wpm : stats.accuracy, item.typing.levels, stats.chars > 0);
    }
    if (item.blank && item.accept) return matches(response?.blanks?.[item.blank], item.accept) ? item.points : 0;
    return null;
  });
}

export type ScoreSummary = { score: number; graded: boolean };

export function summarize(itemScores: (number | null)[] | null | undefined, itemCount: number): ScoreSummary {
  const items = itemScores ?? [];
  const score = items.reduce<number>((s, x) => s + (x ?? 0), 0);
  const graded = items.length >= itemCount && items.slice(0, itemCount).every((x) => x !== null);
  return { score, graded };
}

/** Рубрикийн мөрийн тоо. mcq-д 1. */
export function itemCount(q: Pick<Gradable, "type" | "rubric">): number {
  return q.type === "mcq" ? 1 : q.rubric.length;
}
