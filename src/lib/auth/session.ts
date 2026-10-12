import "server-only";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

const COOKIE = "ibkama_session";
const DURATION_MS = 1000 * 60 * 60 * 8; // 8 jam

/**
 * `v` = users.sessionVersion saat token dibuat. Token dari sebelum fitur ini (tanpa `v`) dianggap versi 0;
 * begitu versi akun naik (logout / ganti password), token itu ikut ditolak — lihat dal.ts.
 */
export type SessionPayload = { userId: string; expiresAt: number; v?: number };

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("SESSION_SECRET belum diset (minimal 32 karakter).");
  return new TextEncoder().encode(secret);
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(new Date(payload.expiresAt))
    .sign(key());
}

export async function decrypt(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Cookie sesi siap pasang — dipakai Server Action (via cookies()) maupun Route Handler (via response.cookies). */
export async function sessionCookie(userId: string, version: number) {
  const expiresAt = Date.now() + DURATION_MS;
  return {
    name: COOKIE,
    value: await encrypt({ userId, expiresAt, v: version }),
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      expires: new Date(expiresAt),
      path: "/",
    },
  };
}

export async function createSession(userId: string, version: number) {
  const c = await sessionCookie(userId, version);
  (await cookies()).set(c.name, c.value, c.options);
}

export async function readSession() {
  return decrypt((await cookies()).get(COOKIE)?.value);
}

export async function deleteSession() {
  (await cookies()).delete(COOKIE);
}

export const SESSION_COOKIE = COOKIE;
