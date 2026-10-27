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
    // Serverless instance унтах үед удаан хэвтсэн холболт ихэвчлэн тасардаг.
    idle_timeout: 20,
    connect_timeout: 10,
    types: { numeric: { to: 1700, from: [1700], serialize: String, parse: Number } },
  });
}

/** Dev горимд hot reload бүрт шинэ pool үүсгэхгүйн тулд global-д хадгална. */
function instance(): postgres.Sql {
  return (globalThis.__sql ??= connect());
}

export class DbTimeoutError extends Error {
  constructor() {
    super("Өгөгдлийн сан хариу өгсөнгүй");
  }
}

/**
 * Pooler-ийн холболт хааяа хариугүй гацдаг (query илгээгдсэн ч хариу ирэхгүй).
 * Тэгвэл хүсэлт Vercel-ийн хязгаар (300 с) хүртэл хүлээхгүйн тулд алдаа шидэж,
 * гацсан pool-ыг хаяна; дараагийн query шинэ холболт нээнэ.
 */
export async function withDbTimeout<T>(fn: () => Promise<T>, ms = 10_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const stuck = globalThis.__sql;
      globalThis.__sql = undefined;
      void stuck?.end({ timeout: 0 }).catch(() => {});
      reject(new DbTimeoutError());
    }, ms);
  });
  try {
    return await Promise.race([fn(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Анх query хийх үед л холбогдоно (build үед DATABASE_URL шаардахгүй). */
export const sql = new Proxy(function () {} as unknown as postgres.Sql, {
  apply: (_target, _this, args) => Reflect.apply(instance() as never, undefined, args),
  get: (_target, prop) => Reflect.get(instance(), prop),
});
