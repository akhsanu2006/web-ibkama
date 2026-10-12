import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin, User } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/period";

const card = "group block overflow-hidden rounded-3xl bg-white ring-1 ring-line shadow-soft transition duration-500 hover:-translate-y-1 hover:shadow-lift";

export function ProgramCard(p: {
  id: string; name: string; description: string | null; status: string;
  startDate: string | null; endDate: string | null; location: string | null; divisionName: string | null;
}) {
  return (
    <Link href={`/program/${p.id}`} className={`${card} p-6`}>
      <div className="flex items-center justify-between gap-3">
        <StatusBadge status={p.status} />
        {p.divisionName && <span className="text-[11px] font-semibold uppercase tracking-widest text-brown-600">{p.divisionName}</span>}
      </div>
      <h3 className="mt-4 text-xl leading-snug transition-colors group-hover:text-green-700">{p.name}</h3>
      {p.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{p.description}</p>}
      <dl className="mt-5 space-y-1.5 text-[13px] text-muted">
        {p.startDate && <div className="flex gap-2"><CalendarDays size={15} className="mt-0.5 text-green-700" aria-hidden /><dt className="sr-only">Waktu</dt><dd>{formatDate(p.startDate)}{p.endDate && p.endDate !== p.startDate ? ` – ${formatDate(p.endDate)}` : ""}</dd></div>}
        {p.location && <div className="flex gap-2"><MapPin size={15} className="mt-0.5 text-green-700" aria-hidden /><dt className="sr-only">Lokasi</dt><dd>{p.location}</dd></div>}
      </dl>
    </Link>
  );
}

export function MemberCard(m: {
  name: string; photoUrl: string | null; positionName: string | null; divisionName: string | null;
  studyProgram: string | null; cohort: string | null; bio: string | null;
}) {
  return (
    <article className="overflow-hidden rounded-3xl bg-white ring-1 ring-line shadow-soft">
      <div className="relative aspect-[4/5] bg-green-50">
        {m.photoUrl ? (
          <Image src={m.photoUrl} alt={`Foto ${m.name}`} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" unoptimized />
        ) : (
          <div className="grid size-full place-items-center text-green-200" aria-hidden><User size={64} strokeWidth={1.2} /></div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-base leading-snug">{m.name}</h3>
        <p className="mt-1 text-[13px] font-semibold text-brown-600">{[m.positionName, m.divisionName].filter(Boolean).join(" · ")}</p>
        {(m.studyProgram || m.cohort) && <p className="mt-2 text-xs text-muted">{[m.studyProgram, m.cohort && `Angkatan ${m.cohort}`].filter(Boolean).join(" · ")}</p>}
        {m.bio && <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-muted">{m.bio}</p>}
      </div>
    </article>
  );
}
