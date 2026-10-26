export type CodeLang = "python" | "html" | "css" | "jsx";

export function langOfFile(name: string): CodeLang {
  if (name.endsWith(".py")) return "python";
  if (name.endsWith(".css")) return "css";
  if (name.endsWith(".jsx") || name.endsWith(".js")) return "jsx";
  return "html";
}

const firstFiles = ["index.html", "App.jsx", "main.py"];

/** JSONB түлхүүрийн дарааллыг хадгалдаггүй тул файлуудыг тогтмол дарааллаар харуулна. */
export function sortFiles(names: string[]): string[] {
  const rank = (n: string) => {
    const i = firstFiles.indexOf(n);
    return i >= 0 ? i : n.includes("/") ? 20 : n.endsWith(".css") ? 10 : 5;
  };
  return [...names].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}
