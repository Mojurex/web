// VS Code-ийн «ES7+ React/Redux/React-Native snippets» өргөтгөлийн түгээмэл товчлолууд.
// Жишээ: `rfc` + Tab → export default function компонент. Tab дарж дараагийн талбар руу шилжинэ.

import { snippetCompletion, type CompletionSource } from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";

/** «components/ProductCard.jsx» → «ProductCard». */
export function componentName(fileName: string): string {
  const base = fileName.split("/").pop()!.replace(/\.[^.]+$/, "");
  const name = base.replace(/[^\w$]/g, "");
  return /^[A-Z]/.test(name) ? name : name.charAt(0).toUpperCase() + name.slice(1) || "Component";
}

// Загварт `{`, `}`-ийг \{ \} гэж бичнэ (эс бөгөөс талбар гэж ойлгоно). \t = нэг догол.
const body = "\treturn (\n\t\t<div>${0}</div>\n\t);\n";

const templates = (n: string): [label: string, template: string, detail: string][] => [
  ["rfc", `export default function \${1:${n}}() \\{\n${body}\\}`, "React компонент · export default function"],
  ["rfce", `function \${1:${n}}() \\{\n${body}\\}\n\nexport default \${1:${n}};`, "React компонент · доор нь export default"],
  ["rafc", `export const \${1:${n}} = () => \\{\n${body}\\};`, "React компонент · export const arrow"],
  ["rafce", `const \${1:${n}} = () => \\{\n${body}\\};\n\nexport default \${1:${n}};`, "React компонент · arrow + export default"],
  ["rfcp", `export default function \${1:${n}}(\\{ \${2:props} \\}) \\{\n${body}\\}`, "React компонент · props задалсан"],
  ["imr", 'import React from "react";', "import React"],
  ["imrs", 'import React, \\{ useState \\} from "react";', "import React, { useState }"],
  ["imrse", 'import React, \\{ useState, useEffect \\} from "react";', "import React, { useState, useEffect }"],
  ["us", "const [${1:state}, ${2:setState}] = useState(${3:initialState});", "useState"],
  ["useState", "const [${1:state}, ${2:setState}] = useState(${3:initialState});", "const [state, setState] = useState()"],
  ["ue", "useEffect(() => \\{\n\t${1}\n\\}, [${2}]);", "useEffect"],
  ["useEffect", "useEffect(() => \\{\n\t${1}\n\\}, [${2}]);", "useEffect(() => {}, [])"],
  ["clg", "console.log(${1:object});", "console.log()"],
  [
    "mapl",
    "\\{${1:items}.map((${2:item}) => (\n\t<li key=\\{${2:item}.id\\}>\\{${2:item}.${3:name}\\}</li>\n))\\}",
    "JSX жагсаалт · .map((item) => <li key>)",
  ],
];

const notCode = new Set(["String", "TemplateString", "LineComment", "BlockComment"]);

/** Тухайн файлын нэрээр компонентын нэрийг бөглөсөн snippet-ийн санал. */
export function reactSnippets(fileName: string): CompletionSource {
  const options = templates(componentName(fileName)).map(([label, template, detail]) =>
    snippetCompletion(template, { label, detail, type: "keyword", boost: 50 }),
  );
  return (ctx) => {
    const word = ctx.matchBefore(/\w+/);
    if (!word || (word.from === word.to && !ctx.explicit)) return null;
    if (notCode.has(syntaxTree(ctx.state).resolveInner(ctx.pos, -1).name)) return null;
    return { from: word.from, options, validFor: /^\w*$/ };
  };
}
