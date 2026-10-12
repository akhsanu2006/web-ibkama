import Image from "next/image";
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";

export type TimelineItem = {
  id: string; periodName: string; chairName: string; photoUrl: string | null;
  profile: string | null; achievements: string | null; periodInfo: string | null;
  documentationUrl: string | null; isActive: boolean;
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative space-y-10 border-l border-green-200 pl-8 md:pl-12">
      {items.map((it, i) => (
        <li key={it.id} className="relative">
          <span aria-hidden className={`absolute -left-[41px] top-2 size-4 rounded-full ring-4 ring-white md:-left-[57px] ${it.isActive ? "bg-gold" : "bg-green-700"}`} />
          <Reveal delay={i * 60}>
            <article className="grid gap-6 rounded-3xl bg-white p-6 ring-1 ring-line shadow-soft md:grid-cols-[160px_1fr] md:p-8">
              <div className="relative aspect-[4/5] w-32 overflow-hidden rounded-2xl bg-green-50 md:w-full">
                {it.photoUrl
                  ? <Image src={it.photoUrl} alt={`Ketua Umum ${it.periodName}: ${it.chairName}`} fill className="object-cover" unoptimized />
                  : <div className="grid size-full place-items-center text-green-200" aria-hidden><User size={48} strokeWidth={1.2} /></div>}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={it.isActive ? "gold" : "green"}>Periode {it.periodName}</Badge>
                  {it.isActive && <Badge tone="green">Sedang menjabat</Badge>}
                </div>
                <h3 className="mt-3 text-2xl">{it.chairName}</h3>
                <p className="text-sm font-semibold text-brown-600">Ketua Umum</p>
                {it.periodInfo && <p className="mt-3 text-sm leading-relaxed text-muted">{it.periodInfo}</p>}
                {it.profile && <p className="mt-3 text-sm leading-relaxed text-muted">{it.profile}</p>}
                {it.achievements && <p className="mt-3 rounded-2xl bg-green-50 p-4 text-sm leading-relaxed text-green-900"><strong className="font-semibold">Capaian: </strong>{it.achievements}</p>}
                {it.documentationUrl && <a href={it.documentationUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-semibold text-green-700 underline-offset-4 hover:underline">Lihat dokumentasi →</a>}
              </div>
            </article>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
