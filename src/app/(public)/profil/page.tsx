import type { Metadata } from "next";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { Container } from "@/components/public/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { getOrganization } from "@/lib/queries/public";
import { getSiteMedia } from "@/lib/queries/site-media";

export const metadata: Metadata = { title: "Profil" };
export const dynamic = "force-dynamic";

const SECTIONS = [
  { id: "sejarah", label: "Sejarah" },
  { id: "visi-misi", label: "Visi & Misi" },
  { id: "tujuan", label: "Tujuan" },
  { id: "nilai", label: "Nilai Organisasi" },
];

export default async function ProfilPage() {
  const [org, siteMedia] = await Promise.all([getOrganization(), getSiteMedia()]);
  if (!org) return null;
  const hero = siteMedia["profil.hero"]; // bisa diganti dari dashboard → Media Situs
  return (
    <>
      {/* Hero layar penuh: foto pelantikan (aset statis public/profil), lalu teks profil di bawahnya
          dengan gradasi foto → latar sebagai transisi. */}
      <section aria-label="Profil organisasi" className="relative bg-white">
        <div className="relative h-[78svh] min-h-[460px] w-full overflow-hidden sm:h-[var(--layar-s)] sm:min-h-[560px]">
          <Image
            src={hero.url ?? "/profil/pelantikan-2026.jpg"} fill priority sizes="100vw" unoptimized={hero.custom}
            alt={hero.custom ? "Foto kegiatan IBKAMA UMY" : "Foto bersama pengurus IBKAMA UMY pada Pelantikan Pengurus Periode 2026/2027 di Universitas Muhammadiyah Yogyakarta"}
            className="object-cover object-[50%_40%]"
          />
          {/* gelap tipis di atas agar navbar & caption tetap terbaca */}
          <div aria-hidden className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-green-950/45 to-transparent" />
          {/* transisi ke teks */}
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-b from-transparent via-white/80 to-white" />
          <a href="#profil-teks" className="absolute inset-x-0 bottom-6 mx-auto flex w-fit flex-col items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-green-900/80 transition hover:text-green-900">
            Gulir <ChevronDown size={18} className="animate-bounce" aria-hidden />
          </a>
        </div>

        <Container className="relative pb-16 md:pb-20">
          <div id="profil-teks" className="scroll-mt-28">
            <Reveal>
              <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-brown-600">
                <span className="h-px w-6 bg-gold" aria-hidden />Profil organisasi
              </p>
              <h1 className="max-w-4xl text-4xl leading-[1.1] md:text-6xl">{org.name}</h1>
              <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-12">
                <p className="text-base leading-relaxed text-muted md:text-lg lg:col-span-8">{org.description}</p>
                <div className="lg:col-span-4">
                  <blockquote className="flex items-center gap-4">
                    <span className="h-10 w-1 shrink-0 rounded-full bg-gold" aria-hidden />
                    <p className="font-heading text-lg font-semibold text-green-800 md:text-xl">“{org.tagline}”</p>
                  </blockquote>
                  {/* keterangan khusus foto bawaan; disembunyikan bila foto sudah diganti dari dashboard */}
                  {!hero.custom && (
                    <p className="mt-5 text-xs leading-relaxed text-muted">
                      Foto: Pelantikan Pengurus Periode 2026/2027 · 5 Mei 2026 · Universitas Muhammadiyah Yogyakarta
                    </p>
                  )}
                </div>
              </div>
              <nav aria-label="Bagian halaman profil" className="mt-10 flex flex-wrap gap-2">
                {SECTIONS.map((s) => (
                  <a key={s.id} href={`#${s.id}`}
                    className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-green-800 ring-1 ring-inset ring-green-200 transition hover:bg-green-50 hover:ring-green-700/40">
                    {s.label}
                  </a>
                ))}
              </nav>
            </Reveal>
          </div>
        </Container>
      </section>

      <section id="sejarah" className="scroll-mt-24 py-16">
        <Container className="grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-4">
            <div className="sticky top-28 rounded-3xl bg-green-50 p-8 text-center">
              <Image src="/brand/logo.png" alt="Logo IBKAMA UMY" width={220} height={220} className="mx-auto" />
              <p className="mt-4 font-heading text-lg font-bold text-green-900">{org.shortName}</p>
            </div>
          </Reveal>
          <Reveal className="md:col-span-8" delay={80}>
            <SectionHeader eyebrow="Sejarah" title="Perjalanan IBKAMA UMY" />
            <div className="mt-6 space-y-5 text-[15px] leading-[1.85] text-muted">
              {org.history.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </Reveal>
        </Container>
      </section>

      <section id="visi-misi" className="scroll-mt-24 bg-green-900 py-20 text-white">
        <Container className="grid gap-12 md:grid-cols-2">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">Visi</p>
            <p className="mt-4 font-heading text-2xl font-semibold leading-snug !text-white md:text-3xl">{org.vision}</p>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">Misi</p>
            <ol className="mt-4 space-y-4">
              {org.missions.map((m, i) => (
                <li key={i} className="flex gap-4 text-sm leading-relaxed text-white/85">
                  <span className="font-heading font-bold text-gold">{String(i + 1).padStart(2, "0")}</span>{m}
                </li>
              ))}
            </ol>
          </Reveal>
        </Container>
      </section>

      <section id="tujuan" className="scroll-mt-24 py-20">
        <Container>
          <Reveal><SectionHeader eyebrow="Tujuan" title="Mengapa IBKAMA ada" description={org.goals} /></Reveal>
        </Container>
      </section>

      <section id="nilai" className="scroll-mt-24 bg-green-50/60 py-20">
        <Container>
          <SectionHeader eyebrow="Nilai organisasi" title="Nilai yang menjadi pegangan" align="center" />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {org.values.map((v, i) => (
              <Reveal key={v.title} delay={i * 50}>
                <li className="h-full rounded-3xl bg-white p-6 ring-1 ring-line">
                  <span className="font-heading text-sm font-bold text-gold">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-3 text-lg">{v.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted">{v.description}</p>
                </li>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
