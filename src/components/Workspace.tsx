"use client";

import type { Tool } from "@/content/types";
import type { AnswerResponse } from "@/lib/types";
import dynamic from "next/dynamic";
import { useState } from "react";
import { langOfFile, sortFiles } from "@/lib/lang";
import { FlowDiagram } from "./Flow";
import { FlowchartEditor } from "./FlowchartEditor";

const CodeEditor = dynamic(() => import("./CodeEditor").then((m) => m.CodeEditor), {
  ssr: false,
  loading: () => <div className="h-48 rounded-lg border border-line bg-surface" />,
});
const PythonRunner = dynamic(() => import("./PythonRunner").then((m) => m.PythonRunner), { ssr: false });
const Preview = dynamic(() => import("./Preview").then((m) => m.Preview), { ssr: false });

const toolNames: Record<Tool, string> = {
  python: "Python",
  web: "HTML/CSS",
  react: "React",
  flowchart: "Блок схем",
  notes: "Тэмдэглэл",
};

const validFileName = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*\.(html|css|jsx|js)$/;

function FileTabs({
  files,
  active,
  onSelect,
  onAdd,
  onRemove,
  initial,
  readOnly,
}: {
  files: Record<string, string>;
  active: string;
  onSelect: (f: string) => void;
  onAdd?: (f: string) => void;
  onRemove?: (f: string) => void;
  initial: string[];
  readOnly?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!validFileName.test(n)) return setError("Нэр нь латин үсэг, тоогоор, .html .css .jsx .js өргөтгөлтэй байна");
    if (files[n] !== undefined) return setError("Ийм нэртэй файл байна");
    onAdd?.(n);
    setAdding(false);
    setName("");
    setError("");
  };
  return (
    <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label="Файлууд">
      {sortFiles(Object.keys(files)).map((f) => (
        <span key={f} className="flex items-center">
          <button
            type="button"
            role="tab"
            aria-selected={active === f}
            onClick={() => onSelect(f)}
            className={`rounded-md px-2.5 py-1 font-mono text-[0.82rem] ${
              active === f ? "bg-ink text-white" : "bg-surface text-ink hover:bg-tint"
            }`}
          >
            {f}
          </button>
          {!readOnly && onRemove && !initial.includes(f) && (
            <button type="button" className="px-1 text-muted hover:text-bad" onClick={() => onRemove(f)} aria-label={`${f} устгах`}>
              ✕
            </button>
          )}
        </span>
      ))}
      {!readOnly && onAdd && !adding && (
        <button type="button" className="rounded-md px-2.5 py-1 text-[0.82rem] text-indigo hover:bg-tint" onClick={() => setAdding(true)}>
          + Файл
        </button>
      )}
      {adding && (
        <form onSubmit={add} className="flex items-center gap-1">
          <input
            autoFocus
            className="field w-48 py-1 font-mono text-[0.82rem]"
            placeholder="components/Footer.jsx"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Шинэ файлын нэр"
          />
          <button className="btn btn-primary py-1">Нэмэх</button>
          <button type="button" className="btn btn-ghost py-1" onClick={() => setAdding(false)}>
            Болих
          </button>
          {error && <span className="w-full text-sm text-bad">{error}</span>}
        </form>
      )}
    </div>
  );
}

function CodeWorkspace({
  tool,
  files,
  initial,
  images,
  onFiles,
  readOnly,
}: {
  tool: "python" | "web" | "react";
  files: Record<string, string>;
  initial: string[];
  images: Record<string, string>;
  onFiles: (f: Record<string, string>) => void;
  readOnly?: boolean;
}) {
  const names = sortFiles(Object.keys(files));
  const [active, setActive] = useState(names[0] ?? "");
  const [runToken, setRunToken] = useState(0);
  const current = files[active] !== undefined ? active : names[0];
  const setFile = (v: string) => onFiles({ ...files, [current]: v });

  const editor = (
    <div className="flex min-w-0 flex-col gap-2">
      {tool !== "python" && (
        <FileTabs
          files={files}
          active={current}
          onSelect={setActive}
          initial={initial}
          readOnly={readOnly}
          onAdd={(f) => {
            onFiles({ ...files, [f]: "" });
            setActive(f);
          }}
          onRemove={(f) => {
            const next = { ...files };
            delete next[f];
            onFiles(next);
          }}
        />
      )}
      {current !== undefined && (
        <CodeEditor
          key={current}
          value={files[current] ?? ""}
          onChange={readOnly ? undefined : setFile}
          lang={langOfFile(current)}
          readOnly={readOnly}
          minHeight={tool === "python" ? "16rem" : "22rem"}
        />
      )}
    </div>
  );

  if (tool === "python") {
    return (
      <div className="flex flex-col gap-3">
        {editor}
        <PythonRunner code={files[current] ?? ""} autoload={!readOnly} />
      </div>
    );
  }
  return (
    <div className="grid gap-3 2xl:grid-cols-2">
      {editor}
      <div className="flex min-h-80 flex-col gap-2">
        {tool === "react" && (
          <button type="button" className="btn btn-primary self-start" onClick={() => setRunToken((t) => t + 1)}>
            ▶ Ажиллуулах
          </button>
        )}
        <Preview mode={tool} files={files} images={images} runToken={runToken} />
      </div>
    </div>
  );
}

export function Workspace({
  tools,
  initialFiles,
  images,
  value,
  onChange,
  readOnly = false,
}: {
  tools: Tool[];
  initialFiles: Record<string, string>;
  images: Record<string, string>;
  value: AnswerResponse;
  onChange?: (v: AnswerResponse) => void;
  readOnly?: boolean;
}) {
  const [tab, setTab] = useState<Tool>(tools[0]);
  const files = value.files ?? initialFiles;
  const set = (patch: Partial<AnswerResponse>) => onChange?.({ ...value, files, ...patch });

  const body = (tool: Tool) => {
    switch (tool) {
      case "python":
      case "web":
      case "react":
        return (
          <CodeWorkspace
            tool={tool}
            files={files}
            initial={Object.keys(initialFiles)}
            images={images}
            onFiles={(f) => set({ files: f })}
            readOnly={readOnly}
          />
        );
      case "flowchart":
        return readOnly ? (
          <FlowDiagram nodes={value.flowchart ?? []} vertical />
        ) : (
          <FlowchartEditor nodes={value.flowchart ?? []} onChange={(flowchart) => set({ flowchart })} />
        );
      case "notes":
        return (
          <textarea
            className="field min-h-48 font-mono text-[0.9rem]"
            value={value.notes ?? ""}
            onChange={(e) => set({ notes: e.target.value })}
            readOnly={readOnly}
            aria-label="Тэмдэглэл"
            placeholder={"Жишээ нь мөрдөх хүснэгт:\nүнэ1 = 3500\nүнэ2 = 2000\n…"}
          />
        );
    }
  };

  if (tools.length === 1) return <div>{body(tools[0])}</div>;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 border-b border-line" role="tablist">
        {tools.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 font-semibold ${
              tab === t ? "border-indigo text-indigo" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {toolNames[t]}
          </button>
        ))}
      </div>
      {tools.map((t) => (
        <div key={t} hidden={tab !== t}>
          {body(t)}
        </div>
      ))}
    </div>
  );
}
