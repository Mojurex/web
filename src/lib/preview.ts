// Сурагчийн HTML/CSS болон React кодыг iframe srcdoc болгон угсарна.
// iframe нь sandbox="allow-scripts" (тусгаарлагдсан origin) тул эцэг хуудсанд хүрэхгүй;
// console болон алдааг postMessage-ээр эцэг рүү дамжуулна.

export type PreviewMessage = { __preview: true; level: "log" | "info" | "warn" | "error"; text: string };

const bridge = `<script>(function(){
function fmt(a){if(a instanceof Error)return a.name+": "+a.message;if(a&&typeof a==="object"){try{return JSON.stringify(a)}catch(e){return String(a)}}return String(a)}
function join(args){if(typeof args[0]==="string"&&args[0].indexOf("%")>=0){var rest=args.slice(1);var s=args[0].replace(/%[sdoOifc]/g,function(m){return m==="%c"?(rest.shift(),""):fmt(rest.shift())});return [s].concat(rest.map(fmt)).join(" ")}return args.map(fmt).join(" ")}
function send(level,args){try{parent.postMessage({__preview:true,level:level,text:join(args)},"*")}catch(e){}}
["log","info","warn","error"].forEach(function(l){var o=console[l];console[l]=function(){var a=Array.prototype.slice.call(arguments);send(l,a);o.apply(console,a)}});
addEventListener("error",function(e){send("error",[e.error||e.message])});
addEventListener("unhandledrejection",function(e){send("error",[e.reason])});
document.addEventListener("click",function(e){var a=e.target&&e.target.closest&&e.target.closest("a[href]");if(a){e.preventDefault();send("info",["Холбоос: "+a.getAttribute("href")+(a.getAttribute("target")==="_blank"?" (шинэ табд нээгдэнэ)":"")])}},true);
document.addEventListener("submit",function(e){e.preventDefault();send("info",["Форм илгээгдлээ"])},true);
})();</script>`;

/** Багшийн өгдөг зургийг (sport.jpg гэх мэт) emoji бүхий SVG-ээр орлуулна. */
export function imageDataUrl(name: string, emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320"><rect width="480" height="320" fill="#eceafb"/><text x="240" y="150" font-size="140" text-anchor="middle" dominant-baseline="central">${emoji}</text><text x="240" y="285" font-size="22" fill="#6b6889" text-anchor="middle" font-family="sans-serif">${name}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function replaceImages(text: string, images: Record<string, string>): string {
  let out = text;
  for (const [name, emoji] of Object.entries(images)) {
    const re = new RegExp(`(["'(=])(?:\\./)?${escapeRe(name)}(["')\\s>])`, "g");
    out = out.replace(re, `$1${imageDataUrl(name, emoji)}$2`);
  }
  return out;
}

function insertAfterDoctype(html: string, snippet: string): string {
  const m = html.match(/^\s*<!doctype[^>]*>/i);
  return m ? m[0] + snippet + html.slice(m[0].length) : snippet + html;
}

/** index.html + бусад CSS файлууд + зургууд → нэг баримт. */
export function buildWebDocument(files: Record<string, string>, images: Record<string, string> = {}): string {
  const htmlName = files["index.html"] !== undefined ? "index.html" : Object.keys(files).find((f) => f.endsWith(".html"));
  let html = htmlName ? files[htmlName] : "";
  // <link rel="stylesheet" href="style.css"> → тухайн файлын агуулгатай <style>.
  html = html.replace(/<link\b[^>]*>/gi, (tag) => {
    const href = tag.match(/href\s*=\s*["']?([^"'\s>]+)/i)?.[1]?.replace(/^\.\//, "");
    if (!href || !/stylesheet/i.test(tag) || files[href] === undefined) return tag;
    return `<style data-file="${href}">\n${files[href]}\n</style>`;
  });
  return insertAfterDoctype(replaceImages(html, images), bridge);
}

export type ReactBuild = { html: string } | { errors: string[] };

const scriptSafe = (code: string) => code.replace(/<\/script/gi, "<\\/script");

/**
 * Олон файлтай React төслийг sucrase-ээр хөрвүүлж, жижиг CommonJS ачаалагчтай
 * баримт болгоно. React 18 development build-ийг (ойлгомжтой алдаа, анхааруулга) шууд оруулна.
 */
export async function buildReactDocument(
  files: Record<string, string>,
  vendor: { react: string; reactDom: string },
): Promise<ReactBuild> {
  const { transform } = await import("sucrase");
  const modules: string[] = [];
  const styles: Record<string, string> = {};
  const errors: string[] = [];
  for (const [path, source] of Object.entries(files)) {
    if (path.endsWith(".css")) {
      styles[path] = source;
      continue;
    }
    if (!/\.(jsx?|tsx?)$/.test(path)) continue;
    try {
      const { code } = transform(source, {
        transforms: ["jsx", "imports"],
        jsxRuntime: "classic",
        production: false,
        filePath: path,
      });
      modules.push(`${JSON.stringify(path)}: function (require, module, exports) {\n${code}\n}`);
    } catch (e) {
      errors.push(`${path}: ${(e as Error).message}`);
    }
  }
  if (errors.length) return { errors };

  const loader = `
var __modules = {${modules.join(",\n")}};
var __styles = ${JSON.stringify(styles)};
var __cache = {};
function __resolve(from, spec) {
  var parts = from.split("/").slice(0, -1);
  spec.split("/").forEach(function (p) { if (p === "..") parts.pop(); else if (p !== "." && p) parts.push(p); });
  var base = parts.join("/");
  var tries = [base, base + ".jsx", base + ".js", base + "/index.jsx", base + "/index.js"];
  for (var i = 0; i < tries.length; i++) if (__modules[tries[i]] || __styles[tries[i]] !== undefined) return tries[i];
  throw new Error(from + ": '" + spec + "' файл олдсонгүй");
}
function __load(path) {
  if (__cache[path]) return __cache[path].exports;
  var module = { exports: {} };
  __cache[path] = module;
  __modules[path](function (spec) {
    if (spec === "react") return React;
    if (spec === "react-dom" || spec === "react-dom/client") return ReactDOM;
    var p = __resolve(path, spec);
    if (__styles[p] !== undefined) {
      var s = document.createElement("style"); s.setAttribute("data-file", p); s.textContent = __styles[p];
      document.head.appendChild(s); return {};
    }
    return __load(p);
  }, module, module.exports);
  return module.exports;
}
(function () {
  if (!__modules["App.jsx"]) { console.error("App.jsx файл олдсонгүй"); return; }
  var App = __load("App.jsx").default;
  if (typeof App !== "function") { console.error("App.jsx-д 'export default' компонент алга"); return; }
  ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
})();`;

  const html = `<!doctype html><html><head><meta charset="utf-8">${bridge}
<style>body{font-family:system-ui,sans-serif;margin:16px}</style>
<script>${scriptSafe(vendor.react)}</script>
<script>${scriptSafe(vendor.reactDom)}</script>
</head><body><div id="root"></div><script>${scriptSafe(loader)}</script></body></html>`;
  return { html };
}
