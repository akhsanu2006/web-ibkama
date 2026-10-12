import { z } from "zod";

/**
 * Aturan isian presensi publik — dipakai BERSAMA oleh formulir (klien) dan Server Action,
 * agar validasi & normalisasi NIM selalu identik di kedua sisi.
 */
export const LIMITS = { name: 100, studyProgram: 100, identifierRaw: 40 } as const;

/** NIM baku: hapus spasi, titik, tanda hubung, garis miring; huruf kapital. "2021-0001" = "2021 0001" = "20210001". */
export function normalizeNim(raw: string) {
  return raw.replace(/[\s.\-/]/g, "").toUpperCase();
}

export const checkInSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi.").max(LIMITS.name, `Nama maksimal ${LIMITS.name} karakter.`),
  identifier: z.string().max(LIMITS.identifierRaw, "NIM / identitas terlalu panjang.")
    .transform(normalizeNim)
    .pipe(z.string().min(1, "NIM / identitas wajib diisi.").regex(/^[A-Z0-9]{3,30}$/, "NIM / identitas hanya huruf & angka (3–30 karakter).")),
  studyProgram: z.string().trim().max(LIMITS.studyProgram, `Program studi maksimal ${LIMITS.studyProgram} karakter.`).transform((v) => v || null),
  cohort: z.string().trim().refine((v) => v === "" || /^\d{4}$/.test(v), "Angkatan berupa 4 digit tahun, mis. 2023.").transform((v) => v || null),
});

export type CheckInFields = z.input<typeof checkInSchema>;

/** Pilihan durasi tutup otomatis (jam); 0 = tanpa tutup otomatis. */
export const CLOSE_OPTIONS = [1, 2, 4, 0] as const;
export const DEFAULT_CLOSE_HOURS = 2;
