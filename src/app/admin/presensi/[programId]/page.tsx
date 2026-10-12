import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Download, RefreshCw } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DeleteButton } from "@/components/admin/delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/empty-state";
import {
  closeAttendance, deleteAttendanceRow, openAttendance, regenerateAttendanceCode, setAttendanceRequirements, setParticipants,
} from "@/lib/actions/attendance";
import { requirePagePermission } from "@/lib/auth/dal";
import { can } from "@/lib/permissions";
import { formatDate } from "@/lib/period";
import { getProgramForAttendance, listAttendances, listParticipants } from "@/lib/queries/admin";
import { siteOrigin } from "@/lib/site-url";
import { CLOSE_OPTIONS, DEFAULT_CLOSE_HOURS, normalizeNim } from "@/lib/attendance-rules";

const jam = (ms: number) => new Date(ms).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

export const metadata: Metadata = { title: "Presensi Program" };
export const dynamic = "force-dynamic";

export default async function AttendanceDetailPage({ params }: { params: Promise<{ programId: string }> }) {
  const user = await requirePagePermission("attendance", "read");
  const { programId } = await params;
  const program = await getProgramForAttendance(programId);
  if (!program) notFound();

  const canManage = can(user.role, "program", "update", user.permissions);
  const canDeleteAttendance = can(user.role, "attendance", "delete", user.permissions);
  const [attendances, participants] = await Promise.all([listAttendances(programId), listParticipants(programId)]);
  // NIM kehadiran disimpan ternormalisasi; daftar peserta dibandingkan dengan normalisasi yang sama
  const attendedIdentifiers = new Set(attendances.map((a) => normalizeNim(a.identifier)));
  const notYet = participants.filter((p) => p.identifier && !attendedIdentifiers.has(normalizeNim(p.identifier)));
  const { expired } = program;

  let qrDataUrl: string | null = null;
  let checkInUrl: string | null = null;
  if (program.attendanceCode) {
    checkInUrl = `${await siteOrigin()}/hadir/${program.attendanceCode}`;
    qrDataUrl = await QRCode.toDataURL(checkInUrl, { margin: 1, width: 288, color: { dark: "#17331f", light: "#ffffff" } });
  }

  return (
    <div>
      <AdminPageHeader title={program.name} description={[program.periodName, formatDate(program.startDate)].filter(Boolean).join(" · ")} />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-5">
          <div className="rounded-3xl bg-white p-6 text-center ring-1 ring-line shadow-soft">
            {expired
              ? <Badge tone="brown">Kedaluwarsa (tertutup otomatis)</Badge>
              : <Badge tone={program.attendanceOpen ? "green" : "gray"}>{program.attendanceOpen ? "Presensi terbuka" : "Presensi tertutup"}</Badge>}
            {program.attendanceOpen && (
              <p className="mt-2 text-xs text-muted">
                {program.attendanceClosesAt == null ? "Tanpa tutup otomatis" : `${expired ? "Tertutup otomatis sejak" : "Tutup otomatis"} ${jam(program.attendanceClosesAt)} WIB`}
              </p>
            )}
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt={`QR presensi ${program.name}`} className="mx-auto mt-5 size-56 rounded-2xl ring-1 ring-line" />
            ) : (
              <p className="mt-5 text-sm text-muted">QR akan muncul setelah presensi dibuka.</p>
            )}
            {checkInUrl && <p className="mt-4 break-all rounded-xl bg-green-50 px-3 py-2 text-[11px] text-muted">{checkInUrl}</p>}
            {canManage && (
              <div className="mt-5 flex flex-col gap-2">
                {program.attendanceOpen && !expired && (
                  <form action={closeAttendance.bind(null, programId)}><Button type="submit" variant="secondary" className="w-full">Tutup Presensi</Button></form>
                )}
                {(!program.attendanceOpen || expired) && (
                  // membuka = kode QR baru (QR lama tidak berlaku) + batas waktu baru
                  <form action={openAttendance.bind(null, programId)} className="space-y-2 text-left">
                    <label htmlFor="durasi" className="block text-xs font-semibold text-muted">Tutup otomatis setelah</label>
                    <select id="durasi" name="durasi" defaultValue={String(DEFAULT_CLOSE_HOURS)} className="w-full rounded-full bg-white px-4 py-2.5 text-sm ring-1 ring-line">
                      {CLOSE_OPTIONS.map((h) => <option key={h} value={h}>{h === 0 ? "Tanpa tutup otomatis" : `${h} jam`}</option>)}
                    </select>
                    <Button type="submit" className="w-full">{expired ? "Buka Ulang Presensi" : "Buka Presensi"}</Button>
                    <p className="text-[11px] leading-relaxed text-muted">Setiap kali dibuka, kode QR diganti — QR lama tidak berlaku lagi.</p>
                  </form>
                )}
                {program.attendanceCode && (
                  <form action={regenerateAttendanceCode.bind(null, programId)}>
                    <Button type="submit" variant="ghost" size="sm" className="w-full"><RefreshCw size={14} /> Ganti kode QR</Button>
                  </form>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-green-50 p-4 text-center"><p className="font-heading text-2xl font-bold text-green-900">{attendances.length}</p><p className="text-[11px] text-muted">Hadir</p></div>
            <div className="rounded-2xl bg-brown-100 p-4 text-center"><p className="font-heading text-2xl font-bold text-brown-800">{participants.length ? notYet.length : "—"}</p><p className="text-[11px] text-muted">Belum hadir</p></div>
          </div>

          {canManage && (
            <form action={setAttendanceRequirements.bind(null, programId)} className="space-y-3 rounded-3xl bg-white p-5 ring-1 ring-line shadow-soft">
              <p className="text-sm font-semibold text-green-900">Pengaturan presensi</p>
              <p className="text-xs leading-relaxed text-muted">Mencegah titip absen: peserta harus mengambil foto langsung dari kamera (berstempel waktu) dan/atau membubuhkan tanda tangan digital. Bukti hanya bisa dilihat pengurus.</p>
              <label className="flex items-center gap-3 rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-950">
                <input type="checkbox" name="requirePhoto" defaultChecked={program.attendanceRequirePhoto} className="size-4 accent-green-800" /> Foto bukti kehadiran
              </label>
              <label className="flex items-center gap-3 rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-950">
                <input type="checkbox" name="requireSignature" defaultChecked={program.attendanceRequireSignature} className="size-4 accent-green-800" /> Tanda tangan digital
              </label>
              <label className="flex items-start gap-3 rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-950">
                <input type="checkbox" name="registeredOnly" defaultChecked={program.attendanceRegisteredOnly} className="mt-0.5 size-4 accent-green-800" />
                <span>Hanya peserta terdaftar<span className="mt-0.5 block text-xs font-normal text-muted">NIM yang tidak ada di daftar peserta ditolak.</span></span>
              </label>
              {program.attendanceRegisteredOnly && participants.length === 0 && (
                <p role="alert" className="rounded-2xl bg-brown-100 px-4 py-3 text-xs font-medium text-brown-800">Mode peserta terdaftar aktif, tetapi daftar peserta masih kosong — semua presensi akan ditolak. Isi daftar peserta di bawah.</p>
              )}
              <Button type="submit" size="sm" variant="secondary">Simpan pengaturan</Button>
            </form>
          )}

          {canManage && (
            <details className="rounded-3xl bg-white p-5 ring-1 ring-line shadow-soft">
              <summary className="cursor-pointer text-sm font-semibold text-green-900">Daftar peserta terdaftar (opsional)</summary>
              <form action={setParticipants.bind(null, programId)} className="mt-4 space-y-3">
                <Field label="Satu peserta per baris" htmlFor="participants" help="Format: Nama, NIM, Program studi (opsional).">
                  <textarea id="participants" name="participants" rows={6} className={inputCls}
                    defaultValue={participants.map((p) => [p.name, p.identifier, p.studyProgram].filter(Boolean).join(", ")).join("\n")}
                    placeholder={"Contoh:\nBudi Santoso, 20210001, Teknik Informatika"} />
                </Field>
                <Button type="submit" size="sm">Simpan Daftar</Button>
              </form>
            </details>
          )}
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg">Rekap Kehadiran</h2>
            {attendances.length > 0 && (
              <a href={`/admin/presensi/${programId}/export`} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-green-800 ring-1 ring-inset ring-green-200 hover:bg-green-50">
                <Download size={14} /> Ekspor CSV
              </a>
            )}
          </div>
          {attendances.length === 0 ? (
            <EmptyState title="Belum ada yang hadir." hint="Rekap akan muncul di sini setelah peserta memindai QR dan mengonfirmasi kehadiran." />
          ) : (
            <div className="overflow-x-auto rounded-3xl bg-white ring-1 ring-line shadow-soft">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <th className="px-5 py-4">Nama</th><th className="px-5 py-4">Identitas</th><th className="px-5 py-4">Prodi / Angkatan</th><th className="px-5 py-4">Bukti</th><th className="px-5 py-4">Waktu</th><th className="px-5 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((a) => (
                    <tr key={a.id} className="border-b border-line/70 last:border-0 hover:bg-green-50/40">
                      <td className="px-5 py-3.5 font-medium text-ink">{a.name}</td>
                      <td className="px-5 py-3.5 text-muted">{a.identifier}</td>
                      <td className="px-5 py-3.5 text-muted">{[a.studyProgram, a.cohort].filter(Boolean).join(" · ") || "—"}</td>
                      <td className="px-5 py-3">
                        {/* media privat: hanya terbuka untuk pengguna dashboard yang login */}
                        <div className="flex items-center gap-2">
                          {a.photoMediaId && (
                            <a href={`/media/${a.photoMediaId}`} target="_blank" rel="noopener noreferrer" title="Buka foto bukti kehadiran" className="block overflow-hidden rounded-lg ring-1 ring-line transition hover:ring-green-700">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={`/media/${a.photoMediaId}`} alt={`Foto kehadiran ${a.name}`} className="h-12 w-16 object-cover" />
                            </a>
                          )}
                          {a.signatureMediaId && (
                            <a href={`/media/${a.signatureMediaId}`} target="_blank" rel="noopener noreferrer" title="Buka tanda tangan" className="block overflow-hidden rounded-lg bg-white ring-1 ring-line transition hover:ring-green-700">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={`/media/${a.signatureMediaId}`} alt={`Tanda tangan ${a.name}`} className="h-12 w-24 object-contain" />
                            </a>
                          )}
                          {!a.photoMediaId && !a.signatureMediaId && <span className="text-xs text-muted">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted">{new Date(a.checkedInAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</td>
                      <td className="px-5 py-3.5 text-right">{canDeleteAttendance && <DeleteButton action={deleteAttendanceRow.bind(null, programId, a.id)} itemName={a.name} iconOnly />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
