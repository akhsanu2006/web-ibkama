import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AccessButton } from "@/components/admin/access-button";
import { DeleteButton } from "@/components/admin/delete-button";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { deleteUser, restoreAccess, revokeAccess } from "@/lib/actions/users";
import { requirePagePermission } from "@/lib/auth/dal";
import { googleConfigured } from "@/lib/auth/google";
import { ADMIN_POSITIONS } from "@/lib/permissions";
import { adminPeriod, listUsers } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Pengguna & Peran" };
export const dynamic = "force-dynamic";

const posLabel = (v: string | null) => ADMIN_POSITIONS.find((p) => p.value === v)?.label ?? null;

type Row = Awaited<ReturnType<typeof listUsers>>[number];

/** Status akses efektif: dicopot (nonaktif), berakhir (periode Admin tidak lagi aktif), atau aktif. */
function accessState(u: Row): { label: string; tone: "green" | "gray" | "brown" } {
  if (!u.isActive) return { label: "Dicopot", tone: "gray" };
  if (u.role === "admin" && u.periodStatus !== "active") return { label: "Periode berakhir", tone: "brown" };
  return { label: "Aktif", tone: "green" };
}

export default async function UsersPage() {
  const me = await requirePagePermission("user", "read");
  const [users, period] = await Promise.all([listUsers(), adminPeriod(undefined)]);
  const active = period.all.find((p) => p.status === "active") ?? null;

  return (
    <div>
      <AdminPageHeader title="Pengguna & Peran" description="Tambah, copot, atau hapus akses Admin dan Super Admin. Hanya Super Admin yang dapat membuka halaman ini."
        actions={<ButtonLink href="/admin/pengguna/new">Tambah Pengguna</ButtonLink>} />

      <div className={`mb-4 rounded-3xl px-6 py-4 text-sm ring-1 ${active ? "bg-green-50 text-green-900 ring-green-100" : "bg-brown-100 text-brown-800 ring-brown-300/40"}`}>
        {active ? (
          <>Akses <strong>Admin</strong> terikat pada periode aktif <strong>{active.name}</strong>. Saat periode baru diaktifkan, Admin periode lama otomatis tidak bisa masuk lagi — tekan <strong>Aktifkan</strong> untuk memperpanjang aksesnya. Super Admin tidak dibatasi periode.</>
        ) : (
          <>Belum ada periode berstatus <strong>aktif</strong>, sehingga akun Admin belum bisa dibuat maupun masuk. Aktifkan periode di <Link href="/admin/periode" className="font-semibold underline">Kelola Periode</Link>.</>
        )}
      </div>

      <div className={`mb-6 rounded-3xl px-6 py-4 text-sm ring-1 ${googleConfigured() ? "bg-green-50 text-green-900 ring-green-100" : "bg-brown-100 text-brown-800 ring-brown-300/40"}`}>
        {googleConfigured() ? (
          <>Masuk dengan Google <strong>aktif</strong>. Hanya email yang terdaftar & aktif di daftar ini yang bisa masuk — akun Google lain otomatis ditolak.</>
        ) : (
          <>Masuk dengan Google <strong>belum dikonfigurasi</strong> — sementara pengguna masuk dengan email & password. Untuk mengaktifkan, isi <code>GOOGLE_CLIENT_ID</code> dan <code>GOOGLE_CLIENT_SECRET</code> di environment server (lihat README).</>
        )}
      </div>

      <div className="overflow-x-auto rounded-3xl bg-white ring-1 ring-line shadow-soft">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wider text-muted">
              <th className="px-5 py-4">Nama</th><th className="px-5 py-4">Email</th><th className="px-5 py-4">Peran</th><th className="px-5 py-4">Periode akses</th><th className="px-5 py-4">Status</th><th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const st = accessState(u);
              const isMe = u.id === me.id;
              return (
                <tr key={u.id} className="border-b border-line/70 last:border-0 hover:bg-green-50/40">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-ink">{u.name}{isMe && <span className="ml-2 text-xs text-muted">(Anda)</span>}</p>
                    {posLabel(u.adminPosition) && <p className="text-xs text-muted">{posLabel(u.adminPosition)}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-muted">{u.email}</td>
                  <td className="px-5 py-3.5"><Badge tone={u.role === "super_admin" ? "gold" : "green"}>{u.role === "super_admin" ? "Super Admin" : "Admin"}</Badge></td>
                  <td className="px-5 py-3.5 text-muted">{u.role === "super_admin" ? "Semua periode" : (u.periodName ?? "—")}</td>
                  <td className="px-5 py-3.5"><Badge tone={st.tone}>{st.label}</Badge></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {!isMe && (st.label === "Aktif"
                        ? <AccessButton action={revokeAccess.bind(null, u.id)} kind="revoke" itemName={u.name} />
                        : <AccessButton action={restoreAccess.bind(null, u.id)} kind="restore" itemName={u.name} />)}
                      <Link href={`/admin/pengguna/${u.id}`} aria-label={`Ubah ${u.name}`} className="grid size-9 place-items-center rounded-full text-green-800 hover:bg-green-50"><Pencil size={15} aria-hidden /></Link>
                      {!isMe && <DeleteButton action={deleteUser.bind(null, u.id)} itemName={u.name} iconOnly />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
