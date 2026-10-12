"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EllipsisVertical, X } from "lucide-react";
import clsx from "clsx";
import { NAV } from "@/content/nav";

/**
 * Navigasi publik: tombol titik tiga di pojok kanan atas yang membuka panel daftar halaman.
 * (Pengganti bar navigasi horizontal; di beranda, navigasi utama tampil sebagai kotak-kotak di tengah halaman.)
 */
export function Navbar({ loggedIn }: { loggedIn: boolean }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Tutup saat klik di luar panel atau menekan Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const active = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-end p-3 md:p-5">
      <div ref={root} className="pointer-events-auto relative flex items-center gap-2">
        {/* Tidak ada tombol Login publik (pintu masuk disembunyikan di teks hak cipta footer).
            Tombol Dashboard hanya muncul bagi yang SUDAH login. */}
        {loggedIn && (
          <Link href="/admin" className="rounded-full bg-green-800 px-5 py-3 text-[13px] font-semibold text-white shadow-soft transition hover:bg-green-900">
            Dashboard
          </Link>
        )}
        <button
          type="button"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          aria-controls="menu-situs"
          onClick={() => setOpen((v) => !v)}
          className={clsx(
            "grid size-12 place-items-center rounded-full shadow-soft ring-1 backdrop-blur-xl transition duration-300",
            open ? "bg-green-900 text-white ring-green-900" : "bg-white/90 text-green-900 ring-black/5 hover:scale-105 hover:bg-white",
          )}
        >
          {open ? <X size={20} aria-hidden /> : <EllipsisVertical size={22} aria-hidden />}
        </button>

        <nav
          id="menu-situs"
          aria-label="Navigasi utama"
          className={clsx(
            "absolute right-0 top-full mt-3 w-72 origin-top-right rounded-3xl bg-white p-2 shadow-lift ring-1 ring-black/5 transition duration-200",
            open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0",
          )}
        >
          <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 pb-3 pt-2">
            <Image src="/brand/logo.png" alt="" width={36} height={36} className="size-9" />
            <span>
              <span className="block font-heading text-[15px] font-bold leading-tight text-green-900">IBKAMA<span className="text-brown-600"> UMY</span></span>
              <span className="block text-[11px] text-muted">Bersahaja, Berkarya, Berjaya</span>
            </span>
          </Link>
          <ul className="border-t border-line pt-2">
            {NAV.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={active(href) ? "page" : undefined}
                  tabIndex={open ? undefined : -1}
                  className={clsx(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active(href) ? "bg-green-100 text-green-900" : "text-ink hover:bg-green-50",
                  )}
                >
                  <Icon size={17} className={active(href) ? "text-green-800" : "text-green-700/70"} aria-hidden />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
