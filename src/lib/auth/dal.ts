import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { can, type Action, type Resource } from "@/lib/permissions";
import { adminPeriodExpired } from "./access";
import { readSession } from "./session";

type SessionState = { user: SessionUser | null; reason?: "periode-berakhir" | "akses-dicabut" | "sesi-berakhir" };

/** Status sesi: pengguna aktif, atau alasan ditolak. Selalu dicek ulang ke DB (peran/periode bisa berubah). */
const loadSession = cache(async (): Promise<SessionState> => {
  const session = await readSession();
  if (!session || session.expiresAt < Date.now()) return { user: null };
  const [user] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      adminPosition: schema.users.adminPosition,
      permissions: schema.users.permissions,
      isActive: schema.users.isActive,
      periodId: schema.users.periodId,
      sessionVersion: schema.users.sessionVersion,
    })
    .from(schema.users)
    .where(eq(schema.users.id, session.userId));
  if (!user || !user.isActive) return { user: null, reason: "akses-dicabut" };
  // Token dibatalkan (logout / ganti password menaikkan versi). Token lama tanpa `v` = versi 0:
  // hanya berlaku selama akun belum pernah menaikkan versinya, jadi tidak membuka celah baru.
  if ((session.v ?? 0) !== user.sessionVersion) return { user: null, reason: "sesi-berakhir" };
  if (await adminPeriodExpired(user)) return { user: null, reason: "periode-berakhir" };
  return { user };
});

type SessionUser = {
  id: string; name: string; email: string; role: "admin" | "super_admin"; adminPosition: string | null;
  permissions: string[] | null; isActive: boolean; periodId: string | null; sessionVersion: number;
};

/** Status sesi lengkap (dipakai /auth/keluar untuk membedakan sesi sah vs usang). */
export const getSessionState = loadSession;

/** Pengguna aktif dari sesi, atau null. */
export const getCurrentUser = cache(async () => (await loadSession()).user);

export type CurrentUser = SessionUser;

/** Wajib login, jika tidak → /login (cookie usang dibersihkan dulu agar tidak memantul). */
export async function requireUser(): Promise<CurrentUser> {
  const { user, reason } = await loadSession();
  if (!user) redirect(reason ? `/auth/keluar?alasan=${reason}` : "/login");
  return user;
}

/** Untuk halaman: redirect ke /admin jika tak berhak. */
export async function requirePagePermission(resource: Resource, action: Action = "read") {
  const user = await requireUser();
  if (!can(user.role, resource, action, user.permissions)) redirect("/admin?akses=ditolak");
  return user;
}

/** Untuk Server Action: lempar error jika tak berhak (tidak pernah mengandalkan UI). */
export async function assertPermission(resource: Resource, action: Action) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sesi berakhir. Silakan login kembali.");
  if (!can(user.role, resource, action, user.permissions))
    throw new Error("Anda tidak memiliki izin untuk tindakan ini.");
  return user;
}
