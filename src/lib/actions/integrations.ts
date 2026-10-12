"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { assertPermission } from "@/lib/auth/dal";

export type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

export async function updateIntegration(key: string, _prev: FormState, form: FormData): Promise<FormState> {
  await assertPermission("integration", "update");
  const url = String(form.get("url") ?? "").trim();
  const embedUrl = String(form.get("embedUrl") ?? "").trim();
  if (url && !/^https?:\/\//i.test(url)) return { error: "Periksa kembali isian yang ditandai.", fieldErrors: { url: "Harus diawali http:// atau https://" } };
  if (embedUrl && !/^https?:\/\//i.test(embedUrl)) return { error: "Periksa kembali isian yang ditandai.", fieldErrors: { embedUrl: "Harus diawali http:// atau https://" } };

  await db.update(schema.integrations).set({
    url: url || null,
    embedUrl: embedUrl || null,
    enabled: Boolean(url) && form.get("enabled") === "on",
  }).where(eq(schema.integrations.key, key));

  revalidatePath("/", "layout");
  redirect("/admin/integrasi?ok=tersimpan");
}
