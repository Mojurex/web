import { describe, expect, it } from "vitest";
import { autoScore, matches, normalize, summarize } from "./grading";

describe("normalize", () => {
  it("хасах тэмдэг, зай, том жижиг үсгийг нэгтгэнэ", () => {
    expect(normalize("  −30 ")).toBe("-30");
    expect(normalize("Нэр:   Тэмүүлэн")).toBe("нэр: тэмүүлэн");
  });
  it("латин, кирилл ижил үсгийг нэгтгэнэ", () => {
    expect(normalize("K")).toBe(normalize("К"));
    expect(normalize("a")).toBe(normalize("а"));
  });
});

describe("matches", () => {
  it("яг тэнцүү (зай ялгахгүй)", () => {
    expect(matches("-30", ["-30"])).toBe(true);
    expect(matches("− 30", ["-30"])).toBe(true);
    expect(matches("Нэр:Тэмүүлэн", ["Нэр: Тэмүүлэн"])).toBe(true);
    expect(matches("30", ["-30"])).toBe(false);
  });
  it("хоосон хариулт буруу", () => {
    expect(matches("", ["5"])).toBe(false);
    expect(matches(undefined, ["5"])).toBe(false);
    expect(matches("   ", ["5"])).toBe(false);
  });
  it("~ бол бүх үг агуулагдсан эсэхийг шалгана", () => {
    expect(matches("зүүн гарын долоовор хуруу", ["~зүүн долоовор"])).toBe(true);
    expect(matches("баруун долоовор", ["~зүүн долоовор"])).toBe(false);
  });
  it("олон хувилбарын аль нэг таарвал зөв", () => {
    expect(matches("эрхий хуруу", ["Space", "~эрхий"])).toBe(true);
  });
});

describe("autoScore", () => {
  const mcq = { type: "mcq" as const, points: 2, answer_key: { answer: "В" }, rubric: [] };
  it("mcq зөв бол бүтэн оноо, буруу эсвэл хоосон бол 0", () => {
    expect(autoScore(mcq, { choice: "В" })).toEqual([2]);
    expect(autoScore(mcq, { choice: "А" })).toEqual([0]);
    expect(autoScore(mcq, {})).toEqual([0]);
    expect(autoScore(mcq, undefined)).toEqual([0]);
  });

  const open = {
    type: "open" as const,
    points: 5,
    answer_key: {},
    rubric: [
      { label: "x = 50", points: 2, blank: "x", accept: ["50"] },
      { label: "y = −30", points: 2, blank: "y", accept: ["-30"] },
      { label: "Тайлбар зөв", points: 1 },
    ],
  };
  it("нүдтэй мөрийг автоматаар, бусдыг null үлдээнэ", () => {
    expect(autoScore(open, { blanks: { x: "50", y: "−30" } })).toEqual([2, 2, null]);
    expect(autoScore(open, { blanks: { x: "5" } })).toEqual([0, 0, null]);
  });
  it("практик даалгавар бүхэлдээ багш шалгана", () => {
    const task = { type: "task" as const, points: 6, answer_key: {}, rubric: [{ label: "a", points: 6 }] };
    expect(autoScore(task, {})).toEqual([null]);
  });
});

describe("summarize", () => {
  it("бүх мөр шалгагдсан бол graded", () => {
    expect(summarize([2, 2, 1], 3)).toEqual({ score: 5, graded: true });
    expect(summarize([2, 2, null], 3)).toEqual({ score: 4, graded: false });
    expect(summarize(null, 2)).toEqual({ score: 0, graded: false });
  });
});
