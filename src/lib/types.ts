import type { ResponseInput, RubricItem, Tool, Unit } from "@/content/types";

export type Section = "A" | "B";

export type Exam = {
  id: string;
  grade: number;
  variant: "A" | "B";
  title: string;
  topic: string;
  access_code: string;
  is_open: boolean;
  section_a_minutes: number;
  section_b_minutes: number;
  focus_limit: number;
  notes: string[];
  units: Unit[];
};

export type TaskPartPublic = { n: string; text: string; points: number };

export type TaskPayload = {
  title: string;
  tools: Tool[] | "offline";
  files: Record<string, string>;
  images: Record<string, string>;
  workspace: string | null;
  parts: TaskPartPublic[];
};

export type McqPayload = { options: [string, string][] };
export type OpenPayload = { input: ResponseInput };

type Base = {
  id: string;
  exam_id: string;
  section: Section;
  position: number;
  number: string;
  points: number;
  prompt: string;
};

/** Сурагчид илгээх асуулт: answer_key, rubric агуулахгүй. */
export type PublicQuestion =
  | (Base & { type: "mcq"; payload: McqPayload })
  | (Base & { type: "open"; payload: OpenPayload })
  | (Base & { type: "task"; payload: TaskPayload });

export type TaskRubricItem = RubricItem & { part?: string };

export type Question = PublicQuestion & {
  answer_key: { answer?: string; key?: string };
  rubric: TaskRubricItem[];
};

export type FlowShape = "oval" | "io" | "process" | "decision";
export type FlowNode = { id: string; shape: FlowShape; text: string };

export type AnswerResponse = {
  choice?: string;
  blanks?: Record<string, string>;
  text?: string;
  files?: Record<string, string>;
  flowchart?: FlowNode[];
  notes?: string;
};

export type Attempt = {
  id: string;
  exam_id: string;
  student_name: string;
  student_code: string;
  token_hash: string | null;
  section: Section | "done";
  a_started_at: Date;
  a_deadline: Date;
  a_submitted_at: Date | null;
  b_started_at: Date | null;
  b_deadline: Date | null;
  b_submitted_at: Date | null;
  note: string;
  focus_count: number;
  focus_log: FocusEvent[];
  ended_by_focus: boolean;
  created_at: Date;
};

/** Сурагч шалгалтын цонхноос гарсан нэг тохиолдол. awayMs нь буцаж ирэхэд бөглөгдөнө. */
export type FocusEvent = { at: string; section: Section; awayMs?: number };

export type AnswerRow = {
  attempt_id: string;
  question_id: string;
  response: AnswerResponse;
  item_scores: (number | null)[] | null;
  comment: string;
  updated_at: Date;
};

export const isOnlineTask = (q: PublicQuestion) => q.type === "task" && q.payload.tools !== "offline";

/**
 * Ижил workspace-тэй даалгаврууд нэг хариултыг хуваалцана; хариулт нь бүлгийн
 * эхний даалгаврын id-аар хадгалагдана.
 */
export function workspaceOwner<Q extends PublicQuestion>(questions: Q[], q: Q): Q {
  if (q.type !== "task" || !q.payload.workspace) return q;
  return questions.find((o) => o.type === "task" && o.payload.workspace === q.payload.workspace) ?? q;
}
