// VS Code шиг товчлуурын үйлдэл: Tab-аар санал хүлээн авах, JSX дотор Emmet,
// эс бөгөөс курсорын байрлалд догол оруулах.

import {
  acceptCompletion,
  completionStatus,
  hasNextSnippetField,
  hasPrevSnippetField,
  nextSnippetField,
  prevSnippetField,
  type CompletionSource,
} from "@codemirror/autocomplete";
import { indentLess, indentMore } from "@codemirror/commands";
import { javascriptLanguage } from "@codemirror/lang-javascript";
import { getIndentUnit, syntaxTree } from "@codemirror/language";
import { EditorSelection, Prec, type EditorState, type Extension } from "@codemirror/state";
import { keymap, type EditorView } from "@codemirror/view";
import expand, { extract } from "emmet";

// VS Code-ийн JSX Emmet шиг: зөвхөн HTML тагаар (эсвэл .анги, #id-аар) эхэлсэн товчлолыг
// дэлгэрүүлнэ. Ингэснээр `return`, `const` зэрэг JS үг хөндөгдөхгүй.
const tags = new Set(
  (
    "a abbr address article aside audio b blockquote br button canvas caption code col colgroup dd del details dialog div " +
    "dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr i iframe img input ins kbd label legend li " +
    "main mark nav ol optgroup option output p picture pre progress q s section select small source span strong sub summary " +
    "sup table tbody td textarea tfoot th thead time tr u ul video"
  ).split(" "),
);
const notJsx = new Set(["String", "TemplateString", "LineComment", "BlockComment", "VariableDefinition"]);
/** JSX гарч болох байрлал: мөрийн эхэнд, `(`, `>`, `return`, `&&`, `?`-ийн дараа. */
const jsxPosition = /(^|[(>?]|&&|\breturn)\s*$/;

function jsxAbbreviation(state: EditorState, pos: number): { from: number; abbr: string } | null {
  if (!javascriptLanguage.isActiveAt(state, pos)) return null;
  if (notJsx.has(syntaxTree(state).resolveInner(pos, -1).name)) return null;
  const line = state.doc.lineAt(pos);
  const before = line.text.slice(0, pos - line.from);
  const found = extract(before, before.length, { type: "markup", lookAhead: false });
  if (!found) return null;
  const abbr = found.abbreviation;
  const tag = /^[a-z][a-z0-9]*/.exec(abbr)?.[0];
  if (!(abbr.startsWith(".") || abbr.startsWith("#") || (tag && tags.has(tag)))) return null;
  const prefix = before.slice(0, found.start);
  if (!jsxPosition.test(prefix)) return null;
  return { from: line.from + found.start, abbr };
}

/** Дэлгэрүүлж, курсорыг эхний хоосон таг дотор байрлуулна. */
function expandJsx(state: EditorState, abbr: string): { text: string; caret: number } | null {
  const indent = /^\s*/.exec(state.doc.lineAt(state.selection.main.head).text)![0];
  let marked = false;
  try {
    const out = expand(abbr, {
      syntax: "jsx",
      options: {
        "output.baseIndent": indent,
        "output.indent": " ".repeat(getIndentUnit(state)),
        "output.field": (_i, placeholder) => {
          if (marked) return placeholder;
          marked = true;
          return "" + placeholder;
        },
      },
    });
    const caret = out.indexOf("");
    const text = out.replace("", "");
    return text ? { text, caret: caret < 0 ? text.length : caret } : null;
  } catch {
    return null;
  }
}

function insertJsx(view: EditorView, from: number, to: number, abbr: string): boolean {
  const done = expandJsx(view.state, abbr);
  if (!done) return false;
  view.dispatch({
    changes: { from, to, insert: done.text },
    selection: EditorSelection.cursor(from + done.caret),
    userEvent: "input.complete",
  });
  return true;
}

function expandJsxAtCursor(view: EditorView): boolean {
  const sel = view.state.selection.main;
  if (!sel.empty) return false;
  const found = jsxAbbreviation(view.state, sel.head);
  return !!found && insertJsx(view, found.from, sel.head, found.abbr);
}

/** JSX-д Emmet-ийг санал болгох жагсаалтын эхэнд харуулна (VS Code шиг). */
export const jsxEmmetCompletion: CompletionSource = (ctx) => {
  const found = jsxAbbreviation(ctx.state, ctx.pos);
  if (!found || (found.abbr.length < 2 && !ctx.explicit)) return null;
  const preview = expandJsx(ctx.state, found.abbr);
  if (!preview) return null;
  return {
    from: found.from,
    filter: false,
    options: [
      {
        label: found.abbr,
        detail: "Emmet",
        type: "keyword",
        boost: 99,
        info: preview.text.trim(),
        apply: (view, _c, from, to) => void insertJsx(view, from, to, found.abbr),
      },
    ],
  };
};

/** Сонголтгүй бол курсорын байрлалд дараагийн догол хүртэл зай оруулна (мөрийг бүхэлд нь биш). */
function insertIndent(view: EditorView): boolean {
  const { state } = view;
  if (state.selection.ranges.some((r) => !r.empty)) return indentMore(view);
  const unit = getIndentUnit(state);
  view.dispatch(
    state.changeByRange((r) => {
      const col = r.head - state.doc.lineAt(r.head).from;
      const spaces = " ".repeat(unit - (col % unit));
      return { changes: { from: r.head, insert: spaces }, range: EditorSelection.cursor(r.head + spaces.length) };
    }),
    { userEvent: "input.indent" },
  );
  return true;
}

/**
 * Tab-ын дараалал: нээлттэй санал → snippet-ийн дараагийн талбар → JSX Emmet →
 * (HTML/CSS Emmet tracker өөрийн товчлуураар) → догол. Shift+Tab: өмнөх талбар эсвэл догол багасгана.
 */
export function vscodeKeys(jsx: boolean): Extension {
  return [
    Prec.highest(
      keymap.of([
        { key: "Tab", run: (v) => completionStatus(v.state) === "active" && acceptCompletion(v) },
        { key: "Tab", run: (v) => hasNextSnippetField(v.state) && nextSnippetField(v) },
        { key: "Shift-Tab", run: (v) => hasPrevSnippetField(v.state) && prevSnippetField(v) },
        ...(jsx ? [{ key: "Tab", run: expandJsxAtCursor }] : []),
      ]),
    ),
    Prec.low(keymap.of([{ key: "Tab", run: insertIndent, shift: indentLess }])),
  ];
}
