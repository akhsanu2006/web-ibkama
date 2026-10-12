import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SiteMediaCard } from "@/components/admin/site-media-card";
import { SITE_MEDIA } from "@/content/site-media";
import { requirePagePermission } from "@/lib/auth/dal";
import { can } from "@/lib/permissions";
import { getSiteMedia } from "@/lib/queries/site-media";

export const metadata: Metadata = { title: "Foto & Video Situs" };
export const dynamic = "force-dynamic";

export default async function SiteMediaPage() {
  const user = await requirePagePermission("site_media", "read");
  const current = await getSiteMedia();
  const canEdit = can(user.role, "site_media", "update", user.permissions);
  const pages = [...new Set(SITE_MEDIA.map((s) => s.page))];

  return (
    <div>
      <AdminPageHeader title="Foto & Video Situs" description="Ganti foto dan video yang tampil di halaman publik. Perubahan langsung terlihat di website; berkas bawaan tetap tersimpan sehingga selalu bisa dikembalikan." />
      <div className="space-y-12">
        {pages.map((page) => (
          <section key={page}>
            <h2 className="mb-4 text-lg">Halaman {page}</h2>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {SITE_MEDIA.filter((s) => s.page === page).map((s) => (
                <SiteMediaCard key={s.key} slot={s} url={current[s.key].url} custom={current[s.key].custom} canEdit={canEdit} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
