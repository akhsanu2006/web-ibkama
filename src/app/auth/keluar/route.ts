import { NextResponse, type NextRequest } from "next/server";
import { getSessionState } from "@/lib/auth/dal";
import { SESSION_COOKIE } from "@/lib/auth/session";

/**
 * Menghapus cookie sesi yang SUDAH tidak berlaku (akun dicopot, periode berakhir, atau sesi dibatalkan)
 * lalu ke /login. Tanpa ini, proxy akan memantulkan /login ↔ /admin karena cookie-nya masih sah secara kriptografis.
 * Sesi yang masih sah TIDAK dihapus di sini (cukup kembali ke /admin), sehingga situs lain tidak bisa
 * memaksa logout lewat tautan GET. Logout sungguhan = Server Action `logout` (POST).
 */
const REASONS = new Set(["periode-berakhir", "akses-dicabut", "sesi-berakhir"]);

export async function GET(req: NextRequest) {
  const { user } = await getSessionState();
  if (user) return NextResponse.redirect(new URL("/admin", req.nextUrl));

  const reason = req.nextUrl.searchParams.get("alasan");
  const target = new URL("/login", req.nextUrl);
  if (reason && REASONS.has(reason)) target.searchParams.set("error", reason);
  const res = NextResponse.redirect(target);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
