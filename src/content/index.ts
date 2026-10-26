import grade4 from "./grade4";
import grade6 from "./grade6";
import grade7 from "./grade7";
import grade8 from "./grade8";
import grade9 from "./grade9";
import grade10 from "./grade10";
import grade11 from "./grade11";
import grade12 from "./grade12";
import type { GradeContent } from "./types";

export const grades: GradeContent[] = [grade4, grade6, grade7, grade8, grade9, grade10, grade11, grade12];

export function findGrade(grade: number): GradeContent | undefined {
  return grades.find((g) => g.grade === grade);
}
