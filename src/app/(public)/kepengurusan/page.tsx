import type { Metadata } from "next";
import { Container, PageHero } from "@/components/public/page-hero";
import { OrgChart } from "@/components/public/org-chart";
import { PeriodSwitcher } from "@/components/public/period-switcher";
import { Timeline } from "@/components/public/timeline";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { getOrgChart, listLeadership, resolvePeriod } from "@/lib/queries/public";

export const metadata: Metadata = { title: "Kepengurusan & Ketua Umum" };
export const dynamic = "force-dynamic";

/** Kepengurusan + Ketua Umum (dulu halaman terpisah /leadership) dalam satu halaman. */
export default async function KepengurusanPage({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  const sp = await searchParams;
  const { period, all } = await resolvePeriod(sp.periode);
  const [chart, leadership] = await Promise.all([period ? getOrgChart(period.id) : null, listLeadership()]);
  const ketua = chart?.ketua[0] ?? (chart?.fallbackKetum ? { name: chart.fallbackKetum.name, photoUrl: chart.fallbackKetum.photoUrl } : null);

  return (
    <>
      <PageHero eyebrow="Kepengurusan" title="Struktur & kepemimpinan" description="Bagan organisasi per periode dan estafet Ketua Umum IBKAMA UMY dari masa ke masa. Hanya informasi yang memang ditujukan untuk publik yang ditampilkan.">
        <div className="space-y-4">
          <PeriodSwitcher periods={all} current={period?.id ?? null} basePath="/kepengurusan" />
          <nav aria-label="Bagian halaman" className="flex flex-wrap gap-2">
            {[{ href: "#bagan", label: "Bagan organisasi" }, { href: "#ketum", label: "Ketua Umum lintas periode" }].map((l) => (
              <a key={l.href} href={l.href} className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-green-800 ring-1 ring-inset ring-green-200 transition hover:bg-green-50">{l.label}</a>
            ))}
          </nav>
        </div>
      </PageHero>

      <section id="bagan" className="scroll-mt-24 pb-20">
        <Container>
          <Reveal>
            <SectionHeader eyebrow={period ? `Periode ${period.name}` : "Bagan organisasi"} title="Bagan organisasi" description="Ketua Umum, pengurus inti, serta kepala divisi, sekretaris divisi, dan anggota tiap divisi." />
          </Reveal>
          <div className="mt-12">
            {!chart || (chart.total === 0 && !ketua) ? (
              <EmptyState title="Belum ada data kepengurusan untuk periode ini." hint="Bagan akan terisi otomatis setelah pengurus ditambahkan melalui dashboard → Anggota & Pengurus (pilih jabatan dan divisinya)." />
            ) : (
              <Reveal><OrgChart ketua={ketua} inti={chart.inti} divisions={chart.divisions} /></Reveal>
            )}
          </div>
        </Container>
      </section>

      <section id="ketum" className="scroll-mt-24 bg-green-50/60 py-20">
        <Container>
          <Reveal><SectionHeader eyebrow="Leadership" title="Ketua Umum lintas periode" description="Estafet kepemimpinan IBKAMA UMY dari periode ke periode." /></Reveal>
          <div className="mt-12">
            {leadership.length ? (
              <Timeline items={leadership.map((l) => ({ id: l.id, periodName: l.periodName, chairName: l.chairName, photoUrl: l.photoUrl, profile: l.profile, achievements: l.achievements, periodInfo: l.periodInfo, documentationUrl: l.documentationUrl, isActive: l.periodStatus === "active" }))} />
            ) : (
              <EmptyState title="Belum ada riwayat Ketua Umum yang ditambahkan." hint="Admin dapat menambahkannya melalui dashboard → Riwayat Ketua Umum." />
            )}
          </div>
        </Container>
      </section>
    </>
  );
}
