"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { adminPeriodExpired } from "@/lib/auth/access";
import { createSession, deleteSession } from "@/lib/auth/session";

export type LoginState = { error?: string } | undefined;

const schemaLogin = z.object({ email: z.string().trim().toLowerCase().email("Email tidak valid."), password: z.string().min(1, "Password wajib diisi.") });

// Hash tiruan agar waktu respons tidak membocorkan apakah email terdaftar.
const DUMMY = bcrypt.hashSync("tidak-dipakai", 12);

// Pembatas percobaan sederhana (per proses) untuk menekan tebak-password.
const attempts = new Map<string, { n: number; until: number }>();

export async function login(_: LoginState, form: FormData): Promise<LoginState> {
  const parsed = schemaLogin.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password } = parsed.data;

  const rec = attempts.get(email);
  if (rec && rec.until > Date.now() && rec.n >= 5) return { error: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." };

  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY);
  if (!user || !ok || !user.isActive) {
    attempts.set(email, { n: (rec && rec.until > Date.now() ? rec.n : 0) + 1, until: Date.now() + 10 * 60_000 });
    return { error: "Email atau password salah." };
  }
  attempts.delete(email);
  // Password benar, tetapi Admin hanya boleh masuk selama periode aksesnya aktif.
  if (await adminPeriodExpired(user))
    return { error: "Masa akses Admin Anda sudah berakhir karena periode kepengurusannya tidak lagi aktif. Hubungi Super Admin untuk diperpanjang." };
  await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));
  await createSession(user.id);
  redirect("/admin");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
