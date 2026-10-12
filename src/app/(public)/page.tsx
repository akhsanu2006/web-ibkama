import Link from "next/link";
import { ArrowRight, BookOpen, Users } from "lucide-react";
import { ScrollVideo } from "@/components/cinematic/scroll-video";
import { ProgramCard } from "@/components/public/cards";
import { ExploreGrid } from "@/components/public/explore-grid";
import { HighlightsBand } from "@/components/public/highlights-band";
import { NewsCard } from "@/components/public/news-card";
import { LogoScrollSection } from "@/components/public/logo-coin";
import { Container } from "@/components/public/page-hero";
import { Timeline } from "@/components/public/timeline";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { getActivePeriod, getOrganization, homeSummary, listHighlights, listPublicNews } from "@/lib/queries/public";
import { cinematicWithSiteMedia, getSiteMedia } from "@/lib/queries/site-media";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [org, period] = await Promise.all([getOrganization(), getActivePeriod()]);
  // foto/video bisa diganti dari dashboard → Media Situs
  const [{ programs, memberCount, leadership }, highlights, news, CINEMATIC, siteMedia] = await Promise.all([
    homeSummary(period?.id ?? null), listHighlights(), listPublicNews({ limit: 3 }), cinematicWithSiteMedia(), getSiteMedia(),
  ]);

  return (
    <>
      {/* 01 — Sinematik #1: UMY → IBKAMA */}
      <ScrollVideo cfg={CINEMATIC.opening} />

      {/* 02 — Identitas */}
      <LogoScrollSection videoSrc={siteMedia["logo.video"].url ?? undefined}>
        <p className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-brown-600">
          <span className="h-px w-6 bg-gold" aria-hidden />Ikatan Beasiswa Kader Muhammadiyah
        </p>
        <h1 className="text-4xl leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl">
          Bersahaja,<br />Berkarya,<br /><span className="text-green-700">Berjaya.</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted md:mt-7 md:text-lg">
          {org?.shortName ?? "IBKAMA UMY"} adalah wadah pembinaan dan pengembangan kader penerima Beasiswa Kader Muhammadiyah di Universitas Muhammadiyah Yogyakarta — tempat tumbuh bersama, menjaga amanah, dan berkontribusi nyata.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 md:mt-9">
          <ButtonLink href="/profil" size="lg">Kenali IBKAMA <ArrowRight size={16} /></ButtonLink>
          <ButtonLink href="/kontak" variant="secondary" size="lg">Hubungi kami</ButtonLink>
        </div>
      </LogoScrollSection>

      {/* 02b — Navigasi utama sebagai kotak (pengganti bar navigasi atas) */}
      <ExploreGrid />

      {/* 03 — Periode berjalan */}
      <section className="bg-green-50/60 py-20">
        <Container>
          <Reveal>
            <div className="grid gap-8 rounded-[2rem] bg-green-900 p-8 text-white md:grid-cols-[1.3fr_1fr] md:p-12">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">Periode kepengurusan</p>
                {period ? (
                  <>
                    <p className="mt-3 font-heading text-5xl font-bold md:text-6xl">{period.name}</p>
                    <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75">{period.description ?? "Periode kepengurusan yang sedang berjalan."}</p>
                  </>
                ) : (
                  <>
                    <p className="mt-3 font-heading text-3xl font-bold">Belum ada periode aktif</p>
                    <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75">Super Admin dapat membuat dan mengaktifkan periode dari dashboard.</p>
                  </>
                )}
              </div>
              <div className="flex flex-col justify-end gap-3">
                {memberCount > 0 && <p className="flex items-center gap-3 text-sm text-white/85"><Users size={18} className="text-gold" aria-hidden /><span><strong className="font-heading text-xl">{memberCount}</strong> pengurus terdaftar</span></p>}
                <Link href="/kepengurusan" className="group inline-flex items-center gap-2 text-sm font-semibold text-white">Lihat struktur kepengurusan <ArrowRight size={16} className="transition group-hover:translate-x-1" /></Link>
                <Link href="/arsip" className="group inline-flex items-center gap-2 text-sm font-semibold text-white/80">Jelajahi periode sebelumnya <ArrowRight size={16} className="transition group-hover:translate-x-1" /></Link>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* 03b — IBKAMA dalam angka */}
      <HighlightsBand items={highlights} />

      {/* 04 — Program kerja */}
      <section className="py-24">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeader eyebrow="Program kerja" title="Gerak nyata untuk kader dan masyarakat" description="Program yang dirancang untuk membina, mengembangkan, dan menghadirkan manfaat." />
            <Link href="/program" className="text-sm font-semibold text-green-700 hover:underline">Semua program →</Link>
          </div>
          <div className="mt-10">
            {programs.length ? (
              <div className="grid gap-5 md:grid-cols-3">{programs.map((p, i) => <Reveal key={p.id} delay={i * 80}><ProgramCard {...p} /></Reveal>)}</div>
            ) : (
              <EmptyState title="Belum ada program kerja yang ditambahkan untuk periode ini." hint="Program kerja akan tampil di sini setelah pengurus menambahkannya melalui dashboard." />
            )}
          </div>
        </Container>
      </section>

      {/* 06 — Nilai organisasi */}
      <section className="py-24">
        <Container>
          <SectionHeader eyebrow="Nilai organisasi" title="Tujuh nilai yang kami rawat" align="center" />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {org?.values.map((v, i) => (
              <Reveal key={v.title} delay={i * 50}>
                <li className="h-full rounded-3xl bg-white p-6 ring-1 ring-line transition duration-500 hover:-translate-y-1 hover:shadow-lift">
                  <span className="font-heading text-sm font-bold text-gold">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-3 text-lg">{v.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted">{v.description}</p>
                </li>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      {/* 08 — Sinematik #2: hero + laptop */}
      <ScrollVideo cfg={CINEMATIC.hero} />

      {/* 09 — Arsip & riwayat */}
      <section className="bg-white py-24">
        <Container className="grid items-center gap-12 md:grid-cols-2">
          <Reveal>
            <SectionHeader eyebrow="Arsip organisasi" title="Memori digital yang tidak hilang saat periode berganti" description="Arsip, dokumen, dan dokumentasi tersimpan rapi pada setiap program kerja, per periode — siap ditelusuri kapan saja." />
            <div className="mt-8"><ButtonLink href="/program" variant="secondary"><BookOpen size={16} /> Jelajahi program kerja</ButtonLink></div>
          </Reveal>
          <Reveal delay={100}>
            <ul className="grid grid-cols-2 gap-3 text-sm font-semibold text-green-900">
              {["Kepengurusan", "Program Kerja", "Dokumentasi", "Dokumen"].map((c) => (
                <li key={c} className="rounded-2xl bg-green-50 px-5 py-6 ring-1 ring-green-100">{c}</li>
              ))}
              <li className="rounded-2xl bg-brown-100 px-5 py-6 text-brown-800 ring-1 ring-brown-300/40">…dan terus bertambah</li>
            </ul>
          </Reveal>
        </Container>
      </section>

      {/* 10 — Ketua umum lintas periode */}
      <section className="bg-green-50/60 py-24">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeader eyebrow="Leadership" title="Ketua Umum lintas periode" description="Estafet kepemimpinan IBKAMA dari masa ke masa." />
            <Link href="/kepengurusan#ketum" className="text-sm font-semibold text-green-700 hover:underline">Lihat riwayat →</Link>
          </div>
          <div className="mt-12">
            {leadership.length ? (
              <Timeline items={leadership.map((l) => ({ id: l.id, periodName: l.periodName, chairName: l.chairName, photoUrl: l.photoUrl, profile: l.profile, achievements: l.achievements, periodInfo: l.periodInfo, documentationUrl: l.documentationUrl, isActive: l.periodStatus === "active" }))} />
            ) : (
              <EmptyState title="Belum ada riwayat Ketua Umum yang ditambahkan." hint="Riwayat kepemimpinan akan tampil sebagai timeline setelah diisi melalui dashboard." />
            )}
          </div>
        </Container>
      </section>

      {/* 11 — Sinematik #3: keilmuan lintas jurusan */}
      <ScrollVideo cfg={CINEMATIC.knowledge} />

      {/* 11b — Berita, prestasi & rekognisi */}
      <section className="bg-green-50/60 py-24">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeader eyebrow="Berita" title="Kabar & prestasi anak IBKAMA" description="Capaian, penghargaan, dan kabar terbaru dari keluarga besar IBKAMA UMY." />
            <Link href="/berita" className="text-sm font-semibold text-green-700 hover:underline">Semua berita →</Link>
          </div>
          <div className="mt-10">
            {news.length ? (
              <ul className="grid gap-6 md:grid-cols-3">{news.map((n, i) => <li key={n.id}><Reveal delay={i * 80} className="h-full"><NewsCard n={n} /></Reveal></li>)}</ul>
            ) : (
              <EmptyState title="Belum ada berita yang diterbitkan." hint="Kabar, prestasi, dan rekognisi anak IBKAMA akan tampil di sini setelah ditulis pengurus melalui dashboard." />
            )}
          </div>
        </Container>
      </section>

      {/* 12 — Penutup */}
      <section className="bg-white py-28">
        <Container className="text-center">
          <Reveal>
            <p className="font-heading text-sm font-semibold uppercase tracking-[0.3em] text-brown-600">Bersahaja · Berkarya · Berjaya</p>
            <h2 className="mx-auto mt-6 max-w-3xl text-4xl leading-tight md:text-6xl">Mari tumbuh dan berkontribusi bersama IBKAMA.</h2>
            <p className="mx-auto mt-6 max-w-xl text-base text-muted">Punya pertanyaan, ingin berkolaborasi, atau sekadar menyapa? Kami senang mendengar dari Anda.</p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/kontak" size="lg">Hubungi IBKAMA</ButtonLink>
              {org?.waChannelUrl && <ButtonLink href={org.waChannelUrl} external variant="secondary" size="lg">Ikuti {org.waChannelName}</ButtonLink>}
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
