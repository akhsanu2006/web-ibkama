import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { OrganizationForm } from "@/components/admin/organization-form";
import { requirePagePermission } from "@/lib/auth/dal";
import { getOrganization } from "@/lib/queries/public";

export const metadata: Metadata = { title: "Profil Organisasi" };
export const dynamic = "force-dynamic";

export default async function OrganizationPage() {
  await requirePagePermission("organization", "update");
  const org = await getOrganization();
  if (!org) {
    return (
      <div>
        <AdminPageHeader title="Profil Organisasi" />
        <p className="text-sm text-danger">Data organisasi tidak ditemukan. Jalankan <code>npm run db:seed</code> untuk mengisi data awal.</p>
      </div>
    );
  }
  return (
    <div>
      <AdminPageHeader title="Profil Organisasi" description="Identitas resmi yang tampil di seluruh halaman publik. Perubahan langsung berlaku setelah disimpan." />
      <OrganizationForm org={org} />
    </div>
  );
}
