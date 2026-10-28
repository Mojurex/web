import { describe, expect, it } from "vitest";
import { autoScore } from "@/lib/grading";
import { grades } from ".";
import { validateGrade } from "./validate";

describe("агуулга", () => {
  it.each(grades.map((g) => [g.grade, g] as const))("%i-р анги бүтэц, оноо зөв", (_n, g) => {
    expect(validateGrade(g)).toEqual([]);
  });

  it("автомат нүд бүр өөрийн жишиг хариултаар бүтэн оноо авна", () => {
    for (const g of grades) {
      for (const v of Object.values(g.variants)) {
        for (const q of v.sectionA) {
          if (q.type !== "open") continue;
          const blanks = Object.fromEntries(
            q.rubric.filter((r) => r.blank).map((r) => [r.blank!, r.accept![0].replace(/^~/, "")]),
          );
          const scores = autoScore({ type: "open", points: q.points, answer_key: {}, rubric: q.rubric }, { blanks });
          q.rubric.forEach((r, i) => {
            if (r.blank) expect(scores[i], `${g.grade} ${q.n} ${r.label}`).toBe(r.points);
          });
        }
      }
    }
  });

  it("шивэх дасгал: бүтэн текстийг алдаагүй, хурдан шивбэл автомат хэсэг бүтэн оноотой, арга барил багшид", () => {
    for (const g of grades) {
      for (const v of Object.values(g.variants)) {
        for (const t of v.sectionB) {
          if (!t.typing) continue;
          const rubric = t.parts.flatMap((p) => p.rubric);
          const q = { type: "task" as const, points: t.points, answer_key: {}, rubric, payload: { typing: t.typing } };
          const fast = { typing: { typed: t.typing.text, startedAt: 1, elapsedMs: 60_000, done: true } };
          expect(autoScore(q, fast), `${g.grade} ${t.n}`).toEqual(rubric.map((r) => (r.typing ? r.points : null)));
          // Шивээгүй бол автомат хэсэг 0.
          expect(autoScore(q, {}).filter((x) => x !== null).every((x) => x === 0)).toBe(true);
        }
      }
    }
  });
});
