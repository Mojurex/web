import { describe, expect, it } from "vitest";
import { buildReactDocument, buildWebDocument, imageDataUrl } from "./preview";

describe("buildWebDocument", () => {
  it("style.css холбоосыг агуулгаар нь солино", () => {
    const html = buildWebDocument({
      "index.html": '<!DOCTYPE html><html><head><link rel="stylesheet" href="style.css"></head><body></body></html>',
      "style.css": "h1 { color: navy; }",
    });
    expect(html).toContain('<style data-file="style.css">');
    expect(html).toContain("h1 { color: navy; }");
    expect(html).not.toContain("<link");
  });

  it("байхгүй файл руу заасан link-ийг хэвээр үлдээнэ", () => {
    const html = buildWebDocument({ "index.html": '<link rel="stylesheet" href="styles.css">', "style.css": "" });
    expect(html).toContain('<link rel="stylesheet" href="styles.css">');
  });

  it("DOCTYPE эхэндээ үлдэнэ (quirks mode-оос сэргийлнэ)", () => {
    const html = buildWebDocument({ "index.html": "<!DOCTYPE html><html><body>Сайн уу</body></html>" });
    expect(html.startsWith("<!DOCTYPE html><script>")).toBe(true);
  });

  it("зургийн нэрийг data URL-аар солино", () => {
    const html = buildWebDocument(
      { "index.html": '<img src="sport.jpg" alt="x"><div style="background:url(./sport.jpg)"></div>' },
      { "sport.jpg": "⚽" },
    );
    expect(html).not.toMatch(/["(]\.?\/?sport\.jpg/);
    expect(html.split(imageDataUrl("sport.jpg", "⚽")).length).toBe(3);
  });
});

describe("buildReactDocument", () => {
  const vendor = { react: "/*react*/", reactDom: "/*react-dom*/" };

  it("JSX-ийг хөрвүүлж модулиудыг нэгтгэнэ", async () => {
    const out = await buildReactDocument(
      {
        "App.jsx": 'import Header from "./components/Header";\nexport default function App() { return <Header title="Сайн" />; }',
        "components/Header.jsx": "export default function Header({ title }) { return <h1>{title}</h1>; }",
        "styles.css": "h1 { color: red; }",
      },
      vendor,
    );
    expect("html" in out).toBe(true);
    if (!("html" in out)) return;
    expect(out.html).toContain('"components/Header.jsx": function');
    expect(out.html).toContain("React.createElement");
    expect(out.html).not.toContain("<Header");
  });

  it("синтакс алдааг файлын нэртэй буцаана", async () => {
    const out = await buildReactDocument({ "App.jsx": "export default function App() { return <h1>; }" }, vendor);
    expect(out).toEqual({ errors: [expect.stringContaining("App.jsx:")] });
  });

  it("</script> агуулсан кодыг тасалдуулахгүй", async () => {
    const out = await buildReactDocument(
      { "App.jsx": 'export default function App() { return <p>{"</script>"}</p>; }' },
      vendor,
    );
    if (!("html" in out)) throw new Error("expected html");
    expect(out.html.match(/<\/script>/g)?.length).toBe(4);
  });
});
