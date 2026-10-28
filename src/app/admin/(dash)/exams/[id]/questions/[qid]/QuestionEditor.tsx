"use client";

import type { ResponseInput, Tool } from "@/content/types";
import { Markdown } from "@/components/Markdown";
import type { Question, TaskPartPublic, TaskPayload, TaskRubricItem } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteQuestion, saveQuestion, type QuestionDraft } from "../../../../../actions";

const inputOptions: [string, string][] = [
  ["text", "Бичвэр"],
  ["none", "Зөвхөн нүд ({{…}})"],
  ["flowchart", "Блок схем"],
  ["python", "Python код"],
  ["html", "HTML код"],
  ["css", "CSS код"],
  ["jsx", "React (JSX) код"],
];
const toolOptions: [Tool, string][] = [
  ["python", "Python"],
  ["web", "HTML/CSS"],
  ["react", "React"],
  ["flowchart", "Блок схем"],
  ["notes", "Тэмдэглэл"],
  ["typing", "Шивэх дасгал"],
];

function inputToString(i: ResponseInput | undefined): string {
  return typeof i === "object" ? i.code : (i ?? "text");
}
function stringToInput(s: string): ResponseInput {
  return ["text", "none", "flowchart"].includes(s) ? (s as ResponseInput) : { code: s as "python" };
}

const Label = ({ children }: { children: React.ReactNode }) => <span className="text-sm font-semibold">{children}</span>;

export function QuestionEditor({ examId, question, section }: { examId: string; question: Question | null; section: "A" | "B" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ error?: string; ok?: string }>({});
  const task = question?.type === "task" ? (question.payload as TaskPayload) : null;

  const [type, setType] = useState<QuestionDraft["type"]>(question?.type ?? (section === "B" ? "task" : "mcq"));
  const [number, setNumber] = useState(question?.number ?? "");
  const [points, setPoints] = useState(question?.points ?? 2);
  const [prompt, setPrompt] = useState(question?.prompt ?? "");
  const [options, setOptions] = useState<[string, string][]>(
    question?.type === "mcq" ? question.payload.options : [["А", ""], ["Б", ""], ["В", ""], ["Г", ""]],
  );
  const [answer, setAnswer] = useState(question?.answer_key.answer ?? "");
  const [input, setInput] = useState(inputToString(question?.type === "open" ? question.payload.input : undefined));
  const [rubric, setRubric] = useState<TaskRubricItem[]>(question?.rubric ?? []);
  const [key, setKey] = useState(question?.answer_key.key ?? "");
  const [title, setTitle] = useState(task?.title ?? "");
  const [offline, setOffline] = useState(task?.tools === "offline");
  const [tools, setTools] = useState<Tool[]>(task && task.tools !== "offline" ? task.tools : ["python"]);
  const [workspace, setWorkspace] = useState(task?.workspace ?? "");
  const [files, setFiles] = useState<[string, string][]>(Object.entries(task?.files ?? { "main.py": "" }));
  const [images, setImages] = useState(
    Object.entries(task?.images ?? {})
      .map(([n, e]) => `${n} = ${e}`)
      .join("\n"),
  );
  const [parts, setParts] = useState<TaskPartPublic[]>(task?.parts ?? [{ n: "", text: "", points: 0 }]);
  const [typingText, setTypingText] = useState(task?.typing?.text ?? "");
  const [typingSeconds, setTypingSeconds] = useState(task?.typing?.seconds ?? 180);
  const [previewBlanks, setPreviewBlanks] = useState<Record<string, string>>({});

  const rubricSum = rubric.reduce((s, r) => s + (Number(r.points) || 0), 0);
  const blankIds = [...prompt.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);

  const draft = (): QuestionDraft => ({
    id: question?.id,
    examId,
    section,
    type,
    number,
    points: Number(points),
    prompt,
    options,
    answer,
    input: stringToInput(input),
    rubric: rubric.map((r) => ({
      ...r,
      points: Number(r.points),
      blank: r.blank?.trim() || undefined,
      accept: r.blank?.trim() ? (r.accept ?? []).map((a) => a.trim()).filter(Boolean) : undefined,
    })),
    key,
    task:
      type === "task"
        ? {
            title,
            tools: offline ? "offline" : tools,
            files: Object.fromEntries(files.filter(([n]) => n.trim())),
            images: Object.fromEntries(
              images
                .split("\n")
                .map((l) => l.split("=").map((x) => x.trim()))
                .filter(([n, e]) => n && e),
            ),
            workspace: workspace.trim() || null,
            typing: !offline && tools.includes("typing") ? { text: typingText.trim(), seconds: Number(typingSeconds) } : null,
            parts: parts.map((p) => ({ ...p, points: Number(p.points) })),
          }
        : undefined,
  });

  const save = () =>
    start(async () => {
      const res = await saveQuestion(draft());
      setMessage(res);
      if (res.id && !question) router.replace(`/admin/exams/${examId}/questions/${res.id}`);
    });

  const updateRubric = (i: number, patch: Partial<TaskRubricItem>) =>
    setRubric(rubric.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="flex flex-col gap-5">
        {!question && (
          <label className="flex flex-col gap-1">
            <Label>Төрөл</Label>
            <select className="field" value={type} onChange={(e) => setType(e.target.value as QuestionDraft["type"])}>
              {section === "A" ? (
                <>
                  <option value="mcq">Олон сонголттой</option>
                  <option value="open">Задгай</option>
                </>
              ) : (
                <option value="task">Практик даалгавар</option>
              )}
            </select>
          </label>
        )}
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <Label>Дугаар</Label>
            <input className="field" value={number} onChange={(e) => setNumber(e.target.value)} placeholder={section === "A" ? "1" : "П1"} />
          </label>
          <label className="flex flex-col gap-1">
            <Label>Оноо</Label>
            <input className="field" type="number" min={0.5} step={0.5} value={points} onChange={(e) => setPoints(Number(e.target.value))} />
          </label>
        </div>
        {type === "task" && (
          <label className="flex flex-col gap-1">
            <Label>Гарчиг</Label>
            <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
        )}
        <label className="flex flex-col gap-1">
          <Label>Бичвэр</Label>
          <textarea className="field min-h-48 font-mono text-sm" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          <span className="text-sm text-muted">
            Markdown. {"{{x}}"} — сурагч бөглөх нүд. Код: ```python … ```. Scratch: ```scratch … ```. Блок схем: ```flow мөр бүрт (эхлэл) /оролт/ [үйлдэл] ```.
          </span>
        </label>

        {type === "mcq" && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold">Сонголтууд (зөв хариултыг тэмдэглэнэ)</legend>
            {options.map(([k, t], i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name="answer" checked={answer === k && !!k} onChange={() => setAnswer(k)} aria-label={`${k} зөв`} />
                <input className="field w-14 text-center" value={k} onChange={(e) => setOptions(options.map((o, j) => (j === i ? [e.target.value, o[1]] : o)))} aria-label="Үсэг" />
                <input className="field flex-1" value={t} onChange={(e) => setOptions(options.map((o, j) => (j === i ? [o[0], e.target.value] : o)))} aria-label={`${k} сонголт`} />
                <button type="button" className="btn btn-ghost h-9 w-9 p-0 text-bad" onClick={() => setOptions(options.filter((_, j) => j !== i))} aria-label="Устгах">
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost self-start text-sm" onClick={() => setOptions([...options, ["", ""]])}>
              + Сонголт
            </button>
          </fieldset>
        )}

        {type === "open" && (
          <label className="flex flex-col gap-1">
            <Label>Хариулах хэлбэр</Label>
            <select className="field" value={input} onChange={(e) => setInput(e.target.value)}>
              {inputOptions.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        )}

        {type === "task" && (
          <>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-semibold">Ажлын орчин</legend>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} />
                Вэбээр өгөхгүй (компьютер дээр гүйцэтгэж, багш оноо оруулна)
              </label>
              {!offline && (
                <div className="flex flex-wrap gap-3">
                  {toolOptions.map(([t, l]) => (
                    <label key={t} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={tools.includes(t)}
                        onChange={(e) => setTools(e.target.checked ? [...tools, t] : tools.filter((x) => x !== t))}
                      />
                      {l}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
            {!offline && tools.includes("typing") && (
              <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
                <label className="flex flex-col gap-1">
                  <Label>Шивэх текст</Label>
                  <textarea className="field min-h-28" value={typingText} onChange={(e) => setTypingText(e.target.value)} />
                </label>
                <label className="flex flex-col gap-1">
                  <Label>Хугацаа (секунд)</Label>
                  <input
                    className="field"
                    type="number"
                    min={30}
                    max={1800}
                    value={typingSeconds}
                    onChange={(e) => setTypingSeconds(Number(e.target.value))}
                  />
                  <span className="text-sm text-muted">180 = 3 минут</span>
                </label>
              </div>
            )}
            {!offline && tools.some((t) => t !== "typing") && (
              <>
                <div className="flex flex-col gap-2">
                  <Label>Эхлэх файлууд</Label>
                  {files.map(([name, content], i) => (
                    <div key={i} className="flex flex-col gap-1 rounded-lg border border-line p-2">
                      <div className="flex gap-2">
                        <input className="field flex-1 font-mono text-sm" value={name} onChange={(e) => setFiles(files.map((f, j) => (j === i ? [e.target.value, f[1]] : f)))} aria-label="Файлын нэр" />
                        <button type="button" className="btn btn-ghost h-9 w-9 p-0 text-bad" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="Устгах">
                          ✕
                        </button>
                      </div>
                      <textarea className="field min-h-20 font-mono text-sm" value={content} onChange={(e) => setFiles(files.map((f, j) => (j === i ? [f[0], e.target.value] : f)))} aria-label={`${name} агуулга`} />
                    </div>
                  ))}
                  <button type="button" className="btn btn-ghost self-start text-sm" onClick={() => setFiles([...files, ["", ""]])}>
                    + Файл
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <Label>Бэлэн зургууд</Label>
                    <textarea className="field min-h-16 font-mono text-sm" value={images} onChange={(e) => setImages(e.target.value)} placeholder="sport.jpg = ⚽" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <Label>Нийтлэг файлын бүлэг</Label>
                    <input className="field" value={workspace} onChange={(e) => setWorkspace(e.target.value)} placeholder="site" />
                    <span className="text-sm text-muted">Ижил нэртэй даалгаврууд нэг файлууд дээр ажиллана.</span>
                  </label>
                </div>
              </>
            )}
            <div className="flex flex-col gap-2">
              <Label>Хэсгүүд</Label>
              {parts.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input className="field w-20" value={p.n} onChange={(e) => setParts(parts.map((x, j) => (j === i ? { ...x, n: e.target.value } : x)))} placeholder="П1.1" aria-label="Хэсгийн дугаар" />
                  <input className="field flex-1" value={p.text} onChange={(e) => setParts(parts.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} aria-label="Хэсгийн бичвэр" />
                  <input className="field w-20" type="number" min={0} step={0.5} value={p.points} onChange={(e) => setParts(parts.map((x, j) => (j === i ? { ...x, points: Number(e.target.value) } : x)))} aria-label="Оноо" />
                  <button type="button" className="btn btn-ghost h-10 w-9 p-0 text-bad" onClick={() => setParts(parts.filter((_, j) => j !== i))} aria-label="Устгах">
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-ghost self-start text-sm" onClick={() => setParts([...parts, { n: "", text: "", points: 0 }])}>
                + Хэсэг
              </button>
            </div>
          </>
        )}

        {type !== "mcq" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <Label>Шалгуур (рубрик)</Label>
              <span className={`text-sm ${rubricSum === Number(points) ? "text-good" : "text-bad"}`}>
                Нийлбэр {rubricSum} / {points}
              </span>
            </div>
            {rubric.map((r, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-lg border border-line p-2">
                <div className="flex gap-2">
                  {type === "task" && (
                    <select className="field w-24" value={r.part ?? ""} onChange={(e) => updateRubric(i, { part: e.target.value || undefined })} aria-label="Хэсэг">
                      <option value="">—</option>
                      {parts.map((p) => (
                        <option key={p.n} value={p.n}>
                          {p.n}
                        </option>
                      ))}
                    </select>
                  )}
                  <input className="field flex-1" value={r.label} onChange={(e) => updateRubric(i, { label: e.target.value })} aria-label="Шалгуур" />
                  <input className="field w-20" type="number" min={0.5} step={0.5} value={r.points} onChange={(e) => updateRubric(i, { points: Number(e.target.value) })} aria-label="Оноо" />
                  <button type="button" className="btn btn-ghost h-10 w-9 p-0 text-bad" onClick={() => setRubric(rubric.filter((_, j) => j !== i))} aria-label="Устгах">
                    ✕
                  </button>
                </div>
                {type === "open" && blankIds.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted">Автомат шалгах нүд:</span>
                    <select className="field w-28 py-1" value={r.blank ?? ""} onChange={(e) => updateRubric(i, { blank: e.target.value || undefined })}>
                      <option value="">Багш шалгана</option>
                      {blankIds.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                    {r.blank && (
                      <input
                        className="field flex-1 py-1"
                        value={(r.accept ?? []).join(" | ")}
                        onChange={(e) => updateRubric(i, { accept: e.target.value.split("|") })}
                        placeholder="Зөв хариултууд: 50 | 50.0 · ~зүүн долоовор (бүх үг орсон)"
                        aria-label="Зөв хариултууд"
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-ghost self-start text-sm" onClick={() => setRubric([...rubric, { label: "", points: 1 }])}>
              + Шалгуур
            </button>
          </div>
        )}

        {type !== "mcq" && (
          <label className="flex flex-col gap-1">
            <Label>Жишиг хариулт (зөвхөн багшид)</Label>
            <textarea className="field min-h-24 font-mono text-sm" value={key} onChange={(e) => setKey(e.target.value)} />
          </label>
        )}

        {message.error && <p role="alert" className="rounded-lg bg-bad-tint px-3 py-2 text-bad">{message.error}</p>}
        {message.ok && <p className="text-good">{message.ok}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={save} disabled={pending}>
            {pending ? "Хадгалж байна…" : "Хадгалах"}
          </button>
          {question && (
            <button
              type="button"
              className="btn btn-danger ml-auto"
              disabled={pending}
              onClick={() => confirm("Энэ асуултыг устгах уу? Сурагчдын хариулт, оноо мөн устна.") && start(() => deleteQuestion(question.id, examId))}
            >
              Устгах
            </button>
          )}
        </div>
      </div>

      <aside className="xl:sticky xl:top-6 xl:self-start">
        <p className="mb-2 text-sm font-semibold text-muted">Сурагчид харагдах байдал</p>
        <article className="rounded-2xl border border-line bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="qnum">{number || "?"}</span>
            <span className="text-sm text-muted">{points} оноо</span>
          </div>
          {type === "task" && <h2 className="mb-2 text-lg font-bold">{title}</h2>}
          <Markdown source={prompt} blanks={previewBlanks} onBlankChange={(id, v) => setPreviewBlanks({ ...previewBlanks, [id]: v })} />
          {type === "mcq" && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {options.map(([k, t], i) => (
                <li key={i} className={`flex gap-2 rounded-xl border-2 px-3 py-2 ${answer === k && k ? "border-good bg-good-tint" : "border-line"}`}>
                  <b>{k}</b> {t}
                </li>
              ))}
            </ul>
          )}
          {type === "task" && (
            <ol className="mt-3 flex flex-col gap-2">
              {parts.map((p, i) => (
                <li key={i} className="flex gap-3 border-t border-line pt-2 text-sm">
                  <span className="w-12 shrink-0 font-semibold text-indigo">{p.n}</span>
                  <span className="flex-1">{p.text}</span>
                  <span className="text-muted">{p.points}</span>
                </li>
              ))}
            </ol>
          )}
        </article>
      </aside>
    </div>
  );
}
