import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, CalendarDays, Download, ExternalLink, FileText, Images, MapPin, User, Users } from "lucide-react";
import { Container, PageHero } from "@/components/public/page-hero";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getPublicProgram } from "@/lib/queries/public";
import { formatDate, mediaUrl } from "@/lib/period";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPublicProgram((await params).id);
  return { title: p?.name ?? "Program" };
}

export default async function ProgramDetail({ params }: Props) {
  const p = await getPublicProgram((await params).id);
  if (!p) notFound();
  const meta = [
    p.startDate && { icon: CalendarDays, label: "Waktu", value: `${formatDate(p.startDate)}${p.endDate && p.endDate !== p.startDate ? ` – ${formatDate(p.endDate)}` : ""}${p.timeNote ? ` · ${p.timeNote}` : ""}` },
    p.location && { icon: MapPin, label: "Lokasi", value: p.location },
    p.picName && { icon: User, label: "Penanggung jawab", value: p.picName },
    p.participantCount != null && { icon: Users, label: "Peserta", value: `${p.participantCount} orang` },
  ].filter(Boolean) as { icon: typeof User; label: string; value: string }[];

  // Arsip, dokumen & dokumentasi: tiap jenis boleh berkas dan/atau tautan; yang kosong tidak ditampilkan.
  const files = [
    { key: "arsip", title: "Arsip", icon: Archive, file: mediaUrl(p.archiveMediaId), url: p.archiveUrl, fileLabel: "Unduh berkas arsip" },
    { key: "dokumen", title: "Dokumen", icon: FileText, file: mediaUrl(p.documentMediaId), url: p.documentUrl, fileLabel: "Unduh dokumen" },
    { key: "dokumentasi", title: "Dokumentasi", icon: Images, file: mediaUrl(p.documentationMediaId), url: p.documentationUrl, fileLabel: "Lihat foto" },
  ].filter((f) => f.file || f.url);

  return (
    <>
      <PageHero eyebrow={`Program kerja · ${p.periodName}${p.divisionName ? ` · ${p.divisionName}` : ""}`} title={p.name} description={p.description ?? undefined}>
        <StatusBadge status={p.status} />
      </PageHero>
      <Container className="grid gap-10 pb-10 md:grid-cols-12">
        <div className="space-y-10 md:col-span-8">
          {p.background && <section><h2 className="text-xl">Latar belakang & tujuan</h2><p className="mt-3 whitespace-pre-line text-[15px] leading-[1.85] text-muted">{p.background}</p></section>}
          {p.target && <section><h2 className="text-xl">Sasaran</h2><p className="mt-3 whitespace-pre-line text-[15px] leading-[1.85] text-muted">{p.target}</p></section>}
          {p.output && <section><h2 className="text-xl">Hasil / output</h2><p className="mt-3 whitespace-pre-line text-[15px] leading-[1.85] text-muted">{p.output}</p></section>}
          {files.length > 0 && (
            <section>
              <h2 className="text-xl">Arsip, dokumen &amp; dokumentasi</h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {files.map(({ key, title, icon: Icon, file, url, fileLabel }) => (
                  <li key={key} className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-line">
                    {key === "dokumentasi" && file && (
                      // foto tampil utuh (tidak dipotong)
                      <a href={file} target="_blank" rel="noopener noreferrer" className="block bg-green-50">
                        <Image src={file} alt={`Dokumentasi ${p.name}`} width={800} height={600} className="h-auto w-full" unoptimized />
                      </a>
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <p className="flex items-center gap-2 font-heading text-base font-semibold text-green-900">
                        <span className="grid size-9 place-items-center rounded-xl bg-green-100 text-green-800"><Icon size={17} aria-hidden /></span>{title}
                      </p>
                      <div className="mt-4 flex flex-col gap-2">
                        {file && <ButtonLink href={file} external variant="secondary" size="sm"><Download size={14} /> {fileLabel}</ButtonLink>}
                        {url && <ButtonLink href={url} external variant="secondary" size="sm"><ExternalLink size={14} /> Buka tautan</ButtonLink>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {p.gallery.length > 0 && (
            <section><h2 className="text-xl">Galeri dokumentasi</h2>
              <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {p.gallery.map((g) => <li key={g.id} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-green-50"><Image src={g.url} alt={g.title ?? `Dokumentasi ${p.name}`} fill className="object-cover" unoptimized /></li>)}
              </ul>
            </section>
          )}
        </div>
        {/* kotak info hanya bila ada isinya (program baru bisa belum punya tanggal/lokasi/tautan) */}
        {(meta.length > 0 || p.reportUrl || p.supportingUrl) && <aside className="md:col-span-4">
          <div className="sticky top-28 space-y-5 rounded-3xl bg-green-50 p-6">
            {meta.length > 0 && <dl className="space-y-4">
              {meta.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3"><Icon size={17} className="mt-0.5 shrink-0 text-green-700" aria-hidden /><div><dt className="text-[11px] font-semibold uppercase tracking-widest text-muted">{label}</dt><dd className="mt-0.5 text-sm text-green-950">{value}</dd></div></div>
              ))}
            </dl>}
            {(p.reportUrl || p.supportingUrl) && (
              <div className={`flex flex-col gap-2 ${meta.length ? "border-t border-green-200 pt-5" : ""}`}>
                {p.reportUrl && <ButtonLink href={p.reportUrl} external variant="secondary" size="sm"><FileText size={14} /> Laporan kegiatan</ButtonLink>}
                {p.supportingUrl && <ButtonLink href={p.supportingUrl} external variant="secondary" size="sm"><FileText size={14} /> Data pendukung</ButtonLink>}
              </div>
            )}
          </div>
        </aside>}
      </Container>
      <Container className="pb-16"><Link href="/program" className="text-sm font-semibold text-green-700 hover:underline">← Semua program</Link></Container>
    </>
  );
}
