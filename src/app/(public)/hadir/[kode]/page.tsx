import type { Metadata, Viewport } from "next";
import { CheckCircle2 } from "lucide-react";
import { CheckInForm } from "@/components/public/check-in-form";
import { Container, PageHero } from "@/components/public/page-hero";
import { formatDate } from "@/lib/period";
import { getProgramByAttendanceCode } from "@/lib/queries/public";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Presensi Kegiatan" };
// Pengecualian: formulir presensi diisi di HP setelah memindai QR, jadi tetap ukuran HP (bukan desktop diperkecil).
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

type Props = { params: Promise<{ kode: string }>; searchParams: Promise<{ berhasil?: string }> };

export default async function AttendancePage({ params, searchParams }: Props) {
  const { kode } = await params;
  const { berhasil } = await searchParams;
  const program = await getProgramByAttendanceCode(kode);

  // tutup otomatis divalidasi di server: lewat batas waktu = dianggap ditutup (aksi checkIn juga menolak)
  if (!program || !program.attendanceOpen || program.expired) {
    return (
      <>
        <PageHero eyebrow="Presensi" title="Presensi tidak ditemukan" description="Tautan ini tidak valid atau presensi untuk kegiatan ini sudah ditutup. Hubungi panitia bila Anda merasa ini keliru." />
      </>
    );
  }

  if (berhasil) {
    return (
      <>
        <PageHero eyebrow="Presensi" title="Kehadiran tercatat" description={`Terima kasih, kehadiran Anda pada "${program.name}" telah tercatat.`}>
          <div className="flex items-center gap-3 rounded-2xl bg-green-50 px-5 py-4 text-green-900">
            <CheckCircle2 size={20} aria-hidden /> <span className="text-sm font-semibold">Berhasil dikonfirmasi.</span>
          </div>
        </PageHero>
      </>
    );
  }

  return (
    <>
      <PageHero eyebrow={program.startDate ? `Presensi · ${formatDate(program.startDate)}` : "Presensi"} title={program.name} description={program.location ? `Lokasi: ${program.location}` : "Isi data berikut untuk mengonfirmasi kehadiran Anda."} />
      <Container className="max-w-md pb-20">
        <div className="rounded-3xl bg-white p-7 shadow-lift ring-1 ring-line">
          <CheckInForm code={kode} programName={program.name} requireSignature={program.requireSignature} requirePhoto={program.requirePhoto} />
        </div>
      </Container>
    </>
  );
}
