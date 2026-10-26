"use client";

import type { FlowNode, FlowShape } from "@/lib/types";
import { FlowDiagram, shapeNames } from "./Flow";

const shapes: FlowShape[] = ["oval", "io", "process", "decision"];
const shapeLabel: Record<FlowShape, string> = { oval: "( )", io: "/ /", process: "[ ]", decision: "◇" };

let counter = 0;
const newId = () => `${Date.now().toString(36)}${(counter++).toString(36)}`;

/**
 * Шугаман блок схем зурагч: алхам бүр дүрс + бичвэртэй, сум нь дээрээс доош
 * автоматаар холбогдоно. Шалгалтын бүх блок схем шугаман тул салаалалт хэрэггүй.
 */
export function FlowchartEditor({ nodes, onChange }: { nodes: FlowNode[]; onChange: (n: FlowNode[]) => void }) {
  const update = (i: number, patch: Partial<FlowNode>) =>
    onChange(nodes.map((n, j) => (j === i ? { ...n, ...patch } : n)));
  const insert = (at: number) => onChange([...nodes.slice(0, at), { id: newId(), shape: "process", text: "" }, ...nodes.slice(at)]);
  const remove = (i: number) => onChange(nodes.filter((_, j) => j !== i));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= nodes.length) return;
    const next = [...nodes];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(10rem,auto)]">
      <div className="flex flex-col gap-2">
        {nodes.length === 0 && <p className="py-2 text-muted">Блок схем хоосон байна. Эхний алхмаа нэмнэ үү.</p>}
        <ol className="flex flex-col gap-2">
          {nodes.map((n, i) => (
            <li key={n.id} className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-surface p-2">
              <span className="w-5 text-right text-sm font-semibold text-muted">{i + 1}</span>
              <div className="flex gap-1" role="radiogroup" aria-label={`${i + 1}-р алхмын дүрс`}>
                {shapes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={n.shape === s}
                    title={shapeNames[s]}
                    onClick={() => update(i, { shape: s })}
                    className={`h-9 w-9 rounded-md border font-mono text-sm ${
                      n.shape === s ? "border-indigo bg-indigo text-white" : "border-line bg-paper hover:border-indigo"
                    }`}
                  >
                    {shapeLabel[s]}
                  </button>
                ))}
              </div>
              <input
                className="field min-w-28 flex-1"
                value={n.text}
                placeholder="Алхмын бичвэр, жишээ нь: a, b оруулах"
                aria-label={`${i + 1}-р алхмын бичвэр`}
                onChange={(e) => update(i, { text: e.target.value })}
              />
              <div className="flex gap-1">
                <button type="button" className="btn btn-ghost h-9 w-8 p-0" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Дээш зөөх">
                  ↑
                </button>
                <button
                  type="button"
                  className="btn btn-ghost h-9 w-8 p-0"
                  onClick={() => move(i, 1)}
                  disabled={i === nodes.length - 1}
                  aria-label="Доош зөөх"
                >
                  ↓
                </button>
                <button type="button" className="btn btn-ghost h-9 w-8 p-0 text-bad" onClick={() => remove(i)} aria-label="Устгах">
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ol>
        <button type="button" className="btn btn-ghost self-start" onClick={() => insert(nodes.length)}>
          + Алхам нэмэх
        </button>
        <p className="text-sm text-muted">
          ( ) эхлэл, төгсгөл · / / оролт, гаралт · [ ] үйлдэл · ◇ нөхцөл
        </p>
      </div>
      <div className="rounded-lg bg-paper p-3" aria-label="Блок схемийн харагдац">
        <FlowDiagram nodes={nodes} vertical />
      </div>
    </div>
  );
}
