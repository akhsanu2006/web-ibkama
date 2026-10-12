import { NextResponse, type NextRequest } from "next/server";
import { decrypt, SESSION_COOKIE } from "@/lib/auth/session";

// Pemeriksaan OPTIMISTIS saja (redirect cepat). Otorisasi sebenarnya di lib/auth/dal.ts.
export async function proxy(req: NextRequest) {
  const session = await decrypt(req.cookies.get(SESSION_COOKIE)?.value);
  const valid = session && session.expiresAt > Date.now();
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && !valid)
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  if (pathname === "/login" && valid)
    return NextResponse.redirect(new URL("/admin", req.nextUrl));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/login"] };
