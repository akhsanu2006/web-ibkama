import "server-only";
import { and, asc, desc, eq, like, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { periodSlug } from "@/lib/period";
import type { LookupKey, ResourceDef } from "@/lib/resources/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TABLES = schema as unknown as Record<string, any>;

/** `periodId` + `short` ada pada opsi milik periode tertentu, agar form bisa menyaring per periode terpilih. */
export type Option = { value: string; label: string; periodId?: string; short?: string };

/** Opsi dropdown untuk semua relasi (dipakai form & tampilan tabel). */
export async function getLookups(): Promise<Record<LookupKey, Option[]>> {
  const periods = await db.select().from(schema.periods).orderBy(desc(schema.periods.startYear));
  const pn = new Map(periods.map((p) => [p.id, p.name]));
  const [divisions, positions, members, categories, programs] = await Promise.all([
    db.select().from(schema.divisions).orderBy(asc(schema.divisions.name)),
    db.select().from(schema.positions).orderBy(asc(schema.positions.sortOrder)),
    db.select({ id: schema.members.id, name: schema.members.name, periodId: schema.members.periodId }).from(schema.members).orderBy(asc(schema.members.name)),
    db.select().from(schema.archiveCategories).orderBy(asc(schema.archiveCategories.sortOrder)),
    db.select({ id: schema.programs.id, name: schema.programs.name, periodId: schema.programs.periodId }).from(schema.programs).orderBy(asc(schema.programs.name)),
  ]);
  const scoped = (id: string, name: string, pid: string) => ({ value: id, label: `${name} (${pn.get(pid) ?? "?"})`, periodId: pid, short: name });
  return {
    period: periods.map((p) => ({ value: p.id, label: p.status === "active" ? `${p.name} — aktif` : p.name })),
    division: [...divisions].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)).map((d) => scoped(d.id, d.name, d.periodId)),
    position: positions.map((p) => ({ value: p.id, label: p.name })),
    member: members.map((m) => scoped(m.id, m.name, m.periodId)),
    category: categories.map((c) => ({ value: c.id, label: c.name })),
    program: programs.map((p) => scoped(p.id, p.name, p.periodId)),
  };
}

/** Periode terpilih di dashboard: ?periode=<id> | "semua" | (default: aktif → terbaru). */
export async function adminPeriod(param?: string) {
  const all = await db.select().from(schema.periods).orderBy(desc(schema.periods.startYear));
  if (param === "semua") return { all, current: null as (typeof all)[number] | null, showAll: true };
  const current = all.find((p) => p.id === param) ?? all.find((p) => p.status === "active") ?? all[0] ?? null;
  return { all, current, showAll: false };
}

export async function listRows(def: ResourceDef, opts: { periodId?: string | null; q?: string }) {
  const t = TABLES[def.table];
  const conds = [];
  if (def.periodScoped && opts.periodId) conds.push(eq(t.periodId, opts.periodId));
  if (opts.q && def.searchColumn) conds.push(like(t[def.searchColumn], `%${opts.q.replace(/[%_]/g, "")}%`));
  const order = def.orderBy ? (def.orderBy.dir === "asc" ? asc(t[def.orderBy.column]) : desc(t[def.orderBy.column])) : undefined;
  const q = db.select().from(t).where(conds.length ? and(...conds) : undefined);
  return (order ? await q.orderBy(order) : await q) as Record<string, unknown>[];
}

export async function getRecord(def: ResourceDef, id: string) {
  const t = TABLES[def.table];
  const [row] = await db.select().from(t).where(eq(t.id, id));
  return (row as Record<string, unknown> | undefined) ?? null;
}

export { periodSlug };

// ---------------------------------------------------------------- ringkasan
export async function adminOverview() {
  const periods = await db.select().from(schema.periods).orderBy(desc(schema.periods.startYear));
  const active = periods.find((p) => p.status === "active") ?? null;
  const [[members], [programs], [pendingAttendance]] = await Promise.all([
    active ? db.select({ n: sql<number>`count(*)` }).from(schema.members).where(and(eq(schema.members.periodId, active.id), eq(schema.members.status, "active"))) : [{ n: 0 }],
    active ? db.select({ n: sql<number>`count(*)` }).from(schema.programs).where(and(eq(schema.programs.periodId, active.id), sql`${schema.programs.status} in ('planned','ongoing')`)) : [{ n: 0 }],
    active ? db.select({ n: sql<number>`count(*)` }).from(schema.programs).where(and(eq(schema.programs.periodId, active.id), eq(schema.programs.attendanceOpen, true),
      sql`(${schema.programs.attendanceClosesAt} is null or ${schema.programs.attendanceClosesAt} > ${Date.now()})`)) : [{ n: 0 }],
  ]);
  return {
    periodCount: periods.length,
    active,
    memberCount: Number(members?.n ?? 0),
    programCount: Number(programs?.n ?? 0),
    openAttendanceCount: Number(pendingAttendance?.n ?? 0),
  };
}

// --------------------------------------------------------------- pengguna
export async function listUsers() {
  return db.select({
    id: schema.users.id, name: schema.users.name, email: schema.users.email, role: schema.users.role,
    adminPosition: schema.users.adminPosition, isActive: schema.users.isActive, lastLoginAt: schema.users.lastLoginAt,
    createdAt: schema.users.createdAt, periodId: schema.users.periodId,
    periodName: schema.periods.name, periodStatus: schema.periods.status,
  }).from(schema.users)
    .leftJoin(schema.periods, eq(schema.users.periodId, schema.periods.id))
    .orderBy(desc(sql`${schema.users.role} = 'super_admin'`), asc(schema.users.name));
}

export async function getUserById(id: string) {
  const [u] = await db.select({
    id: schema.users.id, name: schema.users.name, email: schema.users.email, role: schema.users.role,
    adminPosition: schema.users.adminPosition, isActive: schema.users.isActive,
  }).from(schema.users).where(eq(schema.users.id, id));
  return u ?? null;
}

export async function countSuperAdmins() {
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(schema.users)
    .where(and(eq(schema.users.role, "super_admin"), eq(schema.users.isActive, true)));
  return Number(n);
}

// -------------------------------------------------------------- presensi
/** Presensi QR kini per program kerja (modul Event dinonaktifkan). */
export async function listProgramsForAttendance(opts: { periodId?: string | null; q?: string }) {
  const conds = [];
  if (opts.periodId) conds.push(eq(schema.programs.periodId, opts.periodId));
  if (opts.q) conds.push(like(schema.programs.name, `%${opts.q.replace(/[%_]/g, "")}%`));
  const rows = await db
    .select({
      id: schema.programs.id, name: schema.programs.name, startDate: schema.programs.startDate, status: schema.programs.status,
      periodId: schema.programs.periodId, attendanceOpen: schema.programs.attendanceOpen, attendanceCode: schema.programs.attendanceCode,
      attendanceClosesAt: schema.programs.attendanceClosesAt,
      hadir: sql<number>`(select count(*) from ${schema.programAttendances} where ${schema.programAttendances.programId} = ${schema.programs.id})`,
      terdaftar: sql<number>`(select count(*) from ${schema.programParticipants} where ${schema.programParticipants.programId} = ${schema.programs.id})`,
    })
    .from(schema.programs)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(schema.programs.attendanceOpen), desc(schema.programs.startDate), asc(schema.programs.name));
  const now = Date.now();
  return rows.map((r) => ({ ...r, hadir: Number(r.hadir), terdaftar: Number(r.terdaftar),
    expired: r.attendanceOpen && r.attendanceClosesAt !== null && r.attendanceClosesAt <= now }));
}

export async function getProgramForAttendance(id: string) {
  const [row] = await db
    .select({
      id: schema.programs.id, name: schema.programs.name, startDate: schema.programs.startDate, periodId: schema.programs.periodId,
      status: schema.programs.status, attendanceOpen: schema.programs.attendanceOpen, attendanceCode: schema.programs.attendanceCode,
      attendanceRequireSignature: schema.programs.attendanceRequireSignature, attendanceRequirePhoto: schema.programs.attendanceRequirePhoto,
      attendanceClosesAt: schema.programs.attendanceClosesAt, attendanceRegisteredOnly: schema.programs.attendanceRegisteredOnly,
      periodName: schema.periods.name,
    })
    .from(schema.programs)
    .innerJoin(schema.periods, eq(schema.programs.periodId, schema.periods.id))
    .where(eq(schema.programs.id, id));
  // tutup otomatis: kedaluwarsa dihitung di server (bukan saat render komponen)
  return row ? { ...row, expired: row.attendanceOpen && row.attendanceClosesAt !== null && row.attendanceClosesAt <= Date.now() } : null;
}

export async function listAttendances(programId: string) {
  return db.select().from(schema.programAttendances).where(eq(schema.programAttendances.programId, programId)).orderBy(asc(schema.programAttendances.checkedInAt));
}

export async function listParticipants(programId: string) {
  return db.select().from(schema.programParticipants).where(eq(schema.programParticipants.programId, programId)).orderBy(asc(schema.programParticipants.name));
}
