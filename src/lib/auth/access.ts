import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

/**
 * Admin hanya boleh masuk selama periode aksesnya berstatus `active`.
 * Super Admin tidak dibatasi periode (ia yang mengelola periode & akun).
 * Dipakai di setiap pintu masuk: login password, callback Google, dan pemeriksaan sesi (DAL).
 */
export async function adminPeriodExpired(user: { role: string; periodId: string | null }) {
  if (user.role === "super_admin") return false;
  if (!user.periodId) return true;
  const [p] = await db.select({ status: schema.periods.status }).from(schema.periods).where(eq(schema.periods.id, user.periodId));
  return p?.status !== "active";
}

export async function getActivePeriodId() {
  const [p] = await db.select({ id: schema.periods.id }).from(schema.periods).where(eq(schema.periods.status, "active"));
  return p?.id ?? null;
}
