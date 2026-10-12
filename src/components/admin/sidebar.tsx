"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { LogOut, Menu, X } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { ADMIN_NAV } from "./nav";

type Props = { user: { name: string; role: "admin" | "super_admin"; adminPosition: string | null }; allowed: string[] };

export function AdminShell({ user, allowed, children }: Props & { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  const nav = (
    <nav aria-label="Menu dashboard" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {ADMIN_NAV.map((g) => {
        const items = g.items.filter((i) => (i.superOnly ? user.role === "super_admin" : !i.perm || allowed.includes(i.perm)));
        if (!items.length) return null;
        return (
          <div key={g.title}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{g.title}</p>
            <ul className="space-y-0.5">
              {items.map(({ href, label, icon: Icon }) => {
                const on = href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`);
                return (
                  <li key={href}>
                    <Link href={href} aria-current={on ? "page" : undefined}
                      className={clsx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors", on ? "bg-green-800 text-white" : "text-ink/80 hover:bg-green-50")}>
                      <Icon size={17} aria-hidden />{label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href="/admin" className="flex items-center gap-2.5 px-5 py-5">
      <Image src="/brand/logo.png" alt="" width={34} height={34} className="size-[34px]" />
      <div className="leading-tight"><p className="font-heading text-sm font-bold text-green-900">IBKAMA UMY</p><p className="text-[10px] uppercase tracking-widest text-muted">Dashboard</p></div>
    </Link>
  );

  return (
    <div className="min-h-dvh bg-green-50/50 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-white lg:flex">{brand}{nav}</aside>

      {open && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <aside className={clsx("fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-lift transition-transform lg:hidden", open ? "translate-x-0" : "-translate-x-full")} aria-hidden={!open}>
        <div className="flex items-center justify-between pr-3">{brand}<button aria-label="Tutup menu" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full hover:bg-green-50"><X size={18} /></button></div>
        {nav}
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/85 px-4 backdrop-blur md:px-8">
          <button className="grid size-10 place-items-center rounded-full hover:bg-green-50 lg:hidden" aria-label="Buka menu" onClick={() => setOpen(true)}><Menu size={20} /></button>
          <Link href="/" target="_blank" className="hidden text-[13px] font-medium text-muted hover:text-green-800 lg:inline">Lihat website ↗</Link>
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-[13px] font-semibold text-green-950">{user.name}</p>
              <p className="text-[11px] text-muted">{user.role === "super_admin" ? "Super Admin" : "Admin"}</p>
            </div>
            <form action={logout}><button className="grid size-10 place-items-center rounded-full text-muted ring-1 ring-line hover:bg-green-50 hover:text-green-900" aria-label="Keluar"><LogOut size={16} /></button></form>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
