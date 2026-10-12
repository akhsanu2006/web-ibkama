import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { IntegrationForm } from "@/components/admin/integration-form";
import { updateIntegration } from "@/lib/actions/integrations";
import { requirePagePermission } from "@/lib/auth/dal";
import { getIntegrations } from "@/lib/queries/public";

export const metadata: Metadata = { title: "Integrasi" };
export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  await requirePagePermission("integration", "update");
  const integrations = await getIntegrations();

  return (
    <div>
      <AdminPageHeader title="Integrasi Eksternal" description="Website ini adalah pusat digital yang terhubung ke sistem yang sudah dipakai organisasi. Tidak ada kredensial API yang disimpan di sini — hanya tautan publik." />
      <div className="grid gap-5 md:grid-cols-2">
        {integrations.map((i) => <IntegrationForm key={i.key} integration={i} action={updateIntegration.bind(null, i.key)} />)}
      </div>
    </div>
  );
}
