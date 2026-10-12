import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Award, Megaphone, Trophy } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/period";

export const NEWS_ICON = { kabar: Megaphone, prestasi: Trophy, rekognisi: Award } as const;

export type NewsItem = {
  id: string; category: "kabar" | "prestasi" | "rekognisi"; title: string; personName: string | null; level: string | null;
  summary: string | null; coverUrl: string | null; date: string | null;
};

/** Kartu berita (daftar /berita & beranda). Tanpa foto → panel ikon kategori. */
export function NewsCard({ n }: { n: NewsItem }) {
  const Icon = NEWS_ICON[n.category];
  return (
    <Link href={`/berita/${n.id}`} className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-line transition duration-500 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-green-800 to-green-950">
        {n.coverUrl ? (
          <Image src={n.coverUrl} alt="" fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" unoptimized />
        ) : (
          <div className="grid size-full place-items-center text-gold/80"><Icon size={48} strokeWidth={1.4} aria-hidden /></div>
        )}
        <div className="absolute left-4 top-4"><StatusBadge status={n.category} /></div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-semibold text-brown-600">
          {[formatDate(n.date), n.level].filter(Boolean).join(" · ")}
        </p>
        <h3 className="mt-2 text-lg leading-snug transition-colors group-hover:text-green-700">{n.title}</h3>
        {n.personName && <p className="mt-1 text-[13px] font-semibold text-green-800">{n.personName}</p>}
        {n.summary && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{n.summary}</p>}
        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[13px] font-semibold text-green-700">
          Baca selengkapnya <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
