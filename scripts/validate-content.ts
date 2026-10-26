import { grades } from "../src/content";
import { validateGrade } from "../src/content/validate";

let failed = false;
for (const g of grades) {
  const errors = validateGrade(g);
  const a = g.variants.A;
  const counts = `А: ${a.sectionA.length} асуулт, Б: ${a.sectionB.map((t) => t.n).join(" ")}`;
  if (errors.length) {
    failed = true;
    console.log(`✗ ${g.grade}-р анги`);
    for (const e of errors) console.log(`   ${e}`);
  } else {
    console.log(`✓ ${g.grade}-р анги (${g.topic}) — ${counts}`);
  }
}
process.exit(failed ? 1 : 0);
