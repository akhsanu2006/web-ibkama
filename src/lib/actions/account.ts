"use server";

import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/dal";
import { clearAttempts, isLocked, passwordChangeRules, recordFailure } from "@/lib/auth/rate-limit";
import { PASSWORD_TOO_LONG, passwordTooLong } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

export type AccountState = { ok?: string; error?: string; fieldErrors?: Record<string, string> } | undefined;

const schemaChange = z.object({
  currentPassword: z.string().min(1, "Isi password saat ini."),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter.").refine((v) => !passwordTooLong(v), PASSWORD_TOO_LONG),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { path: ["confirmPassword"], message: "Konfirmasi tidak sama dengan password baru." })
  .refine((d) => d.newPassword !== d.currentPassword, { path: ["newPassword"], message: "Password baru harus berbeda dari password saat ini." });

/**
 * Ganti password akun sendiri (semua peran yang login). Wajib verifikasi password saat ini.
 * Berhasil → versi sesi naik: sesi di perangkat LAIN ditolak, perangkat ini mendapat token baru.
 */
export async function changeOwnPassword(_prev: AccountState, form: FormData): Promise<AccountState> {
  const me = await getCurrentUser();
  if (!me) return { error: "Sesi berakhir. Silakan login kembali." };

  const parsed = schemaChange.safeParse({
    currentPassword: String(form.get("currentPassword") ?? ""),
    newPassword: String(form.get("newPassword") ?? ""),
    confirmPassword: String(form.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "Periksa kembali isian yang ditandai.", fieldErrors };
  }

  const rules = passwordChangeRules(me.id);
  if (await isLocked(rules)) return { error: "Terlalu banyak percobaan password salah. Coba lagi dalam 15 menit." };

  const [row] = await db.select({ hash: schema.users.passwordHash }).from(schema.users).where(eq(schema.users.id, me.id));
  if (!row || !(await bcrypt.compare(parsed.data.currentPassword, row.hash))) {
    await recordFailure(rules);
    return { error: "Periksa kembali isian yang ditandai.", fieldErrors: { currentPassword: "Password saat ini salah." } };
  }
  await clearAttempts(rules.map((r) => r.key));

  await db.update(schema.users).set({
    passwordHash: await bcrypt.hash(parsed.data.newPassword, 12),
    sessionVersion: sql`${schema.users.sessionVersion} + 1`,
  }).where(eq(schema.users.id, me.id));
  const [after] = await db.select({ v: schema.users.sessionVersion }).from(schema.users).where(eq(schema.users.id, me.id));
  await createSession(me.id, after.v); // perangkat ini tetap masuk dengan token versi baru
  return { ok: "Password berhasil diganti. Sesi di perangkat lain telah dikeluarkan." };
}
