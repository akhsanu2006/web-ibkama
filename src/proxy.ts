import { NextResponse, type NextRequest } from "next/server";
import { decrypt, SESSION_COOKIE } from "@/lib/auth/session";

/**
 * Batas ukuran body untuk Server Action PUBLIK (tanpa login). Next hanya punya SATU `bodySizeLimit` global (60 MB,
 * dibutuhkan unggahan video di dashboard), sehingga /login dan /hadir ikut menerima body sebesar itu dari siapa pun.
 * Di sini permintaan yang MENYATAKAN Content-Length melebihi batas ditolak lebih awal (413), sebelum body dibaca.
 * Catatan: body chunked tanpa Content-Length tetap hanya dibatasi 60 MB oleh Next — batas sebenarnya dipasang di
 * reverse proxy (lihat docs/hosting-batas-request.md).
 *  - /hadir/*: foto (maks 1,5 MB) + tanda tangan (maks 1,5 MB) sebagai data URL base64 ≈ 4 MB → batas 5 MB
 *  - /login  : hanya email + password → 64 KB
 */
const BODY_LIMITS: Array<[RegExp, number]> = [
  [/^\/hadir\//, 5 * 1024 * 1024],
  [/^\/login$/, 64 * 1024],
];

// Pemeriksaan OPTIMISTIS saja (redirect cepat). Otorisasi sebenarnya di lib/auth/dal.ts.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (req.method === "POST") {
    const limit = BODY_LIMITS.find(([re]) => re.test(pathname))?.[1];
    const declared = Number(req.headers.get("content-length") ?? "0");
    if (limit && declared > limit)
      return new NextResponse("Permintaan terlalu besar.", { status: 413, headers: { "Cache-Control": "no-store" } });
  }

  const session = await decrypt(req.cookies.get(SESSION_COOKIE)?.value);
  const valid = session && session.expiresAt > Date.now();

  if (pathname.startsWith("/admin") && !valid)
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  if (pathname === "/login" && valid)
    return NextResponse.redirect(new URL("/admin", req.nextUrl));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/login", "/hadir/:path*"] };
