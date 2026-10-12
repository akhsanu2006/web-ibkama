import "server-only";
import { inArray, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { db, schema } from "@/db";

/**
 * Pembatas percobaan gagal berbasis tabel `auth_attempts` (tetap berlaku setelah server restart).
 * Setiap aturan: maks `limit` kegagalan dalam `windowMs`; bila tercapai, kunci selama `lockMs`.
 */
export type Rule = { key: string; limit: number; windowMs: number; lockMs: number };

const MIN = 60_000;

/**
 * Aturan login berlapis agar pengguna sah tidak mudah dikunci orang lain:
 *  - pair  (email+IP) 5×/15 mnt  → penyerang hanya mengunci dirinya sendiri untuk email itu
 *  - ip    20×/15 mnt            → satu IP yang mencoba banyak email
 *  - email 30×/15 mnt (semua IP) → rem darurat serangan dari banyak IP (login Google tetap bisa dipakai)
 */
export function loginRules(email: string, ip: string): Rule[] {
  return [
    { key: `login-pair:${email}|${ip}`, limit: 5, windowMs: 15 * MIN, lockMs: 15 * MIN },
    { key: `login-ip:${ip}`, limit: 20, windowMs: 15 * MIN, lockMs: 15 * MIN },
    { key: `login-email:${email}`, limit: 30, windowMs: 15 * MIN, lockMs: 15 * MIN },
  ];
}

/** Verifikasi password lama di halaman "Akun saya": 5×/15 mnt per akun. */
export function passwordChangeRules(userId: string): Rule[] {
  return [{ key: `pw-change:${userId}`, limit: 5, windowMs: 15 * MIN, lockMs: 15 * MIN }];
}

/**
 * IP klien. Header proxy (x-forwarded-for / x-real-ip) HANYA dapat dipercaya bila server berada di belakang
 * reverse proxy yang menimpanya (nginx/Hostinger). Tanpa proxy, nilainya bisa dipalsukan — aturan per email tetap berlaku.
 */
export async function clientIp() {
  const h = await headers();
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (fwd || h.get("x-real-ip")?.trim() || "unknown").slice(0, 64);
}

/** true bila salah satu aturan sedang terkunci. */
export async function isLocked(rules: Rule[]) {
  if (!rules.length) return false;
  const now = Date.now();
  const rows = await db.select().from(schema.authAttempts).where(inArray(schema.authAttempts.key, rules.map((r) => r.key)));
  return rows.some((r) => r.lockedUntil !== null && r.lockedUntil > now);
}

/** Catat satu kegagalan untuk setiap aturan. */
export async function recordFailure(rules: Rule[]) {
  const now = Date.now();
  await db.transaction(async (tx) => {
    for (const rule of rules) {
      const [row] = await tx.select().from(schema.authAttempts).where(inArray(schema.authAttempts.key, [rule.key]));
      const fresh = !row || now - row.windowStart > rule.windowMs || (row.lockedUntil !== null && row.lockedUntil <= now);
      const count = fresh ? 1 : row.count + 1;
      const values = {
        count,
        windowStart: fresh ? now : row.windowStart,
        lockedUntil: count >= rule.limit ? now + rule.lockMs : null,
      };
      await tx.insert(schema.authAttempts).values({ key: rule.key, ...values })
        .onConflictDoUpdate({ target: schema.authAttempts.key, set: values });
    }
  });
  // bersihkan catatan lama (>1 hari) agar tabel tidak membengkak
  await db.delete(schema.authAttempts).where(lt(schema.authAttempts.windowStart, now - 24 * 60 * MIN));
}

/** Hapus hitungan (mis. setelah login berhasil). */
export async function clearAttempts(keys: string[]) {
  if (keys.length) await db.delete(schema.authAttempts).where(inArray(schema.authAttempts.key, keys));
}
