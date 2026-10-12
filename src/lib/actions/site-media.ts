"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { slotByKey } from "@/content/site-media";
import { assertPermission } from "@/lib/auth/dal";
import { deleteMedia, saveUpload, UploadError } from "@/lib/media";

export type SiteMediaState = { ok?: string; error?: string } | undefined;

const after = () => revalidatePath("/", "layout");

/** Ganti foto/video sebuah slot halaman publik. Media pengganti lama ikut dihapus agar penyimpanan tidak menumpuk. */
export async function replaceSiteMedia(key: string, _prev: SiteMediaState, form: FormData): Promise<SiteMediaState> {
  const user = await assertPermission("site_media", "update");
  const slot = slotByKey(key);
  if (!slot) return { error: "Slot media tidak dikenal." };
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: slot.kind === "video" ? "Pilih berkas video terlebih dahulu." : "Pilih berkas foto terlebih dahulu." };

  let mediaId: string;
  try {
    mediaId = await saveUpload(file, { kind: slot.kind, visibility: "public", ownerType: "site_media", ownerId: key, uploadedBy: user.id });
  } catch (e) {
    return { error: e instanceof UploadError ? e.message : "Gagal mengunggah berkas." };
  }
  const [old] = await db.select().from(schema.siteMedia).where(eq(schema.siteMedia.key, key));
  await db.insert(schema.siteMedia).values({ key, mediaId, updatedBy: user.id })
    .onConflictDoUpdate({ target: schema.siteMedia.key, set: { mediaId, updatedBy: user.id, updatedAt: new Date() } });
  if (old) await deleteMedia([old.mediaId]);
  after();
  return { ok: `${slot.kind === "video" ? "Video" : "Foto"} berhasil diganti.` };
}

/** Kembalikan slot ke berkas bawaan (menghapus media pengganti). */
export async function resetSiteMedia(key: string): Promise<SiteMediaState> {
  await assertPermission("site_media", "update");
  const [old] = await db.select().from(schema.siteMedia).where(eq(schema.siteMedia.key, key));
  if (!old) return { ok: "Sudah memakai bawaan." };
  await db.delete(schema.siteMedia).where(eq(schema.siteMedia.key, key));
  await deleteMedia([old.mediaId]);
  after();
  return { ok: "Dikembalikan ke bawaan." };
}
