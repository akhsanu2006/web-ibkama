import type { Metadata } from "next";
import Image from "next/image";
import { Container, PageHero } from "@/components/public/page-hero";
import { PeriodSwitcher } from "@/components/public/period-switcher";
import { EmptyState } from "@/components/ui/empty-state";
import { listPublicGallery, resolvePeriod } from "@/lib/queries/public";

export const metadata: Metadata = { title: "Dokumentasi" };
export const dynamic = "force-dynamic";

export default async function DokumentasiPage({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  const sp = await searchParams;
  const { period, all } = await resolvePeriod(sp.periode);
  const items = period ? await listPublicGallery(period.id) : [];
  return (
    <>
      <PageHero eyebrow="Dokumentasi" title="Jejak kegiatan dalam gambar" description="Dokumentasi kegiatan IBKAMA, dikelompokkan per periode.">
        <PeriodSwitcher periods={all} current={period?.id ?? null} basePath="/dokumentasi" />
      </PageHero>
      <Container className="pb-8">
        {items.length ? (
          <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {items.map((g) => (
              <li key={g.id} className="mb-4 break-inside-avoid overflow-hidden rounded-3xl bg-white ring-1 ring-line shadow-soft">
                <Image src={g.url} alt={g.title ?? g.caption ?? "Dokumentasi kegiatan"} width={800} height={600} className="h-auto w-full" unoptimized />
                {(g.title || g.caption || g.programName) && (
                  <div className="p-4"><p className="font-semibold text-green-950">{g.title ?? g.programName}</p>{g.caption && <p className="mt-1 text-sm text-muted">{g.caption}</p>}</div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Belum ada dokumentasi." hint="Foto kegiatan akan tampil di sini setelah diunggah pengurus melalui dashboard." />
        )}
      </Container>
    </>
  );
}
