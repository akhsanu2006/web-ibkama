import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/dal";
import { googleConfigured } from "@/lib/auth/google";

export const metadata: Metadata = { title: "Akun Saya" };
export const dynamic = "force-dynamic";

/** Halaman akun pribadi — terbuka untuk semua peran yang login (tidak mengubah izin modul lain). */
export default async function AccountPage() {
  const me = await requireUser();
  return (
    <div>
      <AdminPageHeader title="Akun Saya" description="Kelola keamanan akun Anda sendiri." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-line">
          <h2 className="text-lg">Informasi akun</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="text-xs font-semibold uppercase tracking-widest text-muted">Nama</dt><dd className="mt-0.5 text-ink">{me.name}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-widest text-muted">Email</dt><dd className="mt-0.5 text-ink">{me.email}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-widest text-muted">Peran</dt><dd className="mt-1"><Badge tone={me.role === "super_admin" ? "gold" : "green"}>{me.role === "super_admin" ? "Super Admin" : "Admin"}</Badge></dd></div>
          </dl>
          <div className="mt-6 rounded-2xl bg-green-50 p-4 text-[13px] leading-relaxed text-green-900">
            <p className="font-semibold">Keamanan sesi</p>
            <p className="mt-1">Tombol keluar (logout) mengeluarkan akun ini dari <strong>semua perangkat</strong>. Mengganti password juga mengeluarkan perangkat lain; perangkat yang sedang Anda pakai tetap masuk.</p>
          </div>
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-line">
          <h2 className="text-lg">Ganti password</h2>
          <p className="mt-1 mb-5 text-[13px] leading-relaxed text-muted">
            Untuk akun yang masuk dengan email &amp; password.
            {googleConfigured()
              ? " Jika akun Anda dibuat khusus untuk Masuk dengan Google (tanpa password), Anda tidak memerlukan password di sini — keamanan login diatur oleh akun Google Anda. Bila ingin juga bisa masuk dengan email & password, minta Super Admin mengatur password awal di Pengguna & Peran."
              : " Jika akun Anda dibuat tanpa password, minta Super Admin mengatur password awal di Pengguna & Peran."}
          </p>
          <ChangePasswordForm />
        </section>
      </div>
    </div>
  );
}
