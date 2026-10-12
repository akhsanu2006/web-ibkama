import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth/dal";
import { STORAGE_DIR } from "@/lib/media";

// Penyaji file: media privat/dokumen internal hanya untuk yang login.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [m] = await db.select().from(schema.media).where(eq(schema.media.id, id));
  if (!m) return new Response("Tidak ditemukan", { status: 404 });

  let allowed = m.visibility === "public";
  if (allowed) {
    // Dokumen bervisibilitas "internal" tidak boleh bocor lewat media publik.
    const [doc] = await db.select({ v: schema.documents.visibility }).from(schema.documents).where(eq(schema.documents.mediaId, id)).limit(1);
    if (doc && doc.v === "internal") allowed = false;
  }
  if (!allowed && !(await getCurrentUser())) return new Response("Tidak ditemukan", { status: 404 });

  const abs = path.resolve(STORAGE_DIR, m.path);
  if (!abs.startsWith(STORAGE_DIR + path.sep)) return new Response("Tidak valid", { status: 400 });
  let size: number;
  try { size = (await stat(abs)).size; } catch { return new Response("File hilang", { status: 404 }); }

  const headers: Record<string, string> = {
    "Content-Type": m.mime,
    "Content-Disposition": `${m.kind === "document" ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(m.originalName)}`,
    // URL media unik per unggahan (id baru tiap ganti), jadi aman di-cache lama bila publik
    "Cache-Control": m.visibility === "public" && m.kind !== "document" ? "public, max-age=86400" : "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  };
  const body = (start: number, end: number) =>
    req.method === "HEAD" ? null : (Readable.toWeb(createReadStream(abs, { start, end })) as ReadableStream);

  // Range request: wajib untuk video (Safari/iOS menolak memutar tanpa ini; scrub sinematik melompat-lompat posisi).
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (range && size > 0) {
    let start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    let end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (!range[1] && !range[2]) { start = 0; end = size - 1; }
    if (start >= size || start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    return new Response(body(start, end), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(size ? body(0, size - 1) : null, { headers: { ...headers, "Content-Length": String(size) } });
}

/** HEAD dipakai sinematik untuk mengecek video tersedia sebelum memuatnya. */
export const HEAD = GET;
