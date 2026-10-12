import { NextResponse } from "next/server";
import { assertPermission } from "@/lib/auth/dal";
import { formatDate } from "@/lib/period";
import { getProgramForAttendance, listAttendances } from "@/lib/queries/admin";
import { siteOrigin } from "@/lib/site-url";

/**
 * Sel CSV aman untuk SEMUA kolom (termasuk User-Agent yang bisa diisi bebas pengirim):
 *  1) buang karakter kontrol kecuali tab/CR/LF;
 *  2) NETRALISASI FORMULA (terlepas dari pengutipan): sel yang diawali = + - @ tab CR — juga setelah spasi
 *     di depannya — diberi awalan ' agar spreadsheet (Excel/Sheets/LibreOffice) membacanya sebagai teks;
 *  3) kutip bila mengandung " , ; tab CR LF (kutip di dalam digandakan).
 */
function csvCell(v: unknown) {
  let s = String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  if (/^[\s]*[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",;\t\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(_req: Request, { params }: { params: Promise<{ programId: string }> }) {
  try {
    await assertPermission("attendance", "export");
  } catch {
    return NextResponse.json({ error: "Tidak memiliki izin." }, { status: 403 });
  }
  const { programId } = await params;
  const program = await getProgramForAttendance(programId);
  if (!program) return NextResponse.json({ error: "Program tidak ditemukan." }, { status: 404 });

  const rows = await listAttendances(programId);
  // tautan bukti hanya bisa dibuka oleh pengguna dashboard yang login (media privat)
  const origin = await siteOrigin();
  const link = (id: string | null) => (id ? `${origin}/media/${id}` : "");
  const header = ["Nama", "NIM/Identitas", "Program Studi", "Angkatan", "Waktu Presensi", "Foto Bukti", "Tanda Tangan", "Perangkat"];
  const lines = [header, ...rows.map((r) => [
    r.name, r.identifier, r.studyProgram ?? "", r.cohort ?? "",
    new Date(r.checkedInAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }),
    link(r.photoMediaId), link(r.signatureMediaId), r.deviceInfo ?? "",
  ])].map((row) => row.map(csvCell).join(","));

  const csv = "﻿" + lines.join("\r\n");
  const filename = `presensi-${[program.name, formatDate(program.startDate)].filter(Boolean).join("-").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
