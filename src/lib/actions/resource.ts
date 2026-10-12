"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { assertPermission } from "@/lib/auth/dal";
import { saveUpload } from "@/lib/media";
import { bySlug } from "@/lib/resources/registry";
import type { Field } from "@/lib/resources/types";

export type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

// Lapisan generik: tabel dipilih lewat nama, jadi tipe Drizzle dilonggarkan di satu tempat ini.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TABLES = schema as unknown as Record<string, any>;

function friendly(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  if (/UNIQUE/i.test(m)) return "Data dengan nilai yang sama sudah ada (mis. nama/periode ganda).";
  if (/FOREIGN KEY/i.test(m)) return "Data ini masih dipakai oleh data lain, sehingga tidak dapat diubah/dihapus.";
  return m || "Terjadi kesalahan tak terduga.";
}

function zodFor(f: Field): z.ZodType {
  const req = (msg = `${f.label} wajib diisi.`) => z.string().trim().min(1, msg);
  switch (f.type) {
    case "number": return z.string().trim().transform((v) => (v === "" ? null : Number(v))).pipe(z.number().int("Harus bilangan bulat.").min(0, "Tidak boleh negatif.").nullable());
    case "checkbox": return z.any().transform((v) => v === "on");
    case "url": return z.string().trim().refine((v) => v === "" || /^https?:\/\//i.test(v), "Harus diawali http:// atau https://").transform((v) => v || null);
    case "email": return z.string().trim().refine((v) => v === "" || z.string().email().safeParse(v).success, "Email tidak valid.").transform((v) => v || null);
    case "date": return (f.required ? req() : z.string().trim()).refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Tanggal tidak valid.").transform((v) => v || null);
    case "time": return z.string().trim().refine((v) => v === "" || /^\d{2}:\d{2}$/.test(v), "Jam tidak valid.").transform((v) => v || null);
    case "select": {
      const allowed = f.options?.map((o) => o.value);
      const s = f.required ? req() : z.string().trim();
      return s.refine((v) => v === "" || !allowed || allowed.includes(v), "Pilihan tidak valid.").transform((v) => v || null);
    }
    default: return (f.required ? req() : z.string().trim()).transform((v) => v || null);
  }
}

export async function saveResource(slug: string, id: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  const def = bySlug(slug);
  if (!def) return { error: "Modul tidak dikenal." };
  const user = await assertPermission(def.permission, id ? "update" : "create");
  const table = TABLES[def.table];

  // 1) validasi field teks/angka/pilihan
  const shape: Record<string, z.ZodType> = {};
  const raw: Record<string, unknown> = {};
  for (const f of def.fields) {
    if (f.type === "image" || f.type === "file") continue;
    shape[f.name] = zodFor(f);
    raw[f.name] = f.type === "checkbox" ? form.get(f.name) : String(form.get(f.name) ?? "");
  }
  const parsed = z.object(shape).safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "Periksa kembali isian yang ditandai.", fieldErrors };
  }
  const values: Record<string, unknown> = { ...parsed.data };

  // 2) unggahan berkas
  const periodId = (values.periodId as string | null) ?? null;
  try {
    for (const f of def.fields.filter((x) => x.type === "image" || x.type === "file")) {
      const file = form.get(f.name);
      if (file instanceof File && file.size > 0) {
        const internal = def.table === "documents" && values.visibility === "internal";
        values[f.name] = await saveUpload(file, {
          kind: f.type === "image" ? "image" : "document", periodId,
          visibility: internal ? "private" : "public", ownerType: def.table, uploadedBy: user.id,
        });
      } else if (form.get(`remove_${f.name}`) === "on") values[f.name] = null;
      else if (!id && f.required) return { error: "Periksa kembali isian yang ditandai.", fieldErrors: { [f.name]: `${f.label} wajib diunggah.` } };
    }
  } catch (e) { return { error: friendly(e) }; }

  // 3) aturan khusus modul
  if (def.table === "leadershipHistory" && !values.chairName && values.memberId) {
    const [m] = await db.select({ name: schema.members.name }).from(schema.members).where(eq(schema.members.id, values.memberId as string));
    values.chairName = m?.name ?? null;
  }
  if (def.table === "leadershipHistory" && !values.chairName) return { error: "Periksa kembali isian yang ditandai.", fieldErrors: { chairName: "Isi nama, atau pilih dari data anggota." } };
  if (def.table === "archiveCategories" && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(values.slug ?? ""))) return { error: "Periksa kembali isian yang ditandai.", fieldErrors: { slug: "Gunakan huruf kecil, angka, dan tanda hubung." } };
  if (def.table === "events" && values.startTime && values.endTime && (values.endTime as string) < (values.startTime as string)) return { error: "Periksa kembali isian yang ditandai.", fieldErrors: { endTime: "Jam selesai harus setelah jam mulai." } };
  if (def.table === "programs" && values.startDate && values.endDate && (values.endDate as string) < (values.startDate as string)) return { error: "Periksa kembali isian yang ditandai.", fieldErrors: { endDate: "Tanggal selesai harus setelah tanggal mulai." } };

  // 4) simpan
  try {
    if (id) await db.update(table).set(values).where(eq(table.id, id));
    else await db.insert(table).values(values);
  } catch (e) {
    if (def.table === "leadershipHistory" && /UNIQUE/i.test(String(e))) return { error: "Periode ini sudah memiliki Ketua Umum. Ubah data yang ada." };
    return { error: friendly(e) };
  }
  revalidatePath("/", "layout");
  redirect(`/admin/${slug}?ok=${id ? "diperbarui" : "ditambahkan"}`);
}

export async function deleteResource(slug: string, id: string): Promise<FormState> {
  const def = bySlug(slug);
  if (!def) return { error: "Modul tidak dikenal." };
  await assertPermission(def.permission, "delete");
  try {
    await db.delete(TABLES[def.table]).where(eq(TABLES[def.table].id, id));
  } catch (e) { return { error: friendly(e) }; }
  revalidatePath("/", "layout");
  redirect(`/admin/${slug}?ok=dihapus`);
}
