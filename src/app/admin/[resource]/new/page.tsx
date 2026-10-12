import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ResourceForm } from "@/components/admin/resource-form";
import { requirePagePermission } from "@/lib/auth/dal";
import { adminPeriod, getLookups } from "@/lib/queries/admin";
import { bySlug } from "@/lib/resources/registry";

type Props = { params: Promise<{ resource: string }>; searchParams: Promise<{ periode?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const def = bySlug((await params).resource);
  return { title: def ? def.addLabel : "Tambah data" };
}

export default async function ResourceNewPage({ params, searchParams }: Props) {
  const { resource } = await params;
  const def = bySlug(resource);
  if (!def) notFound();
  await requirePagePermission(def.permission, "create");
  const { periode } = await searchParams;

  const [lookups, period] = await Promise.all([getLookups(), def.periodScoped ? adminPeriod(periode) : null]);
  const defaults: Record<string, unknown> = {};
  if (def.periodScoped) defaults.periodId = period?.current?.id ?? "";

  return (
    <div>
      <AdminPageHeader title={def.addLabel} description={def.description} />
      <ResourceForm slug={resource} id={null} fields={def.fields} values={defaults} lookups={lookups} cancelHref={`/admin/${resource}`} submitLabel="Simpan" />
    </div>
  );
}
