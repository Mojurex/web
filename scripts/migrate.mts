import { readFileSync } from "fs";
import { join } from "path";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
const read = (f: string) => readFileSync(join(import.meta.dirname, "../db", f), "utf8");

await sql.unsafe(read("schema.sql"));
console.log("Схем бэлэн боллоо.");

const [rt] = await sql`
  select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'realtime' and p.proname = 'send'`;
if (rt) {
  await sql.unsafe(read("realtime.sql"));
  console.log("Supabase Realtime trigger бэлэн боллоо.");
} else {
  console.log("realtime.send алга (Supabase биш) — Realtime алгасав.");
}
await sql.end();
