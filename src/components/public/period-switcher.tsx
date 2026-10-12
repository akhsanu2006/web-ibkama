import Link from "next/link";
import clsx from "clsx";
import type { Period } from "@/db/schema";
import { periodSlug } from "@/lib/period";

/** Pemilih periode berbasis tautan (server-friendly, bisa di-bookmark). */
export function PeriodSwitcher({ periods, current, basePath, extra = {} }: {
  periods: Period[]; current: string | null; basePath: string; extra?: Record<string, string | undefined>;
}) {
  if (periods.length === 0) return null;
  const qs = (slug: string) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(extra)) if (v) p.set(k, v);
    p.set("periode", slug);
    return `${basePath}?${p}`;
  };
  return (
    <nav aria-label="Pilih periode" className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-semibold uppercase tracking-widest text-muted">Periode</span>
      {periods.map((p) => {
        const on = p.id === current;
        return (
          <Link key={p.id} href={qs(periodSlug(p.name))} aria-current={on ? "true" : undefined}
            className={clsx("rounded-full px-4 py-2 text-[13px] font-semibold ring-1 ring-inset transition",
              on ? "bg-green-800 text-white ring-green-800" : "bg-white text-green-900 ring-green-200 hover:bg-green-50")}>
            {p.name}{p.status === "active" && <span className="ml-1.5 text-[10px] font-bold uppercase text-gold">• aktif</span>}
          </Link>
        );
      })}
    </nav>
  );
}
