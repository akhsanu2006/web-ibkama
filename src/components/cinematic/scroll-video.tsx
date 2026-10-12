"use client";

import { useEffect, useRef, useState } from "react";
import type { CinematicConfig } from "@/content/cinematic";

/**
 * Section sinematik berbasis scroll.
 *   scroll turun  → progres maju (caption, zoom poster, transisi putih)
 *   berhenti      → berhenti di posisi itu
 *   scroll naik   → mundur
 *
 * Mode video "scrub" (default): GSAP ScrollTrigger → video.currentTime (di-lerp agar halus),
 *   video berhenti tepat saat scroll berhenti.
 * Mode video "autoplay" (`cfg.autoplay`): video berjalan sendiri sekali (autoplay, TANPA loop)
 *   begitu siap — sampai akhir lalu berhenti di frame terakhir, tidak diulang sendiri.
 *   Video hanya diputar ulang dari awal saat pengguna scroll kembali ke posisi paling atas
 *   section ini (mis. setelah sempat scroll turun lalu naik lagi ke atas).
 *   Progres scroll tetap menggerakkan caption/zoom poster/transisi putih seperti biasa;
 *   hanya currentTime video yang tidak lagi diatur langsung oleh scroll.
 * Mode poster: dipakai bila video belum dipasang, di layar kecil, hemat data,
 *              atau prefers-reduced-motion. Tetap scroll-driven (zoom halus +
 *              memutih), TANPA memalsukan video.
 */
export function ScrollVideo({ cfg }: { cfg: CinematicConfig }) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // 1) Pilih sumber: video hanya jika ada, layar lebar, dan pengguna tak menolak gerak.
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = matchMedia("(max-width: 767px)").matches;
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    if (reduce || conn?.saveData) return;
    const candidate = small ? cfg.mobileSrc : cfg.src;
    if (!candidate) return;
    let cancelled = false;
    fetch(candidate, { method: "HEAD" })
      .then((r) => { if (!cancelled && r.ok && (r.headers.get("content-type") ?? "").includes("video")) setVideoSrc(candidate); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [cfg.src, cfg.mobileSrc]);

  // 2) Hubungkan scroll → progres.
  useEffect(() => {
    const el = root.current, st = stage.current;
    if (!el || !st) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let kill = () => {};
    let disposed = false;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);

      const video = videoRef.current;
      if (cfg.autoplay && video) video.play().catch(() => {}); // jaga-jaga: atribut autoplay kadang tak cukup untuk <video> yang di-mount async
      const captions = Array.from(st.querySelectorAll<HTMLElement>("[data-cap]"));
      let target = 0, shown = 0, raf = 0;
      let wasAtTop = true; // halaman dimulai di atas; hindari replay langsung saat mount

      const maybeReplay = (p: number) => {
        if (!cfg.autoplay || !video) return;
        const atTop = p <= 0.001;
        if (atTop && !wasAtTop) { video.currentTime = 0; video.play().catch(() => {}); }
        wasAtTop = atTop;
      };

      const apply = (p: number) => {
        st.style.setProperty("--p", p.toFixed(4));
        const fade = cfg.whiteFrom >= 1 ? 0 : Math.min(1, Math.max(0, (p - cfg.whiteFrom) / (1 - cfg.whiteFrom)));
        st.style.setProperty("--white", (fade * fade * (3 - 2 * fade)).toFixed(4));
        for (const c of captions) {
          const from = +c.dataset.from!, to = +c.dataset.to!, edge = 0.05;
          const o = Math.min(1, Math.max(0, Math.min((p - from) / edge, (to - p) / edge)));
          c.style.opacity = String(reduce ? (p >= from && p <= to ? 1 : 0) : o);
          c.style.transform = `translateY(${(1 - o) * 14}px)`;
        }
      };

      const tick = () => {
        shown += (target - shown) * 0.14; // lerp: gerak halus, tanpa loncat
        if (Math.abs(target - shown) < 0.0004) shown = target;
        apply(shown);
        if (!cfg.autoplay && video && video.duration && Math.abs(video.currentTime - shown * video.duration) > 1 / 60)
          video.currentTime = shown * video.duration;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      // HP (tampilan desktop diperkecil, tanpa pin): progres berjalan selama panggung melintas di layar.
      const hp = !!el.closest('[data-perangkat="hp"]');
      const trigger = ScrollTrigger.create({
        trigger: el, start: hp ? "top bottom" : "top top", end: hp ? "bottom top" : "bottom bottom",
        onUpdate: (self) => { target = self.progress; maybeReplay(target); },
      });
      target = shown = trigger.progress; apply(shown);
      kill = () => { cancelAnimationFrame(raf); trigger.kill(); };
    })();

    return () => { disposed = true; kill(); };
  }, [cfg.whiteFrom, videoSrc]);

  return (
    <section
      ref={root}
      id={cfg.id}
      aria-label={cfg.alt}
      // PC: section lebih tinggi dari layar → layar "dipin" selama scroll. HP: --pin=1 → setinggi panggung (tanpa pin).
      style={{ height: `calc(var(--layar) * var(--pin, ${cfg.heightVh / 100}))` }}
      className="relative bg-white"
    >
      <div ref={stage} className="sticky top-0 h-[var(--layar)] w-full overflow-hidden bg-green-950" style={{ ["--p" as string]: 0, ["--white" as string]: 0 }}>
        {/* Poster (selalu ada: fallback + frame awal sebelum video siap) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cfg.poster}
          alt={cfg.alt}
          fetchPriority={cfg.id === "opening" ? "high" : "auto"}
          className="absolute inset-0 size-full object-cover will-change-transform"
          style={{
            transform: cfg.posterMotion === "push-in" ? "scale(calc(1 + var(--p) * 0.22))" : "scale(1.02)",
            filter: cfg.posterMotion === "push-in" ? "blur(calc(var(--white) * 10px))" : undefined,
            opacity: videoSrc && ready ? 0 : 1,
            transition: "opacity .4s",
            objectPosition: cfg.id === "opening" ? "50% 60%" : "50% 30%",
          }}
        />
        {videoSrc && (
          <video
            ref={videoRef}
            src={videoSrc}
            muted playsInline preload="auto" aria-hidden
            autoPlay={cfg.autoplay || undefined}
            onLoadedMetadata={() => setReady(true)}
            className="absolute inset-0 size-full object-cover"
          />
        )}

        {/* lapisan tinta agar teks selalu terbaca */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-green-950/70 via-green-950/10 to-green-950/30" />

        {/* caption yang muncul-hilang sesuai progres */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto w-full max-w-6xl px-6 pb-20 md:pb-24">
          <div className="relative h-32 md:h-36">
            {cfg.captions.map((c, i) => (
              <div key={i} data-cap data-from={c.from} data-to={c.to} className="absolute inset-x-0 bottom-0 text-white opacity-0">
                <h2 className="max-w-2xl text-3xl leading-tight !text-white md:text-5xl">{c.title}</h2>
                {c.text && <p className="mt-3 max-w-xl text-sm text-white/85 md:text-base">{c.text}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* petunjuk scroll (hanya bagian awal) */}
        {cfg.id === "opening" && (
          <div className="pointer-events-none absolute inset-x-0 top-24 flex justify-center" style={{ opacity: "calc(1 - var(--p) * 8)" }}>
            <span className="rounded-full bg-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-white backdrop-blur">
              Scroll untuk memulai
            </span>
          </div>
        )}

        {/* bingkai putih: transisi menuju konten berikutnya, dengan aksen hijau/coklat/emas halus */}
        <div className="pointer-events-none absolute inset-0" style={{ opacity: "var(--white)", background: "radial-gradient(120% 80% at 50% 110%, rgb(226 168 21 / .10), transparent 55%), radial-gradient(90% 70% at 15% 0%, rgb(23 51 31 / .10), transparent 60%), radial-gradient(80% 60% at 90% 90%, rgb(122 90 62 / .10), transparent 60%), #fff" }} />
      </div>
    </section>
  );
}
