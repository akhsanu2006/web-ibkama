import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DeleteButton } from "@/components/admin/delete-button";
import { ResourceForm } from "@/components/admin/resource-form";
import { deleteResource, saveResource } from "@/lib/actions/resource";
import { requirePagePermission } from "@/lib/auth/dal";
import { can } from "@/lib/permissions";
import { getLookups, getRecord } from "@/lib/queries/admin";
import { bySlug } from "@/lib/resources/registry";

type Props = { params: Promise<{ resource: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const def = bySlug((await params).resource);
  return { title: def ? `Ubah ${def.singular}` : "Ubah data" };
}

export default async function ResourceEditPage({ params }: Props) {
  const { resource, id } = await params;
  const def = bySlug(resource);
  if (!def) notFound();
  const user = await requirePagePermission(def.permission, "update");
  const row = await getRecord(def, id);
  if (!row) notFound();
  const canDelete = can(user.role, def.permission, "delete", user.permissions);
  const nameCol = def.columns[0]?.name ?? "name";

  return (
    <div>
      <AdminPageHeader title={`Ubah ${def.singular}`} description={def.description}
        actions={canDelete ? <DeleteButton action={deleteResource.bind(null, resource, id)} itemName={String(row[nameCol] ?? "data ini")} /> : undefined} />
      <ResourceForm action={saveResource.bind(null, resource, id)} fields={def.fields} values={row} lookups={await getLookups()} cancelHref={`/admin/${resource}`} submitLabel="Simpan Perubahan" />
    </div>
  );
}
