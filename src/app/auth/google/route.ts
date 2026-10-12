import { NextResponse, type NextRequest } from "next/server";
import { googleConfigured, OAUTH_COOKIE, startGoogleLogin } from "@/lib/auth/google";

/** Langkah 1: arahkan ke halaman pilih akun Google. */
export async function GET(req: NextRequest) {
  if (!googleConfigured())
    return NextResponse.redirect(new URL("/login?error=google-belum-dikonfigurasi", req.nextUrl));

  const { url, cookieValue } = await startGoogleLogin(req.nextUrl.origin);
  const res = NextResponse.redirect(url);
  // sameSite=lax wajib: cookie harus ikut terkirim saat Google mengarahkan kembali (navigasi top-level).
  res.cookies.set(OAUTH_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth/google",
    maxAge: 600,
  });
  return res;
}
