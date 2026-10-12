"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { assertPermission } from "@/lib/auth/dal";
import { CLOSE_OPTIONS, DEFAULT_CLOSE_HOURS, checkInSchema, normalizeNim } from "@/lib/attendance-rules";
import { checkInRules, clientIp, consumeQuota, deviceId } from "@/lib/auth/rate-limit";
import { dataUrlToFile, deleteMedia, saveUpload } from "@/lib/media";

/**
 * Presensi QR per PROGRAM KERJA (sebelumnya per event; modul Event dinonaktifkan).
 * Kelola (buka/tutup/ganti kode/daftar peserta) = izin `program:update`.
 * Hapus baris kehadiran = izin `attendance:delete`. Isi presensi = publik via kode acak.
 */
export type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

/** Kode QR 128 bit (22 karakter base64url) — tidak praktis ditebak. */
function genCode() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64url");
}

const PROOF_MAX = 1.5 * 1024 * 1024; // 1,5 MB per bukti (hasil nyata klien < 300 KB)
const SUDAH_HADIR = "Identitas ini sudah tercatat hadir untuk program ini.";
const DITUTUP = "Presensi untuk tautan ini tidak ditemukan atau sudah ditutup.";
const PENUH = "Terlalu banyak pengiriman. Coba lagi beberapa menit lagi.";

/** Pesan umum untuk publik; detail teknis hanya ke log server (tanpa nama/NIM peserta). */
function publicError(e: unknown, programId: string) {
  const m = e instanceof Error ? e.message : String(e);
  // drizzle membungkus galat SQLite ("Failed query: …"); pesan UNIQUE ada di rantai `cause`
  for (let c: unknown = e, i = 0; c && i < 5; c = (c as { cause?: unknown }).cause, i++)
    if (/UNIQUE constraint/i.test(c instanceof Error ? c.message : String(c))) return SUDAH_HADIR;
  console.error(`[presensi] gagal menyimpan kehadiran program=${programId}:`, m);
  return "Presensi gagal dicatat. Silakan coba lagi.";
}

const back = (programId: string, ok: string): never => {
  revalidatePath(`/admin/presensi/${programId}`);
  redirect(`/admin/presensi/${programId}?ok=${ok}`);
};

/**
 * Buka presensi: kode QR SELALU diganti (QR lama langsung tidak berlaku) dan waktu tutup otomatis ditetapkan
 * dalam SATU pernyataan UPDATE (atomik). `durasi` (jam) dari formulir: 1/2/4, atau 0 = tanpa tutup otomatis.
 */
export async function openAttendance(programId: string, form?: FormData): Promise<void> {
  await assertPermission("program", "update");
  const raw = Number(form?.get("durasi") ?? DEFAULT_CLOSE_HOURS);
  const hours = (CLOSE_OPTIONS as readonly number[]).includes(raw) ? raw : DEFAULT_CLOSE_HOURS;
  await db.update(schema.programs).set({
    attendanceOpen: true,
    attendanceCode: genCode(),
    attendanceClosesAt: hours > 0 ? Date.now() + hours * 60 * 60 * 1000 : null,
  }).where(eq(schema.programs.id, programId));
  back(programId, "tersimpan");
}

export async function closeAttendance(programId: string): Promise<void> {
  await assertPermission("program", "update");
  await db.update(schema.programs).set({ attendanceOpen: false }).where(eq(schema.programs.id, programId));
  back(programId, "tersimpan");
}

/** Ganti kode QR (mis. jika bocor); tautan lama tak lagi berlaku. */
export async function regenerateAttendanceCode(programId: string): Promise<void> {
  await assertPermission("program", "update");
  await db.update(schema.programs).set({ attendanceCode: genCode() }).where(eq(schema.programs.id, programId));
  back(programId, "tersimpan");
}

/** Tetapkan daftar peserta terdaftar (opsional) — satu baris "Nama, NIM, Prodi". Menimpa daftar sebelumnya. */
export async function setParticipants(programId: string, form: FormData): Promise<void> {
  await assertPermission("program", "update");
  const raw = String(form.get("participants") ?? "");
  const rows = raw.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
    const [name, identifier, studyProgram] = line.split(",").map((s) => s.trim());
    return { id: crypto.randomUUID(), programId, name: name || line, identifier: identifier || null, studyProgram: studyProgram || null };
  });
  await db.transaction(async (tx) => {
    await tx.delete(schema.programParticipants).where(eq(schema.programParticipants.programId, programId));
    if (rows.length) await tx.insert(schema.programParticipants).values(rows);
  });
  back(programId, "tersimpan");
}

/** Atur bukti yang wajib diisi peserta (tanda tangan digital & foto kehadiran). */
export async function setAttendanceRequirements(programId: string, form: FormData): Promise<void> {
  await assertPermission("program", "update");
  await db.update(schema.programs).set({
    attendanceRequireSignature: form.get("requireSignature") === "on",
    attendanceRequirePhoto: form.get("requirePhoto") === "on",
    attendanceRegisteredOnly: form.get("registeredOnly") === "on",
  }).where(eq(schema.programs.id, programId));
  back(programId, "tersimpan");
}

export async function deleteAttendanceRow(programId: string, id: string): Promise<FormState> {
  await assertPermission("attendance", "delete");
  const where = and(eq(schema.programAttendances.id, id), eq(schema.programAttendances.programId, programId));
  const [row] = await db.select({ s: schema.programAttendances.signatureMediaId, p: schema.programAttendances.photoMediaId }).from(schema.programAttendances).where(where);
  await db.delete(schema.programAttendances).where(where);
  await deleteMedia([row?.s, row?.p]); // bukti (foto & tanda tangan) ikut dihapus
  return back(programId, "dihapus");
}

/** Presensi dianggap terbuka bila status buka DAN (tanpa batas waktu atau belum lewat batas). */
const isOpenNow = (p: { attendanceOpen: boolean; attendanceClosesAt: number | null }) =>
  p.attendanceOpen && (p.attendanceClosesAt === null || p.attendanceClosesAt > Date.now());

/** Format kode QR (kode lama 8 karakter, kode baru 22 karakter base64url). Bukan rahasia — tetap dicocokkan ke DB. */
const CODE_RE = /^[A-Za-z0-9_-]{6,64}$/;

/**
 * Aksi PUBLIK — dipanggil dari halaman /hadir/[kode], tanpa login. Kode QR dikirim lewat input tersembunyi `code`
 * (BUKAN `checkIn.bind(null, code)` di komponen klien: aksi terikat di klien + useActionState membuat render ulang
 * tanpa-JS berputar tanpa henti — CPU 100%/kehabisan memori. Lihat Paket D).
 */
export async function checkIn(_prev: FormState, form: FormData): Promise<FormState> {
  const code = String(form.get("code") ?? "");
  if (!CODE_RE.test(code)) return { error: DITUTUP };
  const parsed = checkInSchema.safeParse({
    name: String(form.get("name") ?? ""), identifier: String(form.get("identifier") ?? ""),
    studyProgram: String(form.get("studyProgram") ?? ""), cohort: String(form.get("cohort") ?? ""),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "Periksa kembali isian yang ditandai.", fieldErrors };
  }
  const [program] = await db.select().from(schema.programs).where(eq(schema.programs.attendanceCode, code));
  if (!program || !isOpenNow(program)) return { error: DITUTUP };

  // Bukti: tanda tangan (PNG kanvas) & foto kamera (JPEG berstempel waktu), maks 1,5 MB per berkas.
  const rawSig = String(form.get("signature") ?? ""), rawPhoto = String(form.get("photo") ?? "");
  const signature = dataUrlToFile(rawSig, "ttd", PROOF_MAX);
  const photo = dataUrlToFile(rawPhoto, "foto-kehadiran", PROOF_MAX);
  const fieldErrors: Record<string, string> = {};
  if (rawSig && !signature) fieldErrors.signature = "Tanda tangan tidak valid atau terlalu besar. Ulangi tanda tangan.";
  else if (program.attendanceRequireSignature && !signature) fieldErrors.signature = "Bubuhkan tanda tangan digital.";
  if (rawPhoto && !photo) fieldErrors.photo = "Foto tidak valid atau terlalu besar (maks 1,5 MB). Ambil ulang foto.";
  else if (program.attendanceRequirePhoto && !photo) fieldErrors.photo = "Ambil foto bukti kehadiran.";
  if (Object.keys(fieldErrors).length) return { error: "Lengkapi bukti kehadiran.", fieldErrors };

  const nim = parsed.data.identifier; // sudah dinormalisasi (lihat attendance-rules.ts)
  // Cocokkan daftar peserta dengan normalisasi di KEDUA sisi (data daftar yang tersimpan tidak diubah).
  const participants = await db.select({ id: schema.programParticipants.id, identifier: schema.programParticipants.identifier })
    .from(schema.programParticipants).where(eq(schema.programParticipants.programId, program.id));
  const participant = participants.find((p) => p.identifier && normalizeNim(p.identifier) === nim);
  if (program.attendanceRegisteredOnly && !participant) return { error: "Data Anda tidak terdaftar untuk kegiatan ini. Hubungi panitia." };

  // Cek ganda lebih dulu agar tidak ada berkas bukti tersimpan percuma (indeks unik DB tetap jadi penjaga akhir).
  const [dup] = await db.select({ id: schema.programAttendances.id }).from(schema.programAttendances)
    .where(and(eq(schema.programAttendances.programId, program.id), eq(schema.programAttendances.identifier, nim)));
  if (dup) return { error: SUDAH_HADIR };

  // Kuota (perangkat / IP per program / IP total / program) diambil TEPAT sebelum menyimpan: kiriman yang salah isi
  // atau ganda tidak menghabiskan jatah peserta, dan kiriman yang ditolak kuota tidak menambah hitungan.
  if (!(await consumeQuota(checkInRules(program.id, await deviceId(), await clientIp())))) return { error: PENUH };

  let signatureMediaId: string | null = null, photoMediaId: string | null = null;
  try {
    // media PRIVAT: hanya bisa dibuka pengguna dashboard yang login
    const meta = { kind: "image" as const, periodId: program.periodId, visibility: "private" as const, ownerType: "attendance", ownerId: program.id };
    if (signature) signatureMediaId = await saveUpload(signature, meta);
    if (photo) photoMediaId = await saveUpload(photo, meta);
    const ua = ((await headers()).get("user-agent") ?? "").slice(0, 300) || null;
    // INSERT bersyarat (satu pernyataan, atomik): hanya tersimpan bila kode MASIH cocok, presensi MASIH terbuka,
    // dan belum lewat batas waktu — kiriman yang sedang diproses saat QR diganti/ditutup ikut ditolak.
    const res = await db.run(sql`
      INSERT INTO program_attendances (id, program_id, period_id, participant_id, name, identifier, study_program, cohort,
        signature_media_id, photo_media_id, device_info)
      SELECT ${crypto.randomUUID()}, ${program.id}, ${program.periodId}, ${participant?.id ?? null}, ${parsed.data.name}, ${nim},
        ${parsed.data.studyProgram}, ${parsed.data.cohort}, ${signatureMediaId}, ${photoMediaId}, ${ua}
      WHERE EXISTS (SELECT 1 FROM programs WHERE id = ${program.id} AND attendance_code = ${code} AND attendance_open = 1
        AND (attendance_closes_at IS NULL OR attendance_closes_at > ${Date.now()}))`);
    if (res.rowsAffected === 0) {
      await deleteMedia([signatureMediaId, photoMediaId]);
      return { error: DITUTUP };
    }
  } catch (e) {
    await deleteMedia([signatureMediaId, photoMediaId]); // hanya berkas milik kiriman INI
    return { error: publicError(e, program.id) };
  }
  redirect(`/hadir/${code}?berhasil=1`);
}
