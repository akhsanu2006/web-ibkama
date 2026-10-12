import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import { NewsCard } from "@/components/public/news-card";
import { Container, PageHero } from "@/components/public/page-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { listPublicNews } from "@/lib/queries/public";

export const metadata: Metadata = { title: "Berita & Prestasi" };
export const dynamic = "force-dynamic";

const TABS = [
  { value: "", label: "Semua" },
  { value: "kabar", label: "Kabar terbaru" },
  { value: "prestasi", label: "Prestasi" },
  { value: "rekognisi", label: "Rekognisi" },
];

export default async function BeritaPage({ searchParams }: { searchParams: Promise<{ kategori?: string }> }) {
  const { kategori = "" } = await searchParams;
  const current = TABS.some((t) => t.value === kategori) ? kategori : "";
  const items = await listPublicNews({ category: current || null });

  return (
    <>
      <PageHero eyebrow="Berita" title="Kabar, prestasi, dan rekognisi" description="Cerita terbaru dari anak-anak IBKAMA — capaian, penghargaan, dan kabar kegiatan yang patut dirayakan bersama.">
        <nav aria-label="Kategori berita" className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Link key={t.value} href={t.value ? `/berita?kategori=${t.value}` : "/berita"} aria-current={t.value === current ? "true" : undefined}
              className={clsx("rounded-full px-4 py-2 text-[13px] font-semibold ring-1 ring-inset transition",
                t.value === current ? "bg-green-800 text-white ring-green-800" : "bg-white text-green-900 ring-green-200 hover:bg-green-50")}>
              {t.label}
            </Link>
          ))}
        </nav>
      </PageHero>
      <Container className="pb-8">
        {items.length ? (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((n) => <li key={n.id}><NewsCard n={n} /></li>)}
          </ul>
        ) : (
          <EmptyState title={current ? "Belum ada berita pada kategori ini." : "Belum ada berita yang diterbitkan."} hint="Berita, prestasi, dan rekognisi akan tampil di sini setelah pengurus menuliskannya melalui dashboard." />
        )}
      </Container>
    </>
  );
}
