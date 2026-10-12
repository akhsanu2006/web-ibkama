import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { FileText } from "lucide-react";
import { Container, PageHero } from "@/components/public/page-hero";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { listArchiveCategories, listPublicArchive, resolvePeriod } from "@/lib/queries/public";
import { periodSlug } from "@/lib/period";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ periode: string }>; searchParams: Promise<{ kategori?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Arsip ${(await params).periode.replace("-", "/")}` };
}

export default async function ArsipPeriode({ params, searchParams }: Props) {
  const slug = (await params).periode;
  const { kategori } = await searchParams;
  const { all } = await resolvePeriod(slug);
  const period = all.find((p) => periodSlug(p.name) === slug);
  if (!period) notFound();
  const [cats, data] = await Promise.all([listArchiveCategories(), listPublicArchive(period.id, kategori)]);
  const base = `/arsip/${slug}`;

  return (
    <>
      <PageHero eyebrow="Arsip organisasi" title={`Periode ${period.name}`} description={period.description ?? undefined}>
        {period.status === "active" ? <Badge tone="gold">Periode aktif</Badge> : <Badge tone="brown">Diarsipkan</Badge>}
      </PageHero>
      <Container className="pb-8">
        <div className="mb-10 flex flex-wrap gap-2" role="group" aria-label="Filter kategori">
          <Link href={base} className={clsx("rounded-full px-4 py-2 text-xs font-semibold ring-1 ring-inset", !kategori ? "bg-green-800 text-white ring-green-800" : "bg-white ring-green-200 text-green-900")}>Semua</Link>
          {cats.map((c) => <Link key={c.id} href={`${base}?kategori=${c.id}`} className={clsx("rounded-full px-4 py-2 text-xs font-semibold ring-1 ring-inset", kategori === c.id ? "bg-green-800 text-white ring-green-800" : "bg-white ring-green-200 text-green-900")}>{c.name}</Link>)}
        </div>
        {data.entries.length + data.documents.length === 0 ? (
          <EmptyState title="Belum ada arsip untuk periode/kategori ini." hint="Arsip akan tampil di sini setelah ditambahkan pengurus melalui dashboard." />
        ) : (
          <div className="space-y-12">
            {data.entries.length > 0 && (
              <ul className="grid gap-4 md:grid-cols-2">
                {data.entries.map((e) => (
                  <li key={e.id} className="rounded-3xl bg-white p-6 ring-1 ring-line shadow-soft">
                    <Badge tone="brown">{e.categoryName}</Badge>
                    <h3 className="mt-3 text-lg">{e.title}</h3>
                    {e.description && <p className="mt-2 text-sm leading-relaxed text-muted">{e.description}</p>}
                  </li>
                ))}
              </ul>
            )}
            {data.documents.length > 0 && (
              <section><h2 className="text-xl">Dokumen publik</h2>
                <ul className="mt-4 divide-y divide-line rounded-3xl bg-white ring-1 ring-line">
                  {data.documents.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-4 p-5">
                      <div className="flex min-w-0 items-center gap-3"><FileText size={18} className="shrink-0 text-green-700" aria-hidden /><div className="min-w-0"><p className="truncate font-semibold text-green-950">{d.title}</p>{d.categoryName && <p className="text-xs text-muted">{d.categoryName}</p>}</div></div>
                      {d.href && <a href={d.href} target="_blank" rel="noopener noreferrer" className="shrink-0 text-sm font-semibold text-green-700 hover:underline">Buka</a>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
        <div className="mt-12"><Link href="/arsip" className="text-sm font-semibold text-green-700 hover:underline">← Semua periode</Link></div>
      </Container>
    </>
  );
}
