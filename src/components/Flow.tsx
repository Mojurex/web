import type { FlowNode, FlowShape } from "@/lib/types";

export const shapeNames: Record<FlowShape, string> = {
  oval: "Зууван — эхлэл/төгсгөл",
  io: "Параллелограмм — оролт/гаралт",
  process: "Тэгш өнцөгт — үйлдэл",
  decision: "Ромб — нөхцөл",
};

export function FlowShapeBox({ shape, children }: { shape: FlowShape; children: React.ReactNode }) {
  const base = "inline-flex min-h-10 items-center justify-center px-4 py-1.5 text-center text-[0.95rem] border-2";
  switch (shape) {
    case "oval":
      return <span className={`${base} rounded-full border-indigo bg-tint`}>{children}</span>;
    case "io":
      return (
        <span className={`${base} -skew-x-12 border-warn bg-warn-tint`}>
          <span className="skew-x-12">{children}</span>
        </span>
      );
    case "decision":
      return (
        <span
          className={`${base} border-0 bg-good px-8 py-3`}
          style={{ clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)" }}
        >
          <span className="rounded bg-good-tint px-1">{children}</span>
        </span>
      );
    default:
      return <span className={`${base} rounded-sm border-ink bg-surface`}>{children}</span>;
  }
}

/** ```flow блок: (эхлэл), /оролт/, [үйлдэл], <нөхцөл> мөр бүрээр. */
export function parseFlow(source: string): FlowNode[] {
  return source
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l, i) => {
      const inner = l.slice(1, -1).trim();
      const shape: FlowShape =
        l.startsWith("(") ? "oval" : l.startsWith("/") ? "io" : l.startsWith("<") ? "decision" : "process";
      return { id: String(i), shape, text: shape === "process" && !l.startsWith("[") ? l : inner };
    });
}

/** Хэвтээ (нарийн дэлгэцэд нугалагдана) эсвэл босоо блок схем. */
export function FlowDiagram({ nodes, vertical = false }: { nodes: FlowNode[]; vertical?: boolean }) {
  if (nodes.length === 0) return <p className="text-muted">Блок схем хоосон байна.</p>;
  return (
    <div
      className={`my-3 flex ${vertical ? "flex-col items-center" : "flex-wrap items-center"} gap-x-2 gap-y-2`}
      role="list"
      aria-label="Блок схем"
    >
      {nodes.map((n, i) => (
        <div key={n.id} role="listitem" className={`flex ${vertical ? "flex-col" : ""} items-center gap-2`}>
          <FlowShapeBox shape={n.shape}>{n.text || <span className="text-muted">…</span>}</FlowShapeBox>
          {i < nodes.length - 1 && (
            <span aria-hidden className="text-lg text-muted">
              {vertical ? "↓" : "→"}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
