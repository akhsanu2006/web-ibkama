import type { Metadata } from "next";
import { AtSign, Mail, MapPin, MessageCircle, Phone, Radio } from "lucide-react";
import { Container, PageHero } from "@/components/public/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { getIntegrations, getOrganization } from "@/lib/queries/public";

export const metadata: Metadata = { title: "Kontak" };
export const dynamic = "force-dynamic";

export default async function KontakPage() {
  const [org, integrations] = await Promise.all([getOrganization(), getIntegrations()]);
  if (!org) return null;
  const wa = org.whatsapp ? `https://wa.me/${org.whatsapp.replace(/\D/g, "")}` : null;
  const forms = integrations.find((i) => i.key === "google_forms" && i.enabled && i.url);
  const items = [
    org.address && { icon: MapPin, label: "Sekretariat", value: org.address },
    org.email && { icon: Mail, label: "Email", value: org.email, href: `mailto:${org.email}` },
    org.phone && { icon: Phone, label: "Telepon", value: org.phone, href: `tel:${org.phone}` },
    wa && { icon: MessageCircle, label: "WhatsApp", value: org.whatsapp!, href: wa },
    org.instagramUrl && { icon: AtSign, label: "Instagram", value: org.instagramHandle ?? org.instagramUrl, href: org.instagramUrl },
    org.waChannelUrl && { icon: Radio, label: "WhatsApp Channel", value: org.waChannelName ?? "Saluran", href: org.waChannelUrl },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href?: string }[];

  return (
    <>
      <PageHero eyebrow="Kontak" title="Terhubung dengan IBKAMA" description="Hubungi kami melalui kanal resmi berikut." />
      <Container className="grid gap-10 pb-8 md:grid-cols-12">
        <ul className="grid gap-4 sm:grid-cols-2 md:col-span-7">
          {items.map(({ icon: Icon, label, value, href }) => (
            <li key={label} className="rounded-3xl bg-white p-6 ring-1 ring-line shadow-soft">
              <span className="grid size-10 place-items-center rounded-2xl bg-green-100 text-green-800"><Icon size={18} aria-hidden /></span>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-muted">{label}</p>
              {href ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="mt-1 block break-words font-semibold text-green-900 hover:underline">{value}</a> : <p className="mt-1 break-words font-semibold text-green-900">{value}</p>}
            </li>
          ))}
        </ul>
        <aside className="md:col-span-5">
          <div className="rounded-3xl bg-green-900 p-8 text-white">
            <h2 className="text-2xl !text-white">Tetap terhubung</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/75">Informasi terbaru, pengumuman, dan agenda dibagikan lewat WhatsApp Channel dan Instagram resmi.</p>
            <div className="mt-6 flex flex-col gap-2">
              {org.waChannelUrl && <ButtonLink href={org.waChannelUrl} external variant="secondary">Ikuti {org.waChannelName}</ButtonLink>}
              {forms && <ButtonLink href={forms.url!} external variant="secondary">Formulir / pendaftaran</ButtonLink>}
            </div>
          </div>
        </aside>
      </Container>
    </>
  );
}
