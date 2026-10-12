"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { assertPermission } from "@/lib/auth/dal";
import { dataUrlToFile, deleteMedia, saveUpload } from "@/lib/media";

/**
 * Presensi QR per PROGRAM KERJA (sebelumnya per event; modul Event dinonaktifkan).
 * Kelola (buka/tutup/ganti kode/daftar peserta) = izin `program:update`.
 * Hapus baris kehadiran = izin `attendance:delete`. Isi presensi = publik via kode acak.
 */
export type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

function genCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

function friendly(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  if (/UNIQUE/i.test(m)) return "Identitas ini sudah tercatat hadir untuk program ini.";
  return m || "Terjadi kesalahan tak terduga.";
}

const back = (programId: string, ok: string): never => {
  revalidatePath(`/admin/presensi/${programId}`);
  redirect(`/admin/presensi/${programId}?ok=${ok}`);
};

/** Buka presensi QR untuk sebuah program; membuat kode baru bila belum ada. Dipakai langsung sebagai `<form action>`. */
export async function openAttendance(programId: string): Promise<void> {
  await assertPermission("program", "update");
  const [program] = await db.select().from(schema.programs).where(eq(schema.programs.id, programId));
  if (program) {
    await db.update(schema.programs).set({
      attendanceOpen: true,
      attendanceCode: program.attendanceCode ?? genCode(),
    }).where(eq(schema.programs.id, programId));
  }
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

const checkInSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi."),
  identifier: z.string().trim().min(1, "NIM / identitas wajib diisi."),
  studyProgram: z.string().trim().transform((v) => v || null),
  cohort: z.string().trim().transform((v) => v || null),
});

/** Aksi PUBLIK — dipanggil dari halaman /hadir/[kode], tanpa login. */
export async function checkIn(code: string, _prev: FormState, form: FormData): Promise<FormState> {
  const parsed = checkInSchema.safeParse({
    name: form.get("name"), identifier: form.get("identifier"), studyProgram: form.get("studyProgram"), cohort: form.get("cohort"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "Periksa kembali isian yang ditandai.", fieldErrors };
  }
  const [program] = await db.select().from(schema.programs)
    .where(and(eq(schema.programs.attendanceCode, code), eq(schema.programs.attendanceOpen, true)));
  if (!program) return { error: "Presensi untuk tautan ini tidak ditemukan atau sudah ditutup." };

  // Bukti kehadiran: tanda tangan (PNG dari kanvas) & foto langsung dari kamera (JPEG berstempel waktu).
  const signature = dataUrlToFile(String(form.get("signature") ?? ""), "ttd");
  const photo = dataUrlToFile(String(form.get("photo") ?? ""), "foto-kehadiran");
  const fieldErrors: Record<string, string> = {};
  if (program.attendanceRequireSignature && !signature) fieldErrors.signature = "Bubuhkan tanda tangan digital.";
  if (program.attendanceRequirePhoto && !photo) fieldErrors.photo = "Ambil foto bukti kehadiran.";
  if (Object.keys(fieldErrors).length) return { error: "Lengkapi bukti kehadiran.", fieldErrors };

  // Cek ganda lebih dulu agar tidak ada berkas bukti yang tersimpan percuma.
  const [dup] = await db.select({ id: schema.programAttendances.id }).from(schema.programAttendances)
    .where(and(eq(schema.programAttendances.programId, program.id), eq(schema.programAttendances.identifier, parsed.data.identifier)));
  if (dup) return { error: "Identitas ini sudah tercatat hadir untuk program ini." };

  const [participant] = await db.select().from(schema.programParticipants)
    .where(and(eq(schema.programParticipants.programId, program.id), eq(schema.programParticipants.identifier, parsed.data.identifier)));

  let signatureMediaId: string | null = null, photoMediaId: string | null = null;
  try {
    // media PRIVAT: hanya bisa dibuka pengguna dashboard yang login
    const meta = { kind: "image" as const, periodId: program.periodId, visibility: "private" as const, ownerType: "attendance", ownerId: program.id };
    if (signature) signatureMediaId = await saveUpload(signature, meta);
    if (photo) photoMediaId = await saveUpload(photo, meta);
    await db.insert(schema.programAttendances).values({
      programId: program.id, periodId: program.periodId, participantId: participant?.id ?? null, ...parsed.data,
      signatureMediaId, photoMediaId, deviceInfo: ((await headers()).get("user-agent") ?? "").slice(0, 300) || null,
    });
  } catch (e) {
    await deleteMedia([signatureMediaId, photoMediaId]);
    return { error: friendly(e) };
  }
  redirect(`/hadir/${code}?berhasil=1`);
}
