import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const TEACHER_COOKIE = "teacher";
const ATTEMPT_COOKIE = "attempt";
const TEACHER_TTL_S = 60 * 60 * 12;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET (32+ тэмдэгт) тохируулаагүй байна");
  return s;
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export async function setTeacherSession(teacherId: string) {
  const payload = Buffer.from(JSON.stringify({ tid: teacherId, exp: Date.now() + TEACHER_TTL_S * 1000 })).toString(
    "base64url",
  );
  (await cookies()).set(TEACHER_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TEACHER_TTL_S,
  });
}

export async function clearTeacherSession() {
  (await cookies()).delete(TEACHER_COOKIE);
}

export async function readTeacherId(): Promise<string | null> {
  const raw = (await cookies()).get(TEACHER_COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  const { tid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
  return typeof tid === "string" && exp > Date.now() ? tid : null;
}

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Сурагчийн оролдлогын шинэ token үүсгээд cookie-д хадгална. DB-д hash-ийг нь бичнэ. */
export async function issueAttemptCookie(attemptId: string): Promise<string> {
  const token = randomBytes(24).toString("base64url");
  (await cookies()).set(ATTEMPT_COOKIE, `${attemptId}.${token}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 6,
  });
  return hashToken(token);
}

export async function readAttemptCookie(): Promise<{ attemptId: string; tokenHash: string } | null> {
  const raw = (await cookies()).get(ATTEMPT_COOKIE)?.value;
  const [attemptId, token] = raw?.split(".") ?? [];
  if (!attemptId || !token) return null;
  return { attemptId, tokenHash: hashToken(token) };
}

export async function clearAttemptCookie() {
  (await cookies()).delete(ATTEMPT_COOKIE);
}
