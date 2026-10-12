import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPeriodSwitcher } from "@/components/admin/period-switcher";
import { SearchBox } from "@/components/admin/search-box";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePagePermission } from "@/lib/auth/dal";
import { adminPeriod, listProgramsForAttendance } from "@/lib/queries/admin";
import { formatDate } from "@/lib/period";

export const metadata: Metadata = { title: "Presensi QR" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ periode?: string; q?: string }> };

export default async function AttendanceListPage({ searchParams }: Props) {
  await requirePagePermission("attendance", "read");
  const { periode, q } = await searchParams;
  const period = await adminPeriod(periode);
  const programs = await listProgramsForAttendance({ periodId: period.showAll ? undefined : period.current?.id, q });

  return (
    <div>
      <AdminPageHeader title="Presensi QR" description="Buka presensi untuk sebuah program kerja agar peserta dapat memindai QR dan mengisi kehadiran." />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        {period.all.length > 0 && <AdminPeriodSwitcher periods={period.all} current={period.current?.id ?? null} showAll={period.showAll} basePath="/admin/presensi" extra={{ q }} />}
        <SearchBox q={q} placeholder="Cari program kerja…" keep={{ periode }} />
      </div>

      {programs.length === 0 ? (
        <EmptyState title="Belum ada program kerja di periode ini." hint="Presensi QR dibuat per program kerja. Tambahkan program kerja terlebih dahulu melalui menu Program Kerja." />
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-white ring-1 ring-line shadow-soft">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wider text-muted">
                <th className="px-5 py-4">Program Kerja</th><th className="px-5 py-4">Tanggal mulai</th><th className="px-5 py-4">Presensi</th><th className="px-5 py-4">Hadir</th><th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody>
              {programs.map((e) => (
                <tr key={e.id} className="border-b border-line/70 last:border-0 hover:bg-green-50/40">
                  <td className="px-5 py-3.5 font-medium text-ink">{e.name}</td>
                  <td className="px-5 py-3.5 text-muted">{formatDate(e.startDate) || "—"}</td>
                  <td className="px-5 py-3.5">{e.expired
                    ? <Badge tone="brown">Kedaluwarsa</Badge>
                    : <Badge tone={e.attendanceOpen ? "green" : "gray"}>{e.attendanceOpen ? "Terbuka" : "Tertutup"}</Badge>}</td>
                  <td className="px-5 py-3.5 text-muted">{e.hadir}{e.terdaftar > 0 ? ` / ${e.terdaftar} terdaftar` : ""}</td>
                  <td className="px-5 py-3.5 text-right"><Link href={`/admin/presensi/${e.id}`} className="text-sm font-semibold text-green-700 hover:underline">Kelola →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
