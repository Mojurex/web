import postgres from "postgres";

declare global {
  var __sql: postgres.Sql | undefined;
}

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL тохируулаагүй байна (.env.local)");
  return postgres(url, {
    max: Number(process.env.DB_POOL_MAX ?? 5),
    // Supabase-ийн transaction pooler (6543) prepared statement дэмждэггүй.
    prepare: false,
    types: { numeric: { to: 1700, from: [1700], serialize: String, parse: Number } },
  });
}

/** Dev горимд hot reload бүрт шинэ pool үүсгэхгүйн тулд global-д хадгална. */
function instance(): postgres.Sql {
  return (globalThis.__sql ??= connect());
}

/** Анх query хийх үед л холбогдоно (build үед DATABASE_URL шаардахгүй). */
export const sql = new Proxy(function () {} as unknown as postgres.Sql, {
  apply: (_target, _this, args) => Reflect.apply(instance() as never, undefined, args),
  get: (_target, prop) => Reflect.get(instance(), prop),
});
