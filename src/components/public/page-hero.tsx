import { Reveal } from "@/components/ui/reveal";

export function PageHero({ eyebrow, title, description, children }: {
  eyebrow: string; title: string; description?: string; children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-green-50 via-white to-white pb-14 pt-32 md:pb-20 md:pt-40">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-[420px] rounded-full bg-green-100/70 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -left-32 top-40 size-[280px] rounded-full bg-brown-100/70 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal>
          <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-brown-600">
            <span className="h-px w-6 bg-gold" aria-hidden />{eyebrow}
          </p>
          <h1 className="max-w-3xl text-4xl leading-[1.1] md:text-6xl">{title}</h1>
          {description && <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">{description}</p>}
          {children && <div className="mt-8">{children}</div>}
        </Reveal>
      </div>
    </section>
  );
}

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-7xl px-6 ${className}`}>{children}</div>;
}
