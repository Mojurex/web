"use client";

import { Children, cloneElement, createContext, isValidElement, useContext, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { FlowDiagram, parseFlow } from "./Flow";
import { ScratchScript } from "./Scratch";

type BlankState = {
  values: Record<string, string>;
  onChange?: (id: string, value: string) => void;
  /** Багшийн харагдац: нүд бүрийн зөв/буруу. */
  marks?: Record<string, boolean>;
};

const BlankContext = createContext<BlankState>({ values: {} });

function Blank({ id }: { id: string }) {
  const { values, onChange, marks } = useContext(BlankContext);
  const value = values[id] ?? "";
  const mark = marks?.[id];
  if (!onChange) {
    return (
      <span
        className={`mx-1 inline-block min-w-16 border-b-2 px-2 font-semibold ${
          mark === undefined ? "border-indigo" : mark ? "border-good bg-good-tint" : "border-bad bg-bad-tint"
        }`}
      >
        {value || <span className="text-muted">хоосон</span>}
      </span>
    );
  }
  return (
    <input
      aria-label={`Нүд ${id}`}
      className="mx-1 inline-block w-36 border-0 border-b-2 border-indigo bg-tint px-2 py-0.5 font-semibold focus:outline-none focus:bg-surface"
      value={value}
      onChange={(e) => onChange(id, e.target.value)}
      autoComplete="off"
      spellCheck={false}
    />
  );
}

/** Текст доторх {{id}}-г нүдээр солино. */
function withBlanks(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === "string") {
      const parts = child.split(/\{\{(\w+)\}\}/g);
      if (parts.length === 1) return child;
      return parts.map((p, i) => (i % 2 ? <Blank key={i} id={p} /> : p));
    }
    if (isValidElement<{ children?: ReactNode }>(child) && child.props.children) {
      return cloneElement(child, undefined, withBlanks(child.props.children));
    }
    return child;
  });
}

/**
 * Даалгаврын зураг. Багана нарийн тул дарахад хуудсан дотор томруулна (шинэ таб нээвэл
 * таб сольсонд тооцогдоно). Esc эсвэл дахин дарахад хаагдана.
 */
function ZoomImage({ src, alt }: { src?: string; alt?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  if (!src) return null;
  return (
    <>
      <button type="button" className="block w-full cursor-zoom-in" onClick={() => setOpen(true)} aria-label={`${alt ?? "Зураг"} — томруулах`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt ?? ""} className="w-full rounded-lg border border-line" />
      </button>
      <span className="mt-1 block text-sm text-muted">Томруулж харах бол зураг дээр дарна уу.</span>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 grid cursor-zoom-out place-items-center bg-ink/70 p-4"
            role="dialog"
            aria-modal
            aria-label={alt}
            onClick={() => setOpen(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt ?? ""} className="max-h-full max-w-[min(100%,72rem)] rounded-xl bg-white shadow-2xl" />
          </div>,
          document.body,
        )}
    </>
  );
}

const components: Components = {
  img: ({ src, alt }) => <ZoomImage src={typeof src === "string" ? src : undefined} alt={alt} />,
  p: ({ children }) => <p>{withBlanks(children)}</p>,
  td: ({ children }) => <td>{withBlanks(children)}</td>,
  li: ({ children }) => <li>{withBlanks(children)}</li>,
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const lang = /language-(\w+)/.exec(className ?? "")?.[1];
    const text = String(children).replace(/\n$/, "");
    if (lang === "scratch") return <ScratchScript source={text} />;
    if (lang === "flow") return <FlowDiagram nodes={parseFlow(text)} />;
    if (!lang && !text.includes("\n")) return <code>{children}</code>;
    return (
      <pre className="my-3 overflow-x-auto rounded-lg border border-line bg-surface px-4 py-3 font-mono text-[0.88rem] leading-relaxed">
        <code>{text}</code>
      </pre>
    );
  },
};

export function Markdown({
  source,
  blanks,
  onBlankChange,
  marks,
}: {
  source: string;
  blanks?: Record<string, string>;
  onBlankChange?: (id: string, value: string) => void;
  marks?: Record<string, boolean>;
}) {
  return (
    <BlankContext.Provider value={{ values: blanks ?? {}, onChange: onBlankChange, marks }}>
      <div className="prose-exam">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {source}
        </ReactMarkdown>
      </div>
    </BlankContext.Provider>
  );
}
