import { readFileSync } from "fs";
import { join } from "path";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
await sql.unsafe(readFileSync(join(import.meta.dirname, "../db/schema.sql"), "utf8"));
console.log("Схем бэлэн боллоо.");
await sql.end();
