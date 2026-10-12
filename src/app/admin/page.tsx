import type { Metadata } from "next";
import { CalendarCheck2, ClipboardList, Layers, Newspaper, Users } from "lucide-react";
import { AdminPageHeader, StatCard } from "@/components/admin/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/dal";
import { can } from "@/lib/permissions";
import { adminOverview } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Ringkasan" };

export default async function AdminHome() {
  const user = await requireUser();
  const o = await adminOverview();
  const isSuper = user.role === "super_admin";

  if (o.periodCount === 0) {
    return (
      <div>
        <AdminPageHeader title={`Selamat datang, ${user.name.split(" ")[0]}.`} description="Belum ada periode kepengurusan yang dibuat." />
        <EmptyState
          title="Mulai dengan membuat periode kepengurusan."
          hint={isSuper ? "Semua data organisasi (anggota, program, arsip, dokumentasi) terhubung ke periode. Buat periode pertama untuk mulai mengisi data." : "Hubungi Super Admin untuk membuat periode kepengurusan pertama."}
          action={isSuper ? { href: "/admin/periode/new", label: "Buat Periode" } : undefined}
        />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title={`Selamat datang, ${user.name.split(" ")[0]}.`}
        description={o.active ? `Periode aktif: ${o.active.name}.` : "Belum ada periode yang berstatus aktif."} />

      {!o.active && (
        <div className="mb-8 rounded-3xl bg-brown-100 px-6 py-4 text-sm text-brown-800 ring-1 ring-brown-300/40">
          Tidak ada periode aktif saat ini. {isSuper ? <>Aktifkan salah satu periode di <ButtonLink href="/admin/periode" variant="ghost" size="sm">Kelola Periode</ButtonLink>.</> : "Hubungi Super Admin untuk mengaktifkan periode."}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Anggota aktif" value={o.memberCount} hint="Periode aktif" />
        <StatCard label="Program berjalan" value={o.programCount} hint="Direncanakan + berlangsung" />
        <StatCard label="Presensi terbuka" value={o.openAttendanceCount} hint="Program dengan QR aktif" />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {can(user.role, "member", "create", user.permissions) && <QuickLink href="/admin/anggota/new" icon={Users} label="Tambah Anggota" />}
        {can(user.role, "program", "create", user.permissions) && <QuickLink href="/admin/program/new" icon={ClipboardList} label="Tambah Program Kerja" />}
        {can(user.role, "attendance", "read", user.permissions) && <QuickLink href="/admin/presensi" icon={CalendarCheck2} label="Presensi QR" />}
        {can(user.role, "news", "create", user.permissions) && <QuickLink href="/admin/berita/new" icon={Newspaper} label="Tulis Berita" />}
        {isSuper && <QuickLink href="/admin/periode" icon={Layers} label="Kelola Periode" />}
      </div>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: typeof Users; label: string }) {
  return (
    <ButtonLink href={href} variant="secondary" className="justify-start !px-5 !py-6 text-left">
      <Icon size={18} className="text-green-700" aria-hidden /> {label}
    </ButtonLink>
  );
}
