"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { assertPermission } from "@/lib/auth/dal";

export type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

const VALUE_ROWS = 30;

const str = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const optUrl = z.string().trim().refine((v) => v === "" || /^https?:\/\//i.test(v), "Harus diawali http:// atau https://").transform((v) => v || null);
const optEmail = z.string().trim().refine((v) => v === "" || z.string().email().safeParse(v).success, "Email tidak valid.").transform((v) => v || null);

export async function updateOrganization(_prev: FormState, form: FormData): Promise<FormState> {
  await assertPermission("organization", "update");

  const required = (name: string, label: string) => {
    const v = str(form.get(name));
    return v ? v : `${label} wajib diisi.`;
  };
  const fieldErrors: Record<string, string> = {};
  for (const [name, label] of [["name", "Nama lengkap"], ["shortName", "Nama singkat"], ["tagline", "Tagline"], ["description", "Deskripsi"], ["history", "Sejarah"], ["vision", "Visi"], ["goals", "Tujuan"]] as const) {
    const msg = required(name, label);
    if (msg !== str(form.get(name))) fieldErrors[name] = msg;
  }
  const email = optEmail.safeParse(str(form.get("email")));
  if (!email.success) fieldErrors.email = email.error.issues[0].message;
  const instagramUrl = optUrl.safeParse(str(form.get("instagramUrl")));
  if (!instagramUrl.success) fieldErrors.instagramUrl = instagramUrl.error.issues[0].message;
  const waChannelUrl = optUrl.safeParse(str(form.get("waChannelUrl")));
  if (!waChannelUrl.success) fieldErrors.waChannelUrl = waChannelUrl.error.issues[0].message;
  const website = optUrl.safeParse(str(form.get("website")));
  if (!website.success) fieldErrors.website = website.error.issues[0].message;

  const missions = str(form.get("missions")).split("\n").map((s) => s.trim()).filter(Boolean);
  if (missions.length === 0) fieldErrors.missions = "Isi minimal satu misi (satu baris satu misi).";

  const values: { title: string; description: string }[] = [];
  for (let i = 0; i < VALUE_ROWS; i++) {
    const title = str(form.get(`value_title_${i}`));
    const description = str(form.get(`value_desc_${i}`));
    if (title) values.push({ title, description });
  }
  if (values.length === 0) fieldErrors.value_title_0 = "Isi minimal satu nilai organisasi.";

  if (Object.keys(fieldErrors).length) return { error: "Periksa kembali isian yang ditandai.", fieldErrors };

  await db.update(schema.organization).set({
    name: str(form.get("name")), shortName: str(form.get("shortName")), tagline: str(form.get("tagline")),
    description: str(form.get("description")), history: str(form.get("history")), vision: str(form.get("vision")),
    goals: str(form.get("goals")), missions, values,
    address: str(form.get("address")) || null, email: email.data, phone: str(form.get("phone")) || null,
    whatsapp: str(form.get("whatsapp")) || null, instagramHandle: str(form.get("instagramHandle")) || null,
    instagramUrl: instagramUrl.data, waChannelName: str(form.get("waChannelName")) || null, waChannelUrl: waChannelUrl.data,
    website: website.data,
  }).where(eq(schema.organization.id, "main"));

  revalidatePath("/", "layout");
  redirect("/admin/organisasi?ok=tersimpan");
}
