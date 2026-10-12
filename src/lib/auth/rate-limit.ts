import "server-only";
import { inArray, lt, sql } from "drizzle-orm";
import { cookies, headers } from "next/headers";
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

// ------------------------------------------------------------------ presensi publik (kuota per kiriman)
/**
 * Kuota presensi publik — SETIAP kiriman dihitung (bukan hanya yang gagal). Jendela tetap 10 menit.
 * Cookie perangkat hanya lapisan tambahan (mudah dihapus); batas IP & program tetap berlaku tanpa cookie.
 */
export function checkInRules(programId: string, deviceId: string, ip: string): Rule[] {
  const w = 10 * MIN;
  return [
    { key: `hadir-device:${programId}|${deviceId}`, limit: 3, windowMs: w, lockMs: w },
    { key: `hadir-ip-program:${programId}|${ip}`, limit: 150, windowMs: w, lockMs: w },
    { key: `hadir-ip:${ip}`, limit: 200, windowMs: w, lockMs: w },
    { key: `hadir-program:${programId}`, limit: 300, windowMs: w, lockMs: w },
  ];
}

const DEVICE_COOKIE = "ibkama_perangkat";

/** ID perangkat acak (cookie httpOnly 30 hari). BUKAN bukti identitas — hanya membedakan perangkat untuk kuota. */
export async function deviceId() {
  const jar = await cookies();
  const cur = jar.get(DEVICE_COOKIE)?.value;
  if (cur && /^[A-Za-z0-9_-]{22}$/.test(cur)) return cur;
  const id = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64url");
  jar.set(DEVICE_COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return id;
}

/**
 * Ambil satu jatah dari SETIAP aturan secara atomik. Tiap penambahan adalah satu pernyataan SQL
 * (UPSERT bersyarat) sehingga dua permintaan bersamaan tidak bisa sama-sama lolos melewati batas.
 * Bila satu aturan penuh, jatah yang sudah diambil dari aturan sebelumnya dikembalikan (semua-atau-tidak),
 * dan kiriman yang ditolak TIDAK menambah hitungan.
 */
export async function consumeQuota(rules: Rule[]): Promise<boolean> {
  const now = Date.now();
  const taken: string[] = [];
  for (const r of rules) {
    const res = await db.run(sql`
      INSERT INTO auth_attempts (key, count, window_start, locked_until) VALUES (${r.key}, 1, ${now}, NULL)
      ON CONFLICT(key) DO UPDATE SET
        count = CASE WHEN window_start <= ${now - r.windowMs} THEN 1 ELSE count + 1 END,
        window_start = CASE WHEN window_start <= ${now - r.windowMs} THEN ${now} ELSE window_start END
      WHERE window_start <= ${now - r.windowMs} OR count < ${r.limit}`);
    if (res.rowsAffected === 0) {
      for (const k of taken) await db.run(sql`UPDATE auth_attempts SET count = count - 1 WHERE key = ${k} AND count > 0`);
      return false;
    }
    taken.push(r.key);
  }
  return true;
}
