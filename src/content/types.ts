// Шалгалтын агуулгын бүтэц. materials/ доторх PDF-ээс гараар хөрвүүлсэн.

export type Variant = "A" | "B";

/** Рубрикийн нэг мөр. `blank` заасан бол тухайн нүдийг автоматаар шалгана. */
export type RubricItem = {
  label: string;
  points: number;
  /** Prompt доторх {{id}} нүдний id. */
  blank?: string;
  /**
   * Зөв хариултын хувилбарууд. Энгийн мөр бол яг тэнцүү (зай, том жижиг үсэг,
   * хасах тэмдгийг ялгахгүй). "~" -ээр эхэлбэл доторх бүх үг агуулагдсан эсэхийг шалгана.
   */
  accept?: string[];
};

export type ResponseInput =
  | "text"
  | "none"
  | "flowchart"
  | { code: "python" | "html" | "css" | "jsx" };

export type McqQuestion = {
  n: string;
  type: "mcq";
  points: number;
  prompt: string;
  options: [string, string][];
  answer: string;
};

export type OpenQuestion = {
  n: string;
  type: "open";
  points: number;
  /** Markdown. {{id}} нь сурагчийн бөглөх нүд. */
  prompt: string;
  /** Нүднээс гадна хариулт бичих талбар. Анхдагч нь "text". */
  input?: ResponseInput;
  rubric: RubricItem[];
  /** Багшид харагдах жишиг хариулт. */
  key: string;
};

export type Question = McqQuestion | OpenQuestion;

export type Tool = "python" | "web" | "react" | "flowchart" | "notes";

export type TaskPart = {
  n: string;
  text: string;
  points: number;
  rubric: RubricItem[];
};

export type PracticalTask = {
  n: string;
  title: string;
  points: number;
  /** Markdown. */
  prompt: string;
  /** offline = вэбээр өгөхгүй, багш оноог гараар оруулна. */
  tools: Tool[] | "offline";
  /** Засварлагчийн эхлэх файлууд. */
  files?: Record<string, string>;
  /** Ижил workspace-тэй даалгаврууд нэг засварлагч, нэг хариултыг хуваалцана. */
  workspace?: string;
  /** Хуудсанд ашиглах бэлэн зургууд: файлын нэр → дүрслэх emoji. */
  images?: Record<string, string>;
  parts: TaskPart[];
  key?: string;
};

export type Unit = { name: string; questions: string; points: number };

export type ExamVariant = {
  sectionA: Question[];
  sectionB: PracticalTask[];
  units: Unit[];
};

export type GradeContent = {
  grade: number;
  roman: string;
  topic: string;
  sectionAMinutes: number;
  sectionBMinutes: number;
  /** Багшийн хөтчийн ерөнхий үнэлгээний заавар. */
  notes: string[];
  variants: Record<Variant, ExamVariant>;
};
