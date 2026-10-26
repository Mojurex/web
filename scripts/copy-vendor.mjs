// Pyodide-г public/ руу хуулна: бүх зүйл өөрийн домэйноос ачаалагдана
// (COEP require-corp дор гадны CDN ашиглахгүй). React 18 UMD (development) нь public/vendor-д байна.
import { cpSync, mkdirSync } from "node:fs";

const files = [
  ["node_modules/pyodide/pyodide.mjs", "public/pyodide/pyodide.mjs"],
  ["node_modules/pyodide/pyodide.asm.mjs", "public/pyodide/pyodide.asm.mjs"],
  ["node_modules/pyodide/pyodide.asm.wasm", "public/pyodide/pyodide.asm.wasm"],
  ["node_modules/pyodide/python_stdlib.zip", "public/pyodide/python_stdlib.zip"],
  ["node_modules/pyodide/pyodide-lock.json", "public/pyodide/pyodide-lock.json"],
];
mkdirSync("public/pyodide", { recursive: true });
for (const [from, to] of files) cpSync(from, to);
