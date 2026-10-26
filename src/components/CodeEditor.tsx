"use client";

import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { useMemo } from "react";
import type { CodeLang } from "@/lib/lang";

const theme = EditorView.theme({
  "&": { fontSize: "14px", backgroundColor: "var(--surface)" },
  ".cm-scroller, .cm-content": { fontFamily: "var(--mono)" },
  ".cm-gutters": { backgroundColor: "var(--paper)", color: "var(--muted)", borderRight: "1px solid var(--line)" },
  "&.cm-focused": { outline: "none" },
});

export function CodeEditor({
  value,
  onChange,
  lang,
  readOnly = false,
  minHeight = "12rem",
  height,
}: {
  value: string;
  onChange?: (v: string) => void;
  lang: CodeLang;
  readOnly?: boolean;
  minHeight?: string;
  height?: string;
}) {
  const extensions = useMemo(() => {
    const language =
      lang === "python" ? python() : lang === "css" ? css() : lang === "jsx" ? javascript({ jsx: true }) : html();
    return [language, theme, EditorView.lineWrapping];
  }, [lang]);
  return (
    <div className="overflow-hidden rounded-lg border border-line focus-within:border-indigo">
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        readOnly={readOnly}
        editable={!readOnly}
        minHeight={minHeight}
        height={height}
        basicSetup={{ autocompletion: false, foldGutter: false, highlightActiveLine: !readOnly }}
        indentWithTab
      />
    </div>
  );
}
