import Image from "next/image";
import Link from "next/link";
import { AtSign, Mail, MapPin, MessageCircle, Radio } from "lucide-react";
import type { Organization } from "@/db/schema";
import { NAV } from "@/content/nav";

export function Footer({ org }: { org: Organization | null }) {
  const wa = org?.whatsapp ? `https://wa.me/${org.whatsapp.replace(/\D/g, "")}` : null;
  return (
    <footer className="mt-24 bg-green-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="flex items-center gap-3">
            <Image src="/brand/logo.png" alt="Logo IBKAMA UMY" width={56} height={56} className="size-14 rounded-full bg-white p-0.5" />
            <div>
              <p className="font-heading text-lg font-bold">{org?.shortName ?? "IBKAMA UMY"}</p>
              <p className="text-xs text-white/60">{org?.tagline ?? "Bersahaja, Berkarya, Berjaya"}</p>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70">
            {org?.name ?? "Ikatan Beasiswa Kader Muhammadiyah Universitas Muhammadiyah Yogyakarta"} — wadah pembinaan dan pengembangan kader penerima Beasiswa Kader Muhammadiyah.
          </p>
        </div>

        <nav className="md:col-span-3" aria-label="Tautan cepat">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Tautan cepat</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-white/75 md:grid-cols-1">
            {NAV.map((n) => <li key={n.href}><Link href={n.href} className="hover:text-white">{n.label}</Link></li>)}
          </ul>
        </nav>

        <div className="md:col-span-4">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Hubungi kami</p>
          <ul className="space-y-3 text-sm text-white/75">
            {org?.address && <li className="flex gap-3"><MapPin size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden /><span>{org.address}</span></li>}
            {org?.email && <li className="flex gap-3"><Mail size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden /><a className="break-all hover:text-white" href={`mailto:${org.email}`}>{org.email}</a></li>}
            {wa && <li className="flex gap-3"><MessageCircle size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden /><a className="hover:text-white" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp {org?.whatsapp}</a></li>}
            {org?.instagramUrl && <li className="flex gap-3"><AtSign size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden /><a className="hover:text-white" href={org.instagramUrl} target="_blank" rel="noopener noreferrer">{org.instagramHandle}</a></li>}
            {org?.waChannelUrl && <li className="flex gap-3"><Radio size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden /><a className="hover:text-white" href={org.waChannelUrl} target="_blank" rel="noopener noreferrer">WhatsApp Channel · {org.waChannelName}</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-6 text-center text-xs text-white/50">
        {/* Pintu masuk tersembunyi ke halaman login: tampil persis seperti teks hak cipta biasa
            (warna, kursor, tanpa garis bawah/hover). nofollow agar tidak dirayapi mesin pencari. */}
        <Link href="/login" rel="nofollow" prefetch={false} className="cursor-default text-inherit no-underline">
          © {new Date().getFullYear()} {org?.name ?? "IBKAMA UMY"}. Seluruh hak dilindungi.
        </Link>
      </div>
    </footer>
  );
}
