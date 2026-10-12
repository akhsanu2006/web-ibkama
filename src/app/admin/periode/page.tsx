import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { setActivePeriod, archivePeriod } from "@/lib/actions/period";
import { requirePagePermission } from "@/lib/auth/dal";
import { db, schema } from "@/db";

export const metadata: Metadata = { title: "Periode" };

export default async function PeriodListPage() {
  const user = await requirePagePermission("period", "read");
  const isSuper = user.role === "super_admin";
  const periods = await db.select().from(schema.periods).orderBy(desc(schema.periods.startYear));

  return (
    <div>
      <AdminPageHeader title="Kelola Periode" description="Setiap periode adalah wadah data organisasi (anggota, program, arsip, dokumentasi). Periode lama tidak pernah dihapus, hanya diarsipkan."
        actions={isSuper ? <ButtonLink href="/admin/periode/new">Buat Periode</ButtonLink> : undefined} />

      {periods.length === 0 ? (
        <EmptyState title="Belum ada periode." hint="Buat periode kepengurusan pertama untuk mulai mengisi data organisasi." action={isSuper ? { href: "/admin/periode/new", label: "Buat Periode" } : undefined} />
      ) : (
        <ul className="space-y-4">
          {periods.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-6 ring-1 ring-line shadow-soft">
              <div>
                <div className="flex items-center gap-3">
                  <p className="font-heading text-xl font-bold text-green-950">{p.name}</p>
                  <StatusBadge status={p.status} />
                </div>
                {p.description && <p className="mt-1.5 max-w-lg text-sm text-muted">{p.description}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isSuper && (
                  <>
                    <Link href={`/admin/periode/${p.id}`} className="rounded-full px-4 py-2 text-[13px] font-semibold text-green-800 ring-1 ring-inset ring-green-200 hover:bg-green-50">Ubah</Link>
                    {p.status !== "active" && (
                      <form action={setActivePeriod.bind(null, p.id)}>
                        <Button type="submit" size="sm" variant="secondary">Jadikan Aktif</Button>
                      </form>
                    )}
                    {p.status === "active" && (
                      <form action={archivePeriod.bind(null, p.id)}>
                        <Button type="submit" size="sm" variant="ghost">Arsipkan</Button>
                      </form>
                    )}
                  </>
                )}
                {!isSuper && <Badge tone="gray">Hanya Super Admin dapat mengubah</Badge>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
