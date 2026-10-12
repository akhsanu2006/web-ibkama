import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

/**
 * Menghapus cookie sesi yang sudah tidak berlaku (akun dicopot/dinonaktifkan atau periode akses berakhir)
 * lalu ke /login. Tanpa ini, proxy akan memantulkan /login ↔ /admin karena cookie-nya masih sah secara kriptografis.
 */
const REASONS = new Set(["periode-berakhir", "akses-dicabut"]);

export function GET(req: NextRequest) {
  const reason = req.nextUrl.searchParams.get("alasan");
  const target = new URL("/login", req.nextUrl);
  if (reason && REASONS.has(reason)) target.searchParams.set("error", reason);
  const res = NextResponse.redirect(target);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
