import { NextResponse, type NextRequest } from "next/server";
import { decrypt, SESSION_COOKIE } from "@/lib/auth/session";

/**
 * Batas ukuran body untuk Server Action di luar dashboard (tanpa login). Next hanya punya SATU `bodySizeLimit`
 * global (60 MB, dibutuhkan unggahan video di dashboard), dan sebuah Server Action dapat dikirim ke PATH MANA PUN
 * yang merender halaman — bukan hanya halaman pemiliknya. Karena itu batas dipasang pada SEMUA POST selain /admin,
 * bukan per-halaman. Permintaan yang MENYATAKAN Content-Length melebihi batas ditolak lebih awal (413).
 *  - /hadir/*   : foto + tanda tangan (maks 1,5 MB + 1,5 MB sebagai data URL base64 ≈ 4 MB) → 5 MB
 *  - selain itu : /login (email + password) dan lainnya → 64 KB
 * Tidak berlaku untuk /admin/* (terautentikasi; unggahan video 50 MB).
 * Catatan: body chunked tanpa Content-Length tetap hanya dibatasi 60 MB oleh Next — batas sebenarnya harus
 * dipasang di reverse proxy (lihat docs/hosting-batas-request.md).
 */
const HADIR_LIMIT = 5 * 1024 * 1024;
const PUBLIC_POST_LIMIT = 64 * 1024;

// Pemeriksaan OPTIMISTIS saja (redirect cepat). Otorisasi sebenarnya di lib/auth/dal.ts.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (req.method === "POST" && !isAdmin) {
    const limit = pathname.startsWith("/hadir/") ? HADIR_LIMIT : PUBLIC_POST_LIMIT;
    const declared = Number(req.headers.get("content-length") ?? "0");
    if (declared > limit)
      return new NextResponse("Permintaan terlalu besar.", { status: 413, headers: { "Cache-Control": "no-store" } });
  }

  if (isAdmin || pathname === "/login") {
    const session = await decrypt(req.cookies.get(SESSION_COOKIE)?.value);
    const valid = session && session.expiresAt > Date.now();
    if (isAdmin && !valid) return NextResponse.redirect(new URL("/login", req.nextUrl));
    if (pathname === "/login" && valid) return NextResponse.redirect(new URL("/admin", req.nextUrl));
  }
  return NextResponse.next();
}

// Semua rute kecuali aset statis Next dan penyaji media (GET saja; POST ke /media → 405).
export const config = { matcher: ["/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|brand/|media/).*)"] };
