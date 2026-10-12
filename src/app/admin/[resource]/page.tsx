import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPeriodSwitcher } from "@/components/admin/period-switcher";
import { ResourceTable } from "@/components/admin/resource-table";
import { SearchBox } from "@/components/admin/search-box";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePagePermission } from "@/lib/auth/dal";
import { can } from "@/lib/permissions";
import { adminPeriod, getLookups, listRows } from "@/lib/queries/admin";
import { bySlug } from "@/lib/resources/registry";

type Props = { params: Promise<{ resource: string }>; searchParams: Promise<{ periode?: string; q?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const def = bySlug((await params).resource);
  return { title: def ? def.label : "Modul" };
}

export default async function ResourceListPage({ params, searchParams }: Props) {
  const { resource } = await params;
  const def = bySlug(resource);
  if (!def) notFound();
  const { q, periode } = await searchParams;

  const user = await requirePagePermission(def.permission, "read");
  const canCreate = can(user.role, def.permission, "create", user.permissions);
  const canUpdate = can(user.role, def.permission, "update", user.permissions);
  const canDelete = can(user.role, def.permission, "delete", user.permissions);

  const period = def.periodScoped ? await adminPeriod(periode) : null;
  const [rows, lookups] = await Promise.all([
    listRows(def, { periodId: period ? (period.showAll ? undefined : period.current?.id) : undefined, q }),
    getLookups(),
  ]);

  const nameCol = def.columns[0]?.name ?? "name";

  return (
    <div>
      <AdminPageHeader title={def.label} description={def.description}
        actions={canCreate ? <ButtonLink href={`/admin/${resource}/new`}>{def.addLabel}</ButtonLink> : undefined} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        {period && period.all.length > 0
          ? <AdminPeriodSwitcher periods={period.all} current={period.current?.id ?? null} showAll={period.showAll} basePath={`/admin/${resource}`} extra={{ q }} />
          : <span />}
        {def.searchColumn && <SearchBox q={q} placeholder={`Cari ${def.label.toLowerCase()}…`} keep={{ periode }} />}
      </div>

      {def.periodScoped && period?.all.length === 0 ? (
        <EmptyState title="Belum ada periode." hint="Buat periode kepengurusan terlebih dahulu di menu Periode sebelum menambahkan data ini." action={{ href: "/admin/periode", label: "Kelola Periode" }} />
      ) : rows.length === 0 ? (
        <EmptyState title={`Belum ada data ${def.label.toLowerCase()}.`} hint={def.emptyHint} action={canCreate ? { href: `/admin/${resource}/new`, label: def.addLabel } : undefined} />
      ) : (
        <ResourceTable
          slug={resource}
          columns={def.columns}
          rows={rows}
          lookups={lookups}
          canUpdate={canUpdate}
          canDelete={canDelete}
          rowLabel={(r) => String(r[nameCol] ?? "data ini")}
        />
      )}
    </div>
  );
}
