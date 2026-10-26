// Сурагчийн Python кодыг ажиллуулах worker. input() нь SharedArrayBuffer дээр
// Atomics.wait-ээр үндсэн thread-ээс мөр хүлээнэ.
import { loadPyodide } from "/pyodide/pyodide.mjs";

const decoder = new TextDecoder();
let pyodide;
let ready;
let ctrl; // [0] = төлөв (0 хүлээж байна, 1 бэлэн), [1] = байтын урт (-1 = зогсоох)
let data;

const send = (stream) => ({
  isatty: true,
  write(bytes) {
    postMessage({ type: "out", stream, text: decoder.decode(bytes) });
    return bytes.length;
  },
});

function readLine() {
  Atomics.store(ctrl, 0, 0);
  postMessage({ type: "input" });
  Atomics.wait(ctrl, 0, 0);
  const len = Atomics.load(ctrl, 1);
  if (len < 0) return null;
  return decoder.decode(data.slice(0, len));
}

/** Pyodide-ийн дотоод мөрүүдийг хасаж, сурагчийн кодын traceback-ийг үлдээнэ. */
function cleanTraceback(message) {
  const lines = message.split("\n");
  const start = lines.findIndex((l) => l.includes('File "main.py"'));
  if (start < 0) return lines.filter((l) => !l.includes("/lib/python") && !l.includes("_pyodide")).join("\n");
  return ["Traceback (most recent call last):", ...lines.slice(start)].join("\n");
}

onmessage = async ({ data: msg }) => {
  if (msg.type === "init") {
    ctrl = new Int32Array(msg.sab, 0, 2);
    data = new Uint8Array(msg.sab, 8);
    ready = loadPyodide({ indexURL: "/pyodide/" }).then((py) => {
      pyodide = py;
      py.setStdout(send("stdout"));
      py.setStderr(send("stderr"));
      // isatty: false үед input()-ийн prompt stdout-оор гарна.
      py.setStdin({ stdin: readLine, isatty: false });
      py.setInterruptBuffer(new Uint8Array(msg.interrupt));
      postMessage({ type: "ready" });
    });
    ready.catch((e) => postMessage({ type: "fatal", text: String(e) }));
    return;
  }
  if (msg.type === "run") {
    await ready;
    const globals = pyodide.globals.get("dict")();
    try {
      pyodide.runPython(msg.code, { globals, filename: "main.py" });
      pyodide.runPython("import sys; sys.stdout.flush(); sys.stderr.flush()");
      postMessage({ type: "done", ok: true });
    } catch (e) {
      pyodide.runPython("import sys; sys.stdout.flush()");
      const text = e?.type === "KeyboardInterrupt" ? "Програмыг зогсоолоо." : cleanTraceback(String(e.message ?? e));
      postMessage({ type: "out", stream: "stderr", text: text.endsWith("\n") ? text : `${text}\n` });
      postMessage({ type: "done", ok: false });
    } finally {
      globals.destroy();
    }
  }
};
