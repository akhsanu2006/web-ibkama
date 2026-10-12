import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { mediaUrl, periodSlug } from "@/lib/period";

/**
 * SATU-SATUNYA jalur baca untuk halaman publik.
 * Hanya kolom yang aman ditampilkan (whitelist) — data privat anggota
 * (NIM, email, HP, catatan) TIDAK PERNAH dipilih di sini.
 */

export async function getOrganization() {
  const [org] = await db.select().from(s.organization).limit(1);
  return org ?? null;
}

export async function listPeriods() {
  return db.select().from(s.periods).orderBy(desc(s.periods.startYear));
}

export async function getActivePeriod() {
  const [p] = await db.select().from(s.periods).where(eq(s.periods.status, "active")).limit(1);
  return p ?? null;
}

/** ?periode=2025-2026 → periode itu; kosong → aktif; kalau belum ada aktif → terbaru. */
export async function resolvePeriod(slug?: string | null) {
  const all = await listPeriods();
  const picked = slug ? all.find((p) => periodSlug(p.name) === slug) : undefined;
  const period = picked ?? all.find((p) => p.status === "active") ?? all[0] ?? null;
  return { period, all };
}

export async function getIntegrations() {
  return db.select().from(s.integrations);
}

// ------------------------------------------------------------------ program
export async function listPublicPrograms(periodId: string, divisionId?: string | null) {
  return db
    .select({
      id: s.programs.id, name: s.programs.name, description: s.programs.description,
      status: s.programs.status, startDate: s.programs.startDate, endDate: s.programs.endDate,
      location: s.programs.location, divisionName: s.divisions.name, divisionId: s.programs.divisionId,
    })
    .from(s.programs)
    .leftJoin(s.divisions, eq(s.programs.divisionId, s.divisions.id))
    .where(and(eq(s.programs.periodId, periodId), eq(s.programs.isPublic, true),
      divisionId ? eq(s.programs.divisionId, divisionId) : undefined))
    .orderBy(asc(s.programs.startDate), asc(s.programs.name));
}

export async function getPublicProgram(id: string) {
  const [row] = await db
    .select({
      id: s.programs.id, name: s.programs.name, description: s.programs.description,
      background: s.programs.background, target: s.programs.target, startDate: s.programs.startDate,
      endDate: s.programs.endDate, timeNote: s.programs.timeNote, location: s.programs.location,
      status: s.programs.status, participantCount: s.programs.participantCount, output: s.programs.output,
      reportUrl: s.programs.reportUrl, supportingUrl: s.programs.supportingUrl,
      archiveMediaId: s.programs.archiveMediaId, archiveUrl: s.programs.archiveUrl,
      documentMediaId: s.programs.documentMediaId, documentUrl: s.programs.documentUrl,
      documentationMediaId: s.programs.documentationMediaId, documentationUrl: s.programs.documentationUrl,
      periodId: s.programs.periodId, periodName: s.periods.name,
      divisionName: s.divisions.name, picName: s.members.name,
    })
    .from(s.programs)
    .innerJoin(s.periods, eq(s.programs.periodId, s.periods.id))
    .leftJoin(s.divisions, eq(s.programs.divisionId, s.divisions.id))
    .leftJoin(s.members, eq(s.programs.picMemberId, s.members.id))
    .where(and(eq(s.programs.id, id), eq(s.programs.isPublic, true)));
  if (!row) return null;
  const photos = await db
    .select({ id: s.galleryItems.id, mediaId: s.galleryItems.mediaId, title: s.galleryItems.title })
    .from(s.galleryItems)
    .where(and(eq(s.galleryItems.programId, id), eq(s.galleryItems.isPublic, true)));
  return { ...row, gallery: photos.map((p) => ({ ...p, url: mediaUrl(p.mediaId)! })) };
}

// ------------------------------------------------------------------ presensi
/** Program untuk halaman presensi publik /hadir/[kode] (presensi QR per program kerja). */
export async function getProgramByAttendanceCode(code: string) {
  const [row] = await db
    .select({
      id: s.programs.id, name: s.programs.name, startDate: s.programs.startDate, location: s.programs.location, attendanceOpen: s.programs.attendanceOpen,
      requireSignature: s.programs.attendanceRequireSignature, requirePhoto: s.programs.attendanceRequirePhoto,
    })
    .from(s.programs)
    .where(eq(s.programs.attendanceCode, code));
  return row ?? null;
}

// ---------------------------------------------------------------- kepengurusan
export async function listPublicDivisions(periodId: string) {
  return db.select().from(s.divisions).where(eq(s.divisions.periodId, periodId))
    .orderBy(asc(s.divisions.sortOrder), asc(s.divisions.name));
}

export async function listPublicMembers(periodId: string) {
  const rows = await db
    .select({
      id: s.members.id, name: s.members.name, photoMediaId: s.members.photoMediaId,
      studyProgram: s.members.studyProgram, cohort: s.members.cohort, bio: s.members.bio,
      positionName: s.positions.name, positionCategory: s.positions.category,
      positionOrder: s.positions.sortOrder, divisionId: s.members.divisionId,
      divisionName: s.divisions.name,
    })
    .from(s.members)
    .leftJoin(s.positions, eq(s.members.positionId, s.positions.id))
    .leftJoin(s.divisions, eq(s.members.divisionId, s.divisions.id))
    .where(and(eq(s.members.periodId, periodId), eq(s.members.isPublic, true), eq(s.members.status, "active")))
    .orderBy(asc(s.positions.sortOrder), asc(s.members.name));
  return rows.map((r) => ({ ...r, photoUrl: mediaUrl(r.photoMediaId) }));
}

export async function listLeadership() {
  const rows = await db
    .select({
      id: s.leadershipHistory.id, chairName: s.leadershipHistory.chairName,
      photoMediaId: s.leadershipHistory.photoMediaId, profile: s.leadershipHistory.profile,
      periodInfo: s.leadershipHistory.periodInfo, achievements: s.leadershipHistory.achievements,
      documentationUrl: s.leadershipHistory.documentationUrl,
      periodName: s.periods.name, startYear: s.periods.startYear, periodStatus: s.periods.status,
    })
    .from(s.leadershipHistory)
    .innerJoin(s.periods, eq(s.leadershipHistory.periodId, s.periods.id))
    .where(eq(s.leadershipHistory.isPublic, true))
    .orderBy(desc(s.periods.startYear));
  return rows.map((r) => ({ ...r, photoUrl: mediaUrl(r.photoMediaId) }));
}

// -------------------------------------------------------------- arsip & galeri
export async function listArchiveCategories() {
  return db.select().from(s.archiveCategories).orderBy(asc(s.archiveCategories.sortOrder), asc(s.archiveCategories.name));
}

export async function listPublicArchive(periodId: string, categoryId?: string | null) {
  const entries = await db
    .select({
      id: s.archiveEntries.id, title: s.archiveEntries.title, description: s.archiveEntries.description,
      categoryId: s.archiveEntries.categoryId, categoryName: s.archiveCategories.name,
    })
    .from(s.archiveEntries)
    .innerJoin(s.archiveCategories, eq(s.archiveEntries.categoryId, s.archiveCategories.id))
    .where(and(eq(s.archiveEntries.periodId, periodId), eq(s.archiveEntries.isPublic, true),
      categoryId ? eq(s.archiveEntries.categoryId, categoryId) : undefined))
    .orderBy(desc(s.archiveEntries.createdAt));
  const docs = await db
    .select({
      id: s.documents.id, title: s.documents.title, description: s.documents.description,
      categoryId: s.documents.categoryId, mediaId: s.documents.mediaId, externalUrl: s.documents.externalUrl,
      categoryName: s.archiveCategories.name,
    })
    .from(s.documents)
    .leftJoin(s.archiveCategories, eq(s.documents.categoryId, s.archiveCategories.id))
    .where(and(eq(s.documents.periodId, periodId), eq(s.documents.visibility, "public"),
      categoryId ? eq(s.documents.categoryId, categoryId) : undefined))
    .orderBy(desc(s.documents.createdAt));
  return { entries, documents: docs.map((d) => ({ ...d, href: d.externalUrl ?? mediaUrl(d.mediaId) })) };
}

export async function archiveOverview() {
  const periods = await listPeriods();
  const cats = await listArchiveCategories();
  const counts = await db
    .select({ periodId: s.archiveEntries.periodId, categoryId: s.archiveEntries.categoryId, n: sql<number>`count(*)` })
    .from(s.archiveEntries).where(eq(s.archiveEntries.isPublic, true))
    .groupBy(s.archiveEntries.periodId, s.archiveEntries.categoryId);
  return { periods, cats, counts };
}

export async function listPublicGallery(periodId: string) {
  const rows = await db
    .select({
      id: s.galleryItems.id, mediaId: s.galleryItems.mediaId, title: s.galleryItems.title,
      caption: s.galleryItems.caption, programName: s.programs.name,
    })
    .from(s.galleryItems)
    .leftJoin(s.programs, eq(s.galleryItems.programId, s.programs.id))
    .where(and(eq(s.galleryItems.periodId, periodId), eq(s.galleryItems.isPublic, true)))
    .orderBy(desc(s.galleryItems.createdAt));
  return rows.map((r) => ({ ...r, url: mediaUrl(r.mediaId)! }));
}

// ------------------------------------------------------------------ ringkasan
export async function homeSummary(periodId: string | null) {
  if (!periodId) return { programs: [], memberCount: 0, leadership: [] };
  const programs = (await listPublicPrograms(periodId)).slice(0, 3);
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(s.members)
    .where(and(eq(s.members.periodId, periodId), eq(s.members.isPublic, true), eq(s.members.status, "active")));
  const leadership = (await listLeadership()).slice(0, 4);
  return { programs, memberCount: Number(n), leadership };
}

// --------------------------------------------------------------- bagan organisasi
type ChartMember = Awaited<ReturnType<typeof listPublicMembers>>[number];
export type ChartDivision = { id: string; name: string; description: string | null; head: ChartMember[]; secretary: ChartMember[]; members: ChartMember[] };

/**
 * Data bagan: Ketua Umum → Sekretaris & Bendahara (pengurus inti lain ikut di baris ini) → divisi
 * (Kepala Divisi, Sekretaris Divisi, Anggota). Jabatan dibaca dari kategori jabatan, bukan nama, kecuali
 * pembeda Ketua Umum vs inti lainnya. Bila Ketua Umum belum diisi di data anggota, pakai Riwayat Ketua Umum periode itu.
 */
export async function getOrgChart(periodId: string) {
  const [members, divisions, [ketumHistory]] = await Promise.all([
    listPublicMembers(periodId),
    listPublicDivisions(periodId),
    db.select({ name: s.leadershipHistory.chairName, photoMediaId: s.leadershipHistory.photoMediaId })
      .from(s.leadershipHistory)
      .where(and(eq(s.leadershipHistory.periodId, periodId), eq(s.leadershipHistory.isPublic, true))),
  ]);
  const isKetum = (m: ChartMember) => m.positionCategory === "core" && /ketua umum/i.test(m.positionName ?? "");
  const ketua = members.filter(isKetum);
  const inti = members.filter((m) => m.positionCategory === "core" && !isKetum(m));
  const coreDivisionIds = new Set(members.filter((m) => m.positionCategory === "core").map((m) => m.divisionId));
  const divs: ChartDivision[] = divisions
    .filter((d) => !/pimpinan harian/i.test(d.name) && !(coreDivisionIds.has(d.id) && !members.some((m) => m.divisionId === d.id && m.positionCategory !== "core")))
    .map((d) => {
      const list = members.filter((m) => m.divisionId === d.id && m.positionCategory !== "core");
      return {
        id: d.id, name: d.name, description: d.description,
        head: list.filter((m) => m.positionCategory === "division_head"),
        secretary: list.filter((m) => m.positionCategory === "division_secretary"),
        members: list.filter((m) => m.positionCategory !== "division_head" && m.positionCategory !== "division_secretary"),
      };
    });
  const fallbackKetum = !ketua.length && ketumHistory ? { name: ketumHistory.name, photoUrl: mediaUrl(ketumHistory.photoMediaId) } : null;
  return { ketua, fallbackKetum, inti, divisions: divs, total: members.length };
}

// ------------------------------------------------------------------------ berita
const newsCols = {
  id: s.news.id, category: s.news.category, title: s.news.title, personName: s.news.personName, level: s.news.level,
  summary: s.news.summary, coverMediaId: s.news.coverMediaId, date: s.news.date,
};

export async function listPublicNews(opts: { category?: string | null; limit?: number } = {}) {
  const cat = opts.category === "kabar" || opts.category === "prestasi" || opts.category === "rekognisi" ? opts.category : null;
  const q = db.select(newsCols).from(s.news)
    .where(and(eq(s.news.isPublic, true), cat ? eq(s.news.category, cat) : undefined))
    .orderBy(desc(s.news.date), desc(s.news.createdAt));
  const rows = opts.limit ? await q.limit(opts.limit) : await q;
  return rows.map((r) => ({ ...r, coverUrl: mediaUrl(r.coverMediaId) }));
}

export async function getPublicNews(id: string) {
  const [row] = await db.select({ ...newsCols, body: s.news.body, sourceUrl: s.news.sourceUrl })
    .from(s.news).where(and(eq(s.news.id, id), eq(s.news.isPublic, true)));
  return row ? { ...row, coverUrl: mediaUrl(row.coverMediaId) } : null;
}

// ------------------------------------------------------------------ IBKAMA dalam angka
/** Angka publik siap tampil. Angka kosong/0 disembunyikan agar band tidak menampilkan angka yang belum ada. */
export async function listHighlights() {
  const rows = await db.select().from(s.highlights).where(eq(s.highlights.isPublic, true)).orderBy(asc(s.highlights.sortOrder));
  if (!rows.length) return [];
  const one = async (query: Promise<{ n: number }[]>) => Number((await query)[0]?.n ?? 0);
  const newsCount = (cat?: "prestasi" | "rekognisi") => one(db.select({ n: sql<number>`count(*)` }).from(s.news)
    .where(and(eq(s.news.isPublic, true), cat ? eq(s.news.category, cat) : undefined)));
  const auto: Record<string, () => Promise<number>> = {
    // jumlah orang unik lintas periode (NIM bila ada, kalau tidak nama) — hanya agregat, tidak ada data privat yang keluar
    anggota: () => one(db.select({ n: sql<number>`count(distinct coalesce(nullif(trim(${s.members.studentId}), ''), lower(trim(${s.members.name}))))` }).from(s.members)),
    prestasi: () => newsCount("prestasi"),
    rekognisi: () => newsCount("rekognisi"),
    berita: () => newsCount(),
    program_selesai: () => one(db.select({ n: sql<number>`count(*)` }).from(s.programs).where(and(eq(s.programs.status, "completed"), eq(s.programs.isPublic, true)))),
    periode: () => one(db.select({ n: sql<number>`count(*)` }).from(s.periods).where(sql`${s.periods.status} != 'draft'`)),
  };
  const out = await Promise.all(rows.map(async (r) => {
    const value = r.source === "manual" ? r.value : await auto[r.source]?.();
    const text = value && value > 0 ? null : r.source === "manual" ? r.displayText?.trim() || null : null;
    return { id: r.id, label: r.label, value: value && value > 0 ? value : null, text, suffix: r.suffix ?? "" };
  }));
  return out.filter((h) => h.value !== null || h.text);
}
