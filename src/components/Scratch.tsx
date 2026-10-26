// Scratch скриптийг Scratch-ийн ангиллын өнгөөр дүрсэлнэ. Мөр бүр нэг блок;
// "а) " гэх мэт угтвар нь блокийн гадна шошго болно.

const categories: [RegExp, string][] = [
  [/^when\b/i, "#e6a700"],
  [/^(switch|next) (backdrop|costume)|^say\b|^think\b|^show\b|^hide\b/i, "#8a5cf5"],
  [/^(forever|wait|repeat|if|stop)\b/i, "#e8890c"],
  [/^(move|go to|glide|change [xy]|set [xy]|turn|point)\b/i, "#3f7fe0"],
];

function colorOf(block: string): string {
  return categories.find(([re]) => re.test(block))?.[1] ?? "#3f7fe0";
}

export function ScratchScript({ source }: { source: string }) {
  const lines = source.split("\n").filter((l) => l.trim());
  return (
    <div className="my-3 flex flex-col gap-[3px]" role="list" aria-label="Scratch скрипт">
      {lines.map((line, i) => {
        const m = line.match(/^\s*([а-яёөү]\))\s*(.*)$/i);
        const [label, block] = m ? [m[1], m[2]] : [null, line.trim()];
        const hat = /^when\b/i.test(block);
        return (
          <div key={i} role="listitem" className="flex items-center gap-3">
            {label && <span className="w-6 text-right font-semibold text-muted">{label}</span>}
            <span
              className="inline-block px-3 py-1.5 font-mono text-[0.85rem] font-semibold text-white"
              style={{
                background: colorOf(block),
                borderRadius: hat ? "1rem 1rem 0.35rem 0.35rem" : "0.35rem",
                minWidth: "11rem",
              }}
            >
              {block}
            </span>
          </div>
        );
      })}
    </div>
  );
}
