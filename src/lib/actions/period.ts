"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { assertPermission } from "@/lib/auth/dal";
import { isUniqueViolation, logDbError } from "@/lib/db-errors";
import { defaultDivisions } from "@/db/seed-data";

export type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

const nameRe = /^\d{4}\/\d{4}$/;

const schemaPeriod = z
  .object({
    name: z.string().trim().regex(nameRe, "Gunakan format tahun/tahun, mis. 2027/2028."),
    description: z.string().trim().transform((v) => v || null),
  })
  .transform((v) => {
    const [startYear, endYear] = v.name.split("/").map(Number);
    return { ...v, startYear, endYear };
  })
  .refine((v) => v.endYear === v.startYear + 1, { message: "Tahun kedua harus tahun setelah tahun pertama (mis. 2027/2028).", path: ["name"] });

function friendly(e: unknown) {
  if (isUniqueViolation(e)) return "Periode dengan nama ini sudah ada.";
  logDbError("period", e);
  return "Terjadi kesalahan tak terduga. Silakan coba lagi.";
}

export async function createPeriod(_prev: FormState, form: FormData): Promise<FormState> {
  await assertPermission("period", "create");
  const parsed = schemaPeriod.safeParse({ name: String(form.get("name") ?? ""), description: String(form.get("description") ?? "") });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0] ?? "name")] ??= i.message;
    return { error: "Periksa kembali isian yang ditandai.", fieldErrors };
  }
  try {
    // Periode baru langsung berisi divisi bawaan, agar form Anggota & Pengurus siap dipakai.
    await db.transaction(async (tx) => {
      const [p] = await tx.insert(schema.periods).values({ ...parsed.data, status: "draft" }).returning({ id: schema.periods.id });
      await tx.insert(schema.divisions).values(defaultDivisions.map((d) => ({ ...d, periodId: p.id })));
    });
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath("/admin/periode");
  redirect("/admin/periode?ok=ditambahkan");
}

export async function updatePeriod(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  await assertPermission("period", "update");
  const parsed = schemaPeriod.safeParse({ name: String(form.get("name") ?? ""), description: String(form.get("description") ?? "") });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0] ?? "name")] ??= i.message;
    return { error: "Periksa kembali isian yang ditandai.", fieldErrors };
  }
  try {
    await db.update(schema.periods).set(parsed.data).where(eq(schema.periods.id, id));
  } catch (e) {
    return { error: friendly(e) };
  }
  revalidatePath("/", "layout");
  redirect("/admin/periode?ok=diperbarui");
}

/**
 * Mengaktifkan satu periode; periode yang sebelumnya aktif otomatis menjadi arsip.
 * Data lama tidak pernah dihapus. Dipakai langsung sebagai `<form action>`, jadi tanpa nilai balik.
 */
export async function setActivePeriod(id: string): Promise<void> {
  await assertPermission("period", "update");
  await db.transaction(async (tx) => {
    const current = await tx.select().from(schema.periods).where(eq(schema.periods.status, "active"));
    for (const p of current) if (p.id !== id) await tx.update(schema.periods).set({ status: "archived" }).where(eq(schema.periods.id, p.id));
    await tx.update(schema.periods).set({ status: "active" }).where(eq(schema.periods.id, id));
  });
  revalidatePath("/", "layout");
  redirect("/admin/periode?ok=diperbarui");
}

export async function archivePeriod(id: string): Promise<void> {
  await assertPermission("period", "update");
  await db.update(schema.periods).set({ status: "archived" }).where(eq(schema.periods.id, id));
  revalidatePath("/", "layout");
  redirect("/admin/periode?ok=diperbarui");
}
