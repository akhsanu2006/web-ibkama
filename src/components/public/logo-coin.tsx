"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Section identitas dengan animasi logo koin emas — SCROLL-DRIVEN, dipinning
 * seperti tiga sinematik utama (`ScrollVideo`): section dibuat lebih tinggi
 * dari layar (`heightVh`), lapisan dalam `sticky` sehingga saat pengguna
 * menggulir, halaman tetap terlihat bergeser (indikator scroll berjalan)
 * namun komposisi di layar hanya bergeser sedikit — sementara animasi koin
 * berputar mengikuti progres scroll secara presisi (maju/mundur/berhenti).
 *
 * Framing: video full-frame (tanpa masker lingkaran) mengisi setengah lebar
 * layar dari tengah halaman hingga ke tepi kanan; sisi kiri video digradasi
 * ke putih agar menyatu dengan latar teks "Bersahaja, Berkarya, Berjaya".
 * Poster (logo resmi statis) selalu ada di bawah sebagai fallback.
 */
export function LogoScrollSection({ heightVh = 200, videoSrc = "/brand/logo-coin.mp4", children }: { heightVh?: number; videoSrc?: string; children: React.ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(!matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!allowed) return;
    const el = root.current;
    if (!el) return;
    let raf = 0, target = 0, shown = 0, disposed = false;
    let kill = () => {};

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);

      const video = videoRef.current;
      const hp = !!el.closest('[data-perangkat="hp"]'); // HP: tanpa pin, progres selama melintas di layar
      const trigger = ScrollTrigger.create({
        trigger: el,
        start: hp ? "top bottom" : "top top",
        end: hp ? "bottom top" : "bottom bottom",
        onUpdate: (self) => { target = self.progress; },
      });
      target = shown = trigger.progress;

      const tick = () => {
        shown += (target - shown) * 0.15;
        if (Math.abs(target - shown) < 0.0006) shown = target;
        if (video && video.duration) video.currentTime = shown * video.duration;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      kill = () => { cancelAnimationFrame(raf); trigger.kill(); };
    })();

    return () => { disposed = true; kill(); };
  }, [allowed]);

  return (
    <section ref={root} className="relative bg-white" style={{ height: `calc(var(--layar) * var(--pin, ${heightVh / 100}))` }}>
      <div className="sticky top-0 h-[var(--layar)] w-full overflow-hidden">
        {/* teks — atas pada mobile, kiri pada desktop */}
        <div className="absolute inset-x-0 top-0 z-10 px-6 pt-28 pb-6 md:inset-y-0 md:right-1/2 md:left-0 md:flex md:items-center md:px-0 md:pt-0 md:pb-0">
          <div className="mx-auto w-full max-w-xl md:mx-0 md:pl-6 lg:pl-10">{children}</div>
        </div>

        {/* panel koin — bawah pada mobile, kanan pada desktop (dari tengah ke tepi kanan) */}
        <div className="absolute inset-x-0 bottom-0 h-[46%] md:inset-y-0 md:right-0 md:left-1/2 md:h-full">
          {/* bingkai — inset di sini (bukan padding induk) yang benar-benar mengecilkan video, agar seimbang dengan teks */}
          <div className="absolute inset-8 sm:inset-10 md:inset-12 lg:inset-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo.png"
              alt="Logo resmi IBKAMA UMY"
              className="absolute inset-0 size-full object-contain p-6"
              style={{ opacity: ready ? 0 : 1, transition: "opacity .6s" }}
            />
            {allowed && (
              <video
                ref={videoRef}
                src={videoSrc}
                muted
                playsInline
                preload="auto"
                aria-hidden
                onLoadedMetadata={() => setReady(true)}
                onError={() => setReady(false)}
                className="absolute inset-0 size-full object-cover"
                style={{
                  maskImage: "linear-gradient(to left, black 70%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to left, black 70%, transparent 100%)",
                }}
              />
            )}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[12%] bg-gradient-to-b from-white to-transparent" />
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[12%] bg-gradient-to-t from-white to-transparent" />
            <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[10%] bg-gradient-to-r from-white to-transparent md:hidden" />
          </div>
        </div>
      </div>
    </section>
  );
}
