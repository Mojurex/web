// Шивэх дасгалын хурд, нарийвчлал. Сурагчийн дэлгэц, автомат оноо, багшийн самбар
// гурвуулаа үүнийг ашиглана.

export type TypingResponse = {
  /** Сурагчийн шивсэн текст. */
  typed: string;
  /** Эхлүүлсэн цаг (хөтчийн Date.now()). */
  startedAt: number;
  /** Зарцуулсан хугацаа, хязгаараас хэтрэхгүй. */
  elapsedMs: number;
  done: boolean;
};

export type TypingLevels = [min: number, points: number][];

export type TypingStats = {
  words: number;
  chars: number;
  /** Зөв шивсэн тэмдэгт (edit distance-аар). */
  correctChars: number;
  minutes: number;
  /** Үг/мин. */
  wpm: number;
  /** Зөв шивсэн тэмдэгтийн хувь, 0–100. */
  accuracy: number;
};

const clean = (s: string) => s.replace(/\s+/g, " ").replace(/^ /, "");

/**
 * Шивсэн текстийг эх текстийн эхлэлтэй тулгах хамгийн бага засварын тоо. Эх текстийн
 * төгсгөл чөлөөтэй (сурагч дуусгаагүй байж болно). Нэг үсэг алгасахад араас нь бүгд
 * буруу болохгүй.
 */
function prefixEditDistance(typed: string, target: string): number {
  const n = typed.length;
  const m = target.length;
  let prev = Array.from({ length: m + 1 }, (_, j) => j);
  for (let i = 1; i <= n; i++) {
    const cur = new Array<number>(m + 1);
    cur[0] = i;
    for (let j = 1; j <= m; j++) {
      const sub = prev[j - 1] + (typed[i - 1] === target[j - 1] ? 0 : 1);
      cur[j] = Math.min(sub, prev[j] + 1, cur[j - 1] + 1);
    }
    prev = cur;
  }
  return Math.min(...prev);
}

export function typingStats(target: string, typed: string, elapsedMs: number, limitMs: number): TypingStats {
  const t = clean(typed);
  const goal = clean(target).trimEnd();
  const chars = t.length;
  const words = t.split(" ").filter(Boolean).length;
  const correctChars = chars === 0 ? 0 : Math.max(0, chars - prefixEditDistance(t, goal));
  // Хурдыг бүтэн хугацаагаар тооцно: хэдэн үг шивээд эрт зогсвол хурд өндөр гарахгүй.
  // Текстийг бүхэлд нь эрт дуусгасан бол л бодит хугацаагаар (хамгийн багадаа 1 с).
  const complete = chars >= goal.length;
  const ms = complete ? Math.min(Math.max(elapsedMs || limitMs, 1000), limitMs) : limitMs;
  const minutes = ms / 60_000;
  return {
    words,
    chars,
    correctChars,
    minutes,
    wpm: words / minutes,
    accuracy: chars === 0 ? 0 : (correctChars / chars) * 100,
  };
}

/** levels: [доод хязгаар, оноо] буурах эрэмбээр. Юу ч шивээгүй бол 0. */
export function levelScore(value: number, levels: TypingLevels, typedSomething: boolean): number {
  if (!typedSomething) return 0;
  for (const [min, points] of levels) if (value >= min) return points;
  return 0;
}

/** Харуулахад: 14.67 → "14.7". */
export const fmt1 = (x: number) => (Math.round(x * 10) / 10).toString();
