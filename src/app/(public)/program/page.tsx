import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import { ProgramCard } from "@/components/public/cards";
import { Container, PageHero } from "@/components/public/page-hero";
import { PeriodSwitcher } from "@/components/public/period-switcher";
import { EmptyState } from "@/components/ui/empty-state";
import { listPublicDivisions, listPublicPrograms, resolvePeriod } from "@/lib/queries/public";

export const metadata: Metadata = { title: "Program Kerja" };
export const dynamic = "force-dynamic";

export default async function ProgramPage({ searchParams }: { searchParams: Promise<{ periode?: string; divisi?: string }> }) {
  const sp = await searchParams;
  const { period, all } = await resolvePeriod(sp.periode);
  const divisions = period ? await listPublicDivisions(period.id) : [];
  const programs = period ? await listPublicPrograms(period.id, sp.divisi) : [];
  const qs = (d?: string) => { const p = new URLSearchParams(); if (sp.periode) p.set("periode", sp.periode); if (d) p.set("divisi", d); const s = p.toString(); return `/program${s ? `?${s}` : ""}`; };

  return (
    <>
      <PageHero eyebrow="Program kerja" title="Program kerja organisasi" description="Seluruh program dikelompokkan per periode kepengurusan, sehingga jejak kerja tiap periode tetap utuh.">
        <PeriodSwitcher periods={all} current={period?.id ?? null} basePath="/program" extra={{ divisi: sp.divisi }} />
      </PageHero>
      <Container className="pb-8">
        {divisions.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter divisi">
            <Link href={qs()} className={clsx("rounded-full px-4 py-2 text-xs font-semibold ring-1 ring-inset", !sp.divisi ? "bg-brown-800 text-white ring-brown-800" : "bg-white text-brown-800 ring-brown-300")}>Semua divisi</Link>
            {divisions.map((d) => (
              <Link key={d.id} href={qs(d.id)} className={clsx("rounded-full px-4 py-2 text-xs font-semibold ring-1 ring-inset", sp.divisi === d.id ? "bg-brown-800 text-white ring-brown-800" : "bg-white text-brown-800 ring-brown-300")}>{d.name}</Link>
            ))}
          </div>
        )}
        {programs.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{programs.map((p) => <ProgramCard key={p.id} {...p} />)}</div>
        ) : (
          <EmptyState title={period ? "Belum ada program kerja yang ditambahkan untuk periode ini." : "Belum ada periode kepengurusan."} hint="Program kerja akan tampil di sini setelah ditambahkan pengurus melalui dashboard." />
        )}
      </Container>
    </>
  );
}
