import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { inArray } from "drizzle-orm";
import { db, schema } from "@/db";

export const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR ?? "./storage/uploads");

const IMAGE_MIME: Record<string, string> = {
  "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif",
};
const DOC_MIME: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "text/plain": ".txt",
};
const VIDEO_MIME: Record<string, string> = { "video/mp4": ".mp4", "video/webm": ".webm" };
const MAX_IMAGE = 8 * 1024 * 1024;
export const MAX_VIDEO = 50 * 1024 * 1024;
const MAX_DOC = 25 * 1024 * 1024;

export type UploadMeta = {
  kind: "image" | "document" | "video";
  periodId?: string | null;
  visibility?: "public" | "private";
  ownerType?: string;
  ownerId?: string;
  uploadedBy?: string;
};

/** Simpan file + catat metadata. Tipe & ukuran divalidasi di server. */
export async function saveUpload(file: File, meta: UploadMeta) {
  const table = meta.kind === "image" ? IMAGE_MIME : meta.kind === "video" ? VIDEO_MIME : DOC_MIME;
  const ext = table[file.type];
  if (!ext) throw new Error(
    meta.kind === "image" ? "Format gambar harus JPG, PNG, WebP, atau GIF."
    : meta.kind === "video" ? "Format video harus MP4 atau WebM."
    : "Format dokumen tidak didukung (PDF, Word, Excel, PowerPoint, teks).");
  const max = meta.kind === "image" ? MAX_IMAGE : meta.kind === "video" ? MAX_VIDEO : MAX_DOC;
  if (file.size > max) throw new Error(`Ukuran file terlalu besar (maks ${max / 1024 / 1024} MB).`);

  const id = crypto.randomUUID();
  const rel = path.posix.join(new Date().getFullYear().toString(), `${id}${ext}`);
  const abs = path.join(STORAGE_DIR, rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, Buffer.from(await file.arrayBuffer()));

  await db.insert(schema.media).values({
    id, kind: meta.kind, path: rel, originalName: file.name.slice(0, 200), mime: file.type, size: file.size,
    periodId: meta.periodId ?? null, visibility: meta.visibility ?? "public",
    ownerType: meta.ownerType, ownerId: meta.ownerId, uploadedBy: meta.uploadedBy,
  });
  return id;
}

/** Ubah data URL gambar (dari kanvas tanda tangan / kamera) menjadi File; null bila kosong/tidak valid. */
export function dataUrlToFile(dataUrl: string, name: string, maxBytes = 4 * 1024 * 1024): File | null {
  // tolak lebih dulu berdasarkan panjang string (base64 ≈ 4/3 ukuran asli) sebelum regex & dekode
  if (!dataUrl || dataUrl.length > Math.ceil((maxBytes * 4) / 3) + 64) return null;
  const m = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl.trim());
  if (!m) return null;
  const buf = Buffer.from(m[2], "base64");
  if (!buf.length || buf.length > maxBytes) return null;
  return new File([buf], `${name}${m[1] === "image/png" ? ".png" : ".jpg"}`, { type: m[1] });
}

/** Hapus media (baris + berkas di disk). Berkas yang sudah hilang diabaikan. */
export async function deleteMedia(ids: (string | null | undefined)[]) {
  const list = ids.filter((x): x is string => !!x);
  if (!list.length) return;
  const rows = await db.select({ id: schema.media.id, path: schema.media.path }).from(schema.media).where(inArray(schema.media.id, list));
  await db.delete(schema.media).where(inArray(schema.media.id, list));
  await Promise.all(rows.map((r) => {
    const abs = path.resolve(STORAGE_DIR, r.path);
    return abs.startsWith(STORAGE_DIR + path.sep) ? unlink(abs).catch(() => {}) : Promise.resolve();
  }));
}
