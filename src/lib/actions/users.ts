"use server";

import bcrypt from "bcryptjs";
import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { getActivePeriodId } from "@/lib/auth/access";
import { assertPermission } from "@/lib/auth/dal";
import { PASSWORD_TOO_LONG, passwordTooLong } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { ADMIN_POSITIONS } from "@/lib/permissions";

export type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

const positionValues: string[] = ADMIN_POSITIONS.map((p) => p.value);

const base = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi."),
  role: z.enum(["admin", "super_admin"]),
  adminPosition: z.string().trim().transform((v) => (v && positionValues.includes(v) ? v : null)),
  isActive: z.any().transform((v) => v === "on"),
});

async function otherActiveSuperAdmins(excludeId: string) {
  const [row] = await db.select({ n: sql<number>`count(*)` }).from(schema.users)
    .where(and(eq(schema.users.role, "super_admin"), eq(schema.users.isActive, true), ne(schema.users.id, excludeId)));
  return Number(row?.n ?? 0);
}

const NO_ACTIVE_PERIOD = "Belum ada periode berstatus aktif. Aktifkan periode di menu Kelola Periode terlebih dahulu — akses Admin selalu terikat pada periode aktif.";

function friendly(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  if (/UNIQUE/i.test(m)) return "Email ini sudah terdaftar.";
  return m || "Terjadi kesalahan tak terduga.";
}

export async function createUser(_prev: FormState, form: FormData): Promise<FormState> {
  await assertPermission("user", "create");
  const parsed = base
    .extend({
      email: z.string().trim().toLowerCase().email("Email tidak valid."),
      // Kosong = akun hanya bisa masuk dengan Google (email harus sama dengan akun Google-nya).
      password: z.string()
        .refine((v) => v === "" || v.length >= 8, "Password minimal 8 karakter, atau kosongkan untuk login Google saja.")
        .refine((v) => !passwordTooLong(v), PASSWORD_TOO_LONG),
    })
    .safeParse({
      name: form.get("name"), role: form.get("role"), adminPosition: String(form.get("adminPosition") ?? ""),
      isActive: form.get("isActive"), email: form.get("email"), password: form.get("password"),
    });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "Periksa kembali isian yang ditandai.", fieldErrors };
  }
  const { password, ...rest } = parsed.data;
  // Admin terikat ke periode aktif; aksesnya berakhir otomatis saat periode berganti.
  const periodId = rest.role === "admin" ? await getActivePeriodId() : null;
  if (rest.role === "admin" && !periodId) return { error: NO_ACTIVE_PERIOD };
  // Tanpa password: simpan hash dari nilai acak yang tak pernah diketahui siapa pun → login password mustahil.
  const secret = password || Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64");
  try {
    await db.insert(schema.users).values({ ...rest, periodId, passwordHash: await bcrypt.hash(secret, 12) });
  } catch (e) {
    return { error: friendly(e), fieldErrors: /UNIQUE/i.test(String(e)) ? { email: "Email ini sudah terdaftar." } : undefined };
  }
  revalidatePath("/admin/pengguna");
  redirect("/admin/pengguna?ok=ditambahkan");
}

export async function updateUser(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const actor = await assertPermission("user", "update");
  const parsed = base.safeParse({
    name: form.get("name"), role: form.get("role"), adminPosition: String(form.get("adminPosition") ?? ""), isActive: form.get("isActive"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "Periksa kembali isian yang ditandai.", fieldErrors };
  }
  const newPassword = String(form.get("newPassword") ?? "");
  if (newPassword && newPassword.length < 8) return { error: "Periksa kembali isian yang ditandai.", fieldErrors: { newPassword: "Password minimal 8 karakter." } };
  if (newPassword && passwordTooLong(newPassword)) return { error: "Periksa kembali isian yang ditandai.", fieldErrors: { newPassword: PASSWORD_TOO_LONG } };

  const [target] = await db.select().from(schema.users).where(eq(schema.users.id, id));
  if (!target) return { error: "Pengguna tidak ditemukan." };
  // Jangan biarkan Super Admin terakhir kehilangan perannya atau dinonaktifkan.
  if ((parsed.data.role !== "super_admin" || !parsed.data.isActive) && target.role === "super_admin" && (await otherActiveSuperAdmins(id)) === 0)
    return { error: "Tidak dapat menonaktifkan atau menurunkan peran Super Admin terakhir." };
  // Super Admin yang diturunkan menjadi Admin (atau Admin tanpa periode) diikat ke periode aktif.
  let periodPatch: { periodId: string } | Record<string, never> = {};
  if (parsed.data.role === "admin" && (target.role === "super_admin" || !target.periodId)) {
    const active = await getActivePeriodId();
    if (!active) return { error: NO_ACTIVE_PERIOD };
    periodPatch = { periodId: active };
  }
  if (actor.id === id && (parsed.data.role !== "super_admin" || !parsed.data.isActive))
    return { error: "Anda tidak dapat menurunkan peran atau menonaktifkan akun Anda sendiri." };

  try {
    await db.update(schema.users).set({
      ...parsed.data,
      ...periodPatch,
      // password diganti → semua sesi akun itu dibatalkan (versi sesi naik)
      ...(newPassword ? { passwordHash: await bcrypt.hash(newPassword, 12), sessionVersion: sql`${schema.users.sessionVersion} + 1` } : {}),
    }).where(eq(schema.users.id, id));
    // Super Admin mengganti password akunnya sendiri dari halaman ini → perangkat ini tetap masuk dengan token baru
    if (newPassword && actor.id === id) {
      const [me] = await db.select({ v: schema.users.sessionVersion }).from(schema.users).where(eq(schema.users.id, id));
      await createSession(id, me.v);
    }
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath("/admin/pengguna");
  redirect("/admin/pengguna?ok=diperbarui");
}

export async function deleteUser(id: string): Promise<FormState> {
  const actor = await assertPermission("user", "delete");
  if (actor.id === id) return { error: "Anda tidak dapat menghapus akun Anda sendiri." };
  const [target] = await db.select().from(schema.users).where(eq(schema.users.id, id));
  if (target?.role === "super_admin" && (await otherActiveSuperAdmins(id)) === 0)
    return { error: "Tidak dapat menghapus Super Admin terakhir." };
  try {
    await db.delete(schema.users).where(eq(schema.users.id, id));
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath("/admin/pengguna");
  redirect("/admin/pengguna?ok=dihapus");
}

/** Copot akses: akun dinonaktifkan (tidak dihapus) sehingga tak bisa login; sesi yang sedang berjalan ikut berakhir. */
export async function revokeAccess(id: string): Promise<void> {
  const actor = await assertPermission("user", "update");
  if (actor.id === id) redirect("/admin/pengguna?gagal=diri-sendiri");
  const [target] = await db.select().from(schema.users).where(eq(schema.users.id, id));
  if (target?.role === "super_admin" && (await otherActiveSuperAdmins(id)) === 0) redirect("/admin/pengguna?gagal=super-terakhir");
  await db.update(schema.users).set({ isActive: false }).where(eq(schema.users.id, id));
  revalidatePath("/admin/pengguna");
  redirect("/admin/pengguna?ok=dicopot");
}

/** Aktifkan kembali / perpanjang: akun aktif lagi dan (untuk Admin) dipindah ke periode yang sedang aktif. */
export async function restoreAccess(id: string): Promise<void> {
  await assertPermission("user", "update");
  const [target] = await db.select().from(schema.users).where(eq(schema.users.id, id));
  if (!target) redirect("/admin/pengguna");
  let periodId = target.periodId;
  if (target.role === "admin") {
    periodId = await getActivePeriodId();
    if (!periodId) redirect("/admin/pengguna?gagal=tanpa-periode");
  }
  await db.update(schema.users).set({ isActive: true, periodId }).where(eq(schema.users.id, id));
  revalidatePath("/admin/pengguna");
  redirect("/admin/pengguna?ok=diaktifkan");
}
