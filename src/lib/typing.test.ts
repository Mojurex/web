import { describe, expect, it } from "vitest";
import { levelScore, typingStats } from "./typing";

const target = "Манай гэр бүл зун хөдөө явсан. Бид уулын бэлд гэр барьж";
const min3 = 180_000;

describe("typingStats", () => {
  it("алдаагүй бол 100%, үгийг тоолно, хурдыг бүтэн хугацаагаар", () => {
    const s = typingStats(target, "Манай гэр бүл зун", 60_000, min3);
    expect(s.words).toBe(4);
    expect(s.accuracy).toBe(100);
    expect(s.minutes).toBe(3);
  });

  it("хэдэн үг шивээд эрт зогсвол хурд өсөхгүй", () => {
    expect(typingStats(target, "Манай гэр", 2_000, min3).wpm).toBeCloseTo(2 / 3);
  });

  it("текстийг бүхэлд нь эрт дуусгавал бодит хугацаагаар", () => {
    const s = typingStats(target, target, 60_000, min3);
    expect(s.minutes).toBe(1);
    expect(s.wpm).toBe(11);
  });

  it("нэг үсэг алгасахад араас нь бүгд буруу болохгүй", () => {
    // «гэр» → «гр»: 1 алдаа
    const s = typingStats(target, "Манай гр бүл зун хөдөө явсан.", 60_000, min3);
    expect(s.chars).toBe(29);
    expect(s.correctChars).toBe(28);
    expect(s.accuracy).toBeCloseTo((28 / 29) * 100);
  });

  it("илүү зай, мөр шилжилтийг нэгтгэнэ", () => {
    expect(typingStats(target, "  Манай   гэр\nбүл", 60_000, min3).accuracy).toBe(100);
  });

  it("латин гар: бүгд буруу", () => {
    expect(typingStats(target, "Vfyfq", 60_000, min3).accuracy).toBe(0);
  });

  it("хугацааг хязгаараар таслана, хоосон бол хязгаарыг авна", () => {
    expect(typingStats(target, "Манай гэр бүл", 999_999, min3).minutes).toBe(3);
    expect(typingStats(target, "Манай гэр бүл", 0, min3).minutes).toBe(3);
  });

  it("юу ч шивээгүй", () => {
    const s = typingStats(target, "   ", 60_000, min3);
    expect(s).toMatchObject({ words: 0, chars: 0, accuracy: 0, wpm: 0 });
  });
});

describe("levelScore", () => {
  const wpm: [number, number][] = [[15, 8], [11, 6], [7, 4], [3, 2], [0, 1]];
  it("шатлалаар оноо өгнө", () => {
    expect(levelScore(16, wpm, true)).toBe(8);
    expect(levelScore(15, wpm, true)).toBe(8);
    expect(levelScore(14.9, wpm, true)).toBe(6);
    expect(levelScore(2, wpm, true)).toBe(1);
  });
  it("шивээгүй бол 0", () => {
    expect(levelScore(0, wpm, false)).toBe(0);
  });
});
