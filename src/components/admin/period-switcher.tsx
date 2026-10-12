import Link from "next/link";
import clsx from "clsx";
import type { Period } from "@/db/schema";

/**
 * Pemilih periode khusus dashboard: nilai di URL adalah period_id (bukan slug nama),
 * sesuai `adminPeriod()` di lib/queries/admin.ts. Selalu menyertakan opsi "Semua periode".
 */
export function AdminPeriodSwitcher({ periods, current, showAll, basePath, extra = {} }: {
  periods: Period[]; current: string | null; showAll: boolean; basePath: string; extra?: Record<string, string | undefined>;
}) {
  if (periods.length === 0) return null;
  const qs = (value: string) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(extra)) if (v) p.set(k, v);
    p.set("periode", value);
    return `${basePath}?${p}`;
  };
  const pill = (on: boolean) =>
    clsx("rounded-full px-4 py-2 text-[13px] font-semibold ring-1 ring-inset transition",
      on ? "bg-green-800 text-white ring-green-800" : "bg-white text-green-900 ring-green-200 hover:bg-green-50");
  return (
    <nav aria-label="Pilih periode" className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-semibold uppercase tracking-widest text-muted">Periode</span>
      <Link href={qs("semua")} aria-current={showAll ? "true" : undefined} className={pill(showAll)}>Semua periode</Link>
      {periods.map((p) => (
        <Link key={p.id} href={qs(p.id)} aria-current={!showAll && p.id === current ? "true" : undefined} className={pill(!showAll && p.id === current)}>
          {p.name}{p.status === "active" && <span className="ml-1.5 text-[10px] font-bold uppercase text-gold">• aktif</span>}
        </Link>
      ))}
    </nav>
  );
}
