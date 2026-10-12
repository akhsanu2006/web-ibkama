import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ExternalLink, Medal, User } from "lucide-react";
import { NEWS_ICON, NewsCard } from "@/components/public/news-card";
import { Container } from "@/components/public/page-hero";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/period";
import { getPublicNews, listPublicNews } from "@/lib/queries/public";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = await getPublicNews((await params).id);
  return { title: n?.title ?? "Berita", description: n?.summary ?? undefined };
}

export default async function BeritaDetail({ params }: Props) {
  const { id } = await params;
  const n = await getPublicNews(id);
  if (!n) notFound();
  const more = (await listPublicNews({ limit: 4 })).filter((x) => x.id !== n.id).slice(0, 3);
  const Icon = NEWS_ICON[n.category];
  const meta = [
    n.date && { icon: CalendarDays, value: formatDate(n.date) },
    n.personName && { icon: User, value: n.personName },
    n.level && { icon: Medal, value: `Tingkat ${n.level}` },
  ].filter(Boolean) as { icon: typeof User; value: string }[];

  return (
    <>
      <article className="pb-10 pt-32 md:pt-40">
        <Container className="max-w-4xl">
          <Link href="/berita" className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:underline"><ArrowLeft size={16} aria-hidden /> Semua berita</Link>
          <div className="mt-8"><StatusBadge status={n.category} /></div>
          <h1 className="mt-4 text-4xl leading-[1.12] md:text-5xl">{n.title}</h1>
          {meta.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {meta.map(({ icon: I, value }) => <li key={value} className="flex items-center gap-2"><I size={16} className="text-green-700" aria-hidden />{value}</li>)}
            </ul>
          )}
          {n.summary && <p className="mt-8 border-l-4 border-gold pl-5 text-lg leading-relaxed text-green-900">{n.summary}</p>}
        </Container>

        <Container className="mt-10 max-w-5xl">
          {n.coverUrl ? (
            // tampil utuh (tanpa dipotong)
            <Image src={n.coverUrl} alt={n.title} width={1600} height={1000} className="h-auto w-full rounded-3xl ring-1 ring-line" unoptimized />
          ) : (
            <div className="grid aspect-[16/7] place-items-center rounded-3xl bg-gradient-to-br from-green-800 to-green-950 text-gold/80"><Icon size={64} strokeWidth={1.3} aria-hidden /></div>
          )}
        </Container>

        <Container className="mt-10 max-w-3xl">
          {n.body && (
            <div className="space-y-5 text-[16px] leading-[1.85] text-ink/85">
              {n.body.split(/\n\s*\n/).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
            </div>
          )}
          {n.sourceUrl && (
            <a href={n.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-green-800 ring-1 ring-inset ring-green-200 hover:bg-green-50">
              Lihat sumber / dokumentasi <ExternalLink size={15} aria-hidden />
            </a>
          )}
        </Container>
      </article>

      {more.length > 0 && (
        <section className="bg-green-50/60 py-16">
          <Container>
            <h2 className="text-2xl">Berita lainnya</h2>
            <ul className="mt-6 grid gap-6 md:grid-cols-3">{more.map((m) => <li key={m.id}><NewsCard n={m} /></li>)}</ul>
          </Container>
        </section>
      )}
    </>
  );
}
