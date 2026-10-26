"use client";

import { buildReactDocument, buildWebDocument, type PreviewMessage } from "@/lib/preview";
import { useEffect, useRef, useState } from "react";

type LogLine = { level: PreviewMessage["level"]; text: string };

let vendorPromise: Promise<{ react: string; reactDom: string }> | null = null;
function loadVendor() {
  vendorPromise ??= Promise.all([
    fetch("/vendor/react.development.js").then((r) => r.text()),
    fetch("/vendor/react-dom.development.js").then((r) => r.text()),
  ]).then(([react, reactDom]) => ({ react, reactDom }));
  return vendorPromise;
}

/**
 * Тусгаарлагдсан iframe-д сурагчийн хуудсыг харуулна. web горимд бичих бүрт
 * шинэчлэгдэнэ; react горимд «Ажиллуулах» дарахад л хөрвүүлнэ.
 */
export function Preview({
  mode,
  files,
  images,
  runToken,
}: {
  mode: "web" | "react";
  files: Record<string, string>;
  images?: Record<string, string>;
  /** react горимд өөрчлөгдөх бүрт дахин ажиллуулна. */
  runToken?: number;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [doc, setDoc] = useState("");
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [building, setBuilding] = useState(false);
  const filesRef = useRef(files);
  filesRef.current = files;

  useEffect(() => {
    if (mode !== "web") return;
    const t = setTimeout(() => {
      setLogs([]);
      setDoc(buildWebDocument(files, images));
    }, 400);
    return () => clearTimeout(t);
  }, [mode, files, images]);

  useEffect(() => {
    if (mode !== "react" || !runToken) return;
    let cancelled = false;
    setBuilding(true);
    loadVendor()
      .then((vendor) => buildReactDocument(filesRef.current, vendor))
      .then((out) => {
        if (cancelled) return;
        if ("errors" in out) {
          setDoc("");
          setLogs(out.errors.map((text) => ({ level: "error" as const, text })));
        } else {
          setLogs([]);
          setDoc(out.html);
        }
      })
      .finally(() => !cancelled && setBuilding(false));
    return () => {
      cancelled = true;
    };
  }, [mode, runToken]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow) return;
      const m = e.data as PreviewMessage;
      if (m?.__preview) setLogs((prev) => [...prev.slice(-199), { level: m.level, text: m.text }]);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const errorCount = logs.filter((l) => l.level === "error" || l.level === "warn").length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="relative min-h-[26rem] flex-1 overflow-hidden rounded-lg border border-line bg-white">
        {building && <p className="absolute inset-x-0 top-2 text-center text-sm text-muted">Хөрвүүлж байна…</p>}
        {mode === "react" && !runToken && (
          <p className="p-4 text-muted">«▶ Ажиллуулах» дарж үр дүнгээ харна уу.</p>
        )}
        <iframe
          ref={frameRef}
          title="Хуудасны харагдац"
          sandbox="allow-scripts"
          srcDoc={doc}
          className="h-full min-h-[26rem] w-full"
        />
      </div>
      <details className="rounded-lg border border-line bg-surface" open={errorCount > 0}>
        <summary className="cursor-pointer px-3 py-1.5 text-sm font-semibold">
          Console {logs.length > 0 && <span className={errorCount ? "text-bad" : "text-muted"}>({logs.length})</span>}
        </summary>
        <div className="max-h-40 overflow-y-auto border-t border-line px-3 py-2 font-mono text-[0.8rem]">
          {logs.length === 0 ? (
            <span className="text-muted">Алдаа, мэдээлэл алга.</span>
          ) : (
            logs.map((l, i) => (
              <div
                key={i}
                className={`whitespace-pre-wrap ${l.level === "error" ? "text-bad" : l.level === "warn" ? "text-warn" : ""}`}
              >
                {l.text}
              </div>
            ))
          )}
        </div>
      </details>
    </div>
  );
}
