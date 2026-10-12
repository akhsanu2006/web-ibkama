import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/db";
import { adminPeriodExpired } from "@/lib/auth/access";
import { finishGoogleLogin, googleConfigured, OAUTH_COOKIE } from "@/lib/auth/google";
import { sessionCookie } from "@/lib/auth/session";

/**
 * Langkah 2: Google mengarahkan kembali ke sini membawa `code`.
 * Akses hanya diberikan bila email Google sudah terdaftar & aktif di tabel `users`
 * (didaftarkan Super Admin). Peran (admin/super_admin) diambil dari database, bukan dari Google.
 */
export async function GET(req: NextRequest) {
  const fail = (code: string) => {
    const res = NextResponse.redirect(new URL(`/login?error=${code}`, req.nextUrl));
    res.cookies.delete({ name: OAUTH_COOKIE, path: "/auth/google" });
    return res;
  };

  if (!googleConfigured()) return fail("google-belum-dikonfigurasi");

  const params = req.nextUrl.searchParams;
  if (params.get("error")) return fail("google-batal"); // mis. pengguna menekan "Batal"

  let saved: { state?: string; nonce?: string; verifier?: string } = {};
  try { saved = JSON.parse(req.cookies.get(OAUTH_COOKIE)?.value ?? "{}"); } catch { /* cookie rusak */ }

  const code = params.get("code");
  if (!code || !saved.state || !saved.nonce || !saved.verifier || params.get("state") !== saved.state)
    return fail("google-gagal"); // state tidak cocok/kedaluwarsa → tolak (perlindungan CSRF)

  let email: string;
  try {
    email = await finishGoogleLogin(code, saved.verifier, saved.nonce, req.nextUrl.origin);
  } catch {
    return fail("google-gagal");
  }

  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (!user || !user.isActive) return fail("akun-tidak-terdaftar");
  if (await adminPeriodExpired(user)) return fail("periode-berakhir");

  await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));
  const session = await sessionCookie(user.id);
  const res = NextResponse.redirect(new URL("/admin", req.nextUrl));
  res.cookies.set(session.name, session.value, session.options);
  res.cookies.delete({ name: OAUTH_COOKIE, path: "/auth/google" });
  return res;
}
