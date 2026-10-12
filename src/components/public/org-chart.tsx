import Image from "next/image";
import { Crown, UserRound } from "lucide-react";
import type { ChartDivision } from "@/lib/queries/public";

type Person = { id?: string; name: string; photoUrl: string | null; positionName?: string | null };

const LINE = "bg-green-700/35"; // warna tema (green-300 bukan token IBKAMA)

function Avatar({ p, size }: { p: Person; size: number }) {
  return (
    <span className="relative block shrink-0 overflow-hidden rounded-full bg-green-100 ring-4 ring-white" style={{ width: size, height: size }}>
      {p.photoUrl
        ? <Image src={p.photoUrl} alt={`Foto ${p.name}`} fill sizes={`${size}px`} className="object-cover" unoptimized />
        : <span className="grid size-full place-items-center text-green-700"><UserRound size={size * 0.45} strokeWidth={1.6} aria-hidden /></span>}
    </span>
  );
}

/** Kartu tegak (Ketua Umum & pengurus inti). */
function NodeCard({ p, role, lead }: { p: Person | null; role: string; lead?: boolean }) {
  if (!p) {
    return (
      <div className="w-56 rounded-3xl border border-dashed border-green-700/30 bg-white/60 px-5 py-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brown-600">{role}</p>
        <p className="mt-2 text-sm text-muted">Belum diisi</p>
      </div>
    );
  }
  return (
    <div className={`relative w-56 rounded-3xl bg-white px-5 pb-6 pt-7 text-center shadow-soft ring-1 ${lead ? "ring-gold/60" : "ring-line"}`}>
      {lead && <span className="absolute -top-3 left-1/2 grid size-7 -translate-x-1/2 place-items-center rounded-full bg-gold text-white shadow-soft"><Crown size={14} aria-hidden /></span>}
      <div className="flex justify-center"><Avatar p={p} size={lead ? 92 : 72} /></div>
      <p className="mt-3 font-heading text-[15px] font-semibold leading-snug text-green-900">{p.name}</p>
      <p className={`mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${lead ? "text-gold" : "text-brown-600"}`}>{role}</p>
    </div>
  );
}

/** Baris ringkas di dalam kotak divisi (Kepala/Sekretaris Divisi). */
function SlotRow({ people, role }: { people: Person[]; role: string }) {
  if (!people.length) {
    return (
      <div className="rounded-2xl border border-dashed border-green-200 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brown-600">{role}</p>
        <p className="text-xs text-muted">Belum diisi</p>
      </div>
    );
  }
  return (
    <>
      {people.map((p) => (
        <div key={p.id ?? p.name} className="flex items-center gap-3 rounded-2xl bg-green-50 px-3 py-3">
          <Avatar p={p} size={48} />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brown-600">{role}</p>
            <p className="truncate font-heading text-sm font-semibold text-green-900">{p.name}</p>
          </div>
        </div>
      ))}
    </>
  );
}

function DivisionBox({ d }: { d: ChartDivision }) {
  return (
    <div className="h-full rounded-3xl bg-white p-5 shadow-soft ring-1 ring-line">
      <p className="rounded-2xl bg-green-900 px-4 py-3 text-center font-heading text-sm font-semibold text-white">{d.name}</p>
      <div className="mt-4 space-y-2.5">
        <SlotRow people={d.head} role="Kepala Divisi" />
        <SlotRow people={d.secretary} role="Sekretaris Divisi" />
      </div>
      <div className="mt-5 border-t border-line pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Anggota divisi{d.members.length ? ` · ${d.members.length}` : ""}</p>
        {d.members.length ? (
          <ul className="mt-3 space-y-2">
            {d.members.map((m) => (
              <li key={m.id} className="flex items-center gap-2.5">
                <Avatar p={m} size={32} />
                <span className="truncate text-[13px] font-medium text-ink">{m.name}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-xs text-muted">Belum diisi</p>}
      </div>
    </div>
  );
}

/**
 * Bagan organisasi: Ketua Umum → (cabang samping) Sekretaris & Bendahara → divisi.
 * Garis vertikal utama (batang) turun dari Ketua Umum ke garis horizontal divisi.
 */
export function OrgChart({ ketua, inti, divisions }: { ketua: Person | null; inti: Person[]; divisions: ChartDivision[] }) {
  // Sekretaris di kiri, Bendahara di kanan; pengurus inti lain dibagi rata kiri/kanan.
  const order = (p: Person) => (/sekretaris/i.test(p.positionName ?? "") ? 0 : /bendahara/i.test(p.positionName ?? "") ? 2 : 1);
  const sorted = [...inti].sort((a, b) => order(a) - order(b));
  const findRole = (re: RegExp) => sorted.find((p) => re.test(p.positionName ?? "")) ?? null;
  const left: (Person | null)[] = [], right: (Person | null)[] = [];
  const sek = findRole(/sekretaris/i), ben = findRole(/bendahara/i);
  left.push(sek); right.push(ben);
  sorted.filter((p) => p !== sek && p !== ben).forEach((p, i) => (i % 2 ? right : left).push(p));
  const roleOf = (p: Person | null, fallback: string) => p?.positionName ?? fallback;
  const n = divisions.length;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="mx-auto min-w-[960px] max-w-6xl">
        {/* tingkat 1 */}
        <div className="flex justify-center"><NodeCard p={ketua} role="Ketua Umum" lead /></div>
        <span aria-hidden className={`mx-auto block h-10 w-px ${LINE}`} />

        {/* tingkat 2: cabang samping dari batang */}
        <div className="grid grid-cols-[1fr_1px_1fr]">
          <div className="flex flex-col items-end justify-center gap-6 py-2">
            {left.map((p, i) => (
              <div key={p?.id ?? `l${i}`} className="flex items-center">
                <NodeCard p={p} role={roleOf(p, i === 0 ? "Sekretaris" : "Pengurus inti")} />
                <span aria-hidden className={`h-px w-16 ${LINE}`} />
              </div>
            ))}
          </div>
          <span aria-hidden className={LINE} />
          <div className="flex flex-col items-start justify-center gap-6 py-2">
            {right.map((p, i) => (
              <div key={p?.id ?? `r${i}`} className="flex items-center">
                <span aria-hidden className={`h-px w-16 ${LINE}`} />
                <NodeCard p={p} role={roleOf(p, i === 0 ? "Bendahara" : "Pengurus inti")} />
              </div>
            ))}
          </div>
        </div>

        {/* tingkat 3: divisi */}
        {n > 0 && (
          <>
            <span aria-hidden className={`mx-auto block h-10 w-px ${LINE}`} />
            <div className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
              {n > 1 && <span aria-hidden className={`absolute top-0 h-px ${LINE}`} style={{ left: `${50 / n}%`, right: `${50 / n}%` }} />}
              {divisions.map((d) => (
                <div key={d.id} className="flex flex-col px-3">
                  <span aria-hidden className={`mx-auto block h-8 w-px ${LINE}`} />
                  <DivisionBox d={d} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
