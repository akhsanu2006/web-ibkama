"use server";

import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { adminPeriodExpired } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/dal";
import { clearAttempts, clientIp, isLocked, loginRules, recordFailure } from "@/lib/auth/rate-limit";
import { createSession, deleteSession } from "@/lib/auth/session";

export type LoginState = { error?: string } | undefined;

const schemaLogin = z.object({ email: z.string().trim().toLowerCase().email("Email tidak valid."), password: z.string().min(1, "Password wajib diisi.").max(1000, "Password terlalu panjang.") });

// Hash tiruan agar waktu respons tidak membocorkan apakah email terdaftar.
const DUMMY = bcrypt.hashSync("tidak-dipakai", 12);

// Satu pesan untuk SEMUA kegagalan (email tak terdaftar, password salah, akun dicopot, periode berakhir)
// agar tidak membocorkan keberadaan akun atau bahwa password-nya benar.
const GAGAL = "Login gagal. Periksa email dan password Anda. Jika akses Anda sudah berakhir, hubungi Super Admin.";
const TERKUNCI = "Terlalu banyak percobaan. Coba lagi dalam 15 menit.";

export async function login(_: LoginState, form: FormData): Promise<LoginState> {
  const parsed = schemaLogin.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password } = parsed.data;

  const rules = loginRules(email, await clientIp());
  if (await isLocked(rules)) return { error: TERKUNCI };

  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY);
  if (!user || !ok || !user.isActive || (await adminPeriodExpired(user))) {
    await recordFailure(rules);
    return { error: GAGAL };
  }
  // berhasil: reset hitungan email ini (pasangan email+IP & total email); hitungan IP dibiarkan meluruh sendiri
  await clearAttempts([rules[0].key, rules[2].key]);
  await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));
  await createSession(user.id, user.sessionVersion);
  redirect("/admin");
}

/**
 * Logout = batalkan SEMUA sesi akun ini (semua perangkat): versi sesi dinaikkan sehingga token lama ditolak,
 * lalu cookie di perangkat ini dihapus. Hanya sesi yang sah yang bisa menaikkan versi.
 */
export async function logout() {
  const user = await getCurrentUser();
  if (user) await db.update(schema.users).set({ sessionVersion: sql`${schema.users.sessionVersion} + 1` }).where(eq(schema.users.id, user.id));
  await deleteSession();
  redirect("/");
}
