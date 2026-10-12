import type { Metadata } from "next";
import Link from "next/link";
import { Archive, ArrowUpRight } from "lucide-react";
import { Container, PageHero } from "@/components/public/page-hero";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { periodSlug } from "@/lib/period";
import { archiveOverview } from "@/lib/queries/public";

export const metadata: Metadata = { title: "Arsip Organisasi" };
export const dynamic = "force-dynamic";

export default async function ArsipPage() {
  const { periods, cats, counts } = await archiveOverview();
  return (
    <>
      <PageHero eyebrow="Arsip organisasi" title="Memori digital IBKAMA" description="Arsip disusun per periode dan kategori. Periode lama tetap tersimpan dan dapat ditelusuri kapan saja." />
      <Container className="pb-8">
        {periods.length === 0 ? (
          <EmptyState title="Belum ada arsip." hint="Arsip terbentuk otomatis seiring periode dibuat dan datanya ditambahkan melalui dashboard." />
        ) : (
          <ul className="grid gap-5 md:grid-cols-2">
            {periods.map((p) => (
              <li key={p.id}>
                <Link href={`/arsip/${periodSlug(p.name)}`} className="group block rounded-3xl bg-white p-7 ring-1 ring-line shadow-soft transition duration-500 hover:-translate-y-1 hover:shadow-lift">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-green-100 text-green-800"><Archive size={20} aria-hidden /></span><span className="font-heading text-2xl font-bold text-green-900">{p.name}</span></span>
                    <ArrowUpRight size={20} className="text-muted transition group-hover:text-green-700" aria-hidden />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {p.status === "active" && <Badge tone="gold">Periode aktif</Badge>}
                    {cats.map((c) => {
                      const n = counts.find((x) => x.periodId === p.id && x.categoryId === c.id)?.n ?? 0;
                      return <Badge key={c.id} tone={Number(n) ? "green" : "gray"}>{c.name}{Number(n) ? ` · ${n}` : ""}</Badge>;
                    })}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
