"use client";

import { css } from "@codemirror/lang-css";
import { html, htmlLanguage } from "@codemirror/lang-html";
import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { abbreviationTracker, emmetCompletionSource, emmetConfig, EmmetKnownSyntax } from "@emmetio/codemirror6-plugin";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { useMemo, useState, type ReactNode } from "react";
import type { CodeLang } from "@/lib/lang";
import { jsxEmmetCompletion, vscodeKeys } from "./editorKeys";
import { reactSnippets } from "./reactSnippets";

// VS Code (Dark Modern)-ийн хүрээний өнгө: таб, статус мөр.
const chrome = {
  bar: "#181818",
  tab: "#1f1f1f",
  border: "#2b2b2b",
  text: "#cccccc",
  dim: "#9d9d9d",
  accent: "#0078d4",
};

const layout = EditorView.theme(
  {
    "&": { fontSize: "14px" },
    ".cm-scroller, .cm-content": { fontFamily: "var(--mono)", lineHeight: "1.55" },
    "&.cm-focused": { outline: "none" },
    ".cm-gutters": { borderRight: "none" },
    ".cm-tooltip": { border: `1px solid #454545`, backgroundColor: "#252526", color: chrome.text },
    ".cm-tooltip-autocomplete > ul > li[aria-selected]": { backgroundColor: "#04395e", color: "#fff" },
    ".cm-tooltip-autocomplete > ul": { fontFamily: "var(--mono)", fontSize: "13px" },
    ".cm-completionDetail": { color: chrome.dim },
    ".cm-completionInfo": { fontFamily: "var(--mono)", fontSize: "13px", whiteSpace: "pre" },
    // Emmet-ийн дэлгэрүүлэлтийг урьдчилан харах цонх.
    ".emmet-preview": { backgroundColor: "#252526", color: chrome.text, padding: "4px 8px", fontFamily: "var(--mono)" },
    ".emmet-abbreviation": { textDecoration: `underline 1px ${chrome.accent}`, textUnderlineOffset: "3px" },
  },
  { dark: true },
);

const langLabel: Record<CodeLang, string> = { python: "Python", html: "HTML", css: "CSS", jsx: "JavaScript JSX" };
const defaultFile: Record<CodeLang, string> = { python: "main.py", html: "index.html", css: "style.css", jsx: "App.jsx" };

/** VS Code-ийн файлын дүрс: өргөтгөлөөр өнгөтэй тэмдэг. */
export function FileIcon({ name }: { name: string }) {
  const [glyph, color] = name.endsWith(".py")
    ? ["py", "#4b8bbe"]
    : name.endsWith(".css")
      ? ["#", "#42a5f5"]
      : name.endsWith(".jsx") || name.endsWith(".js")
        ? ["⚛", "#61dafb"]
        : ["<>", "#e44d26"];
  return (
    <span aria-hidden className="inline-block min-w-4 text-center font-mono text-[0.78rem] font-bold" style={{ color }}>
      {glyph}
    </span>
  );
}

/** Файлын нэг таб (VS Code маягаар идэвхтэй нь дээрээ цэнхэр зураастай). */
export function EditorTab({
  name,
  active = true,
  onSelect,
  onClose,
}: {
  name: string;
  active?: boolean;
  onSelect?: () => void;
  onClose?: () => void;
}) {
  return (
    <span
      className="flex items-center border-r"
      style={{
        borderColor: chrome.border,
        backgroundColor: active ? chrome.tab : chrome.bar,
        boxShadow: active ? `inset 0 1px 0 ${chrome.accent}` : undefined,
      }}
    >
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={onSelect}
        className="flex items-center gap-1.5 py-2 pr-2 pl-3 font-mono text-[0.8rem]"
        style={{ color: active ? "#ffffff" : chrome.dim }}
      >
        <FileIcon name={name} />
        {name}
      </button>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="mr-1.5 grid h-5 w-5 place-items-center rounded text-[0.8rem] hover:bg-white/10"
          style={{ color: chrome.dim }}
          aria-label={`${name} устгах`}
        >
          ✕
        </button>
      )}
    </span>
  );
}

/**
 * VS Code шиг код засварлагч: Dark+ өнгө, файлын таб, автомат санал, хаалт/таг
 * автоматаар хаах, HTML/CSS/JSX-д Emmet (жишээ нь `ul>li*3`, `m10`, `div.card` + Tab),
 * доор нь мөр/баганын статус.
 */
export function CodeEditor({
  value,
  onChange,
  lang,
  readOnly = false,
  minHeight = "12rem",
  height,
  fileName,
  tabs,
}: {
  value: string;
  onChange?: (v: string) => void;
  lang: CodeLang;
  readOnly?: boolean;
  minHeight?: string;
  height?: string;
  fileName?: string;
  /** Олон файлтай үед өөрийн табууд (эс бөгөөс fileName-ийн ганц таб). */
  tabs?: ReactNode;
}) {
  const [cursor, setCursor] = useState({ line: 1, col: 1 });

  const extensions = useMemo(() => {
    const language =
      lang === "python" ? python() : lang === "css" ? css() : lang === "jsx" ? javascript({ jsx: true }) : html();
    // HTML/CSS-д Emmet-ийн tracker (урьдчилан харах, Tab), JSX-д өөрийн дүрэм (editorKeys).
    const emmet = readOnly
      ? []
      : lang === "jsx"
        ? [
            javascriptLanguage.data.of({ autocomplete: jsxEmmetCompletion }),
            javascriptLanguage.data.of({ autocomplete: reactSnippets(fileName ?? defaultFile.jsx) }),
          ]
        : lang === "python"
          ? []
          : [
              emmetConfig.of({ syntax: lang === "css" ? EmmetKnownSyntax.css : EmmetKnownSyntax.html }),
              abbreviationTracker(),
              htmlLanguage.data.of({ autocomplete: emmetCompletionSource }),
            ];
    const status = EditorView.updateListener.of((u) => {
      if (!u.selectionSet && !u.docChanged) return;
      const head = u.state.selection.main.head;
      const line = u.state.doc.lineAt(head);
      setCursor({ line: line.number, col: head - line.from + 1 });
    });
    return [language, ...emmet, vscodeKeys(lang === "jsx"), layout, EditorView.lineWrapping, status];
  }, [lang, readOnly, fileName]);
  // Шинэ объект бүр засварлагчийг дахин тохируулж, snippet-ийн талбар зэрэг төлөвийг устгадаг.
  const setup = useMemo(
    () => ({ foldGutter: false, highlightActiveLine: !readOnly, autocompletion: !readOnly }),
    [readOnly],
  );

  return (
    <div
      className="overflow-hidden rounded-lg border focus-within:border-[#0078d4]"
      style={{ borderColor: chrome.border, backgroundColor: chrome.tab }}
    >
      <div className="flex min-h-9 flex-wrap items-stretch" role="tablist" style={{ backgroundColor: chrome.bar }}>
        {tabs ?? <EditorTab name={fileName ?? defaultFile[lang]} />}
      </div>
      <CodeMirror
        value={value}
        onChange={onChange}
        theme={vscodeDark}
        extensions={extensions}
        readOnly={readOnly}
        editable={!readOnly}
        minHeight={minHeight}
        height={height}
        basicSetup={setup}
        indentWithTab={false}
      />
      <div
        className="flex items-center justify-between gap-3 px-3 py-0.5 text-[0.75rem] text-white"
        style={{ backgroundColor: chrome.accent }}
      >
        <span>
          {readOnly
            ? "Зөвхөн унших"
            : lang === "jsx"
              ? "Emmet, React snippet (rfc, us, ue…): бичээд Tab"
              : lang === "python"
                ? ""
                : "Emmet: товчлол бичээд Tab"}
        </span>
        <span className="flex gap-4 tabular-nums">
          <span>
            Ln {cursor.line}, Col {cursor.col}
          </span>
          <span>{langLabel[lang]}</span>
        </span>
      </div>
    </div>
  );
}
