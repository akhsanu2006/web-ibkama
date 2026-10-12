"use client";
import { useEffect, useRef, useState } from "react";

type Item = { id: string; label: string; value: number | null; text: string | null; suffix: string };

const fmt = (n: number) => n.toLocaleString("id-ID");

/** Angka menghitung naik dari 0 saat hampir masuk layar (dan langsung tampil bila gerak dikurangi). */
function CountUp({ value }: { value: number }) {
  const el = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value); // SSR & tanpa JS: angka final
  useEffect(() => {
    const node = el.current;
    if (!node || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1400;
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / dur);
        setShown(Math.round(value * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { rootMargin: "0px 0px 140px 0px" }); // mulai sedikit sebelum terlihat → tak ada kedipan angka final ke 0
    io.observe(node);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value]);
  return <span ref={el}>{fmt(shown)}</span>;
}

/** Band gelap "IBKAMA dalam angka" (beranda). Sembunyi otomatis bila belum ada angka. */
export function HighlightsBand({ items }: { items: Item[] }) {
  if (!items.length) return null;
  return (
    <section aria-label="IBKAMA dalam angka" className="relative isolate overflow-hidden bg-green-950 py-20 text-white md:py-24">
      <div aria-hidden className="absolute left-1/2 top-1/2 -z-10 h-64 w-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-3xl" />
      <div aria-hidden className="absolute -right-10 top-10 -z-10 size-24 rounded-full ring-1 ring-white/10" />
      <div aria-hidden className="absolute right-24 top-20 -z-10 size-2 rounded-full bg-gold/70 shadow-[0_0_16px_4px_rgb(226_168_21/0.45)]" />
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-12 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/80">
          <span className="h-px w-6 bg-gold/60" aria-hidden />IBKAMA dalam angka<span className="h-px w-6 bg-gold/60" aria-hidden />
        </p>
        <ul className="grid grid-cols-2 gap-y-12 md:flex md:justify-center">
          {items.map((h, i) => (
            <li key={h.id} className="relative flex flex-1 flex-col items-center px-6 text-center">
              {i > 0 && <span aria-hidden className="absolute left-0 top-1/2 hidden h-24 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-white/15 to-transparent md:block" />}
              <p className="font-heading text-6xl font-bold leading-none tracking-tight lg:text-7xl">
                <span className="bg-gradient-to-b from-[#f5cf6a] to-gold bg-clip-text text-transparent">
                  {h.value !== null ? <CountUp value={h.value} /> : h.text}{h.suffix}
                </span>
              </p>
              <p className="mt-5 max-w-[15rem] text-[11px] font-semibold uppercase leading-relaxed tracking-[0.22em] text-white/60">{h.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
