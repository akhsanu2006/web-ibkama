export function SectionHeader({ eyebrow, title, description, align = "left" }: {
  eyebrow?: string; title: string; description?: string; align?: "left" | "center";
}) {
  return (
    <header className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && (
        <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-brown-600 data-[c=true]:justify-center" data-c={align === "center"}>
          <span className="h-px w-6 bg-gold" aria-hidden />{eyebrow}
        </p>
      )}
      <h2 className="text-3xl leading-tight md:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-[15px] leading-relaxed text-muted">{description}</p>}
    </header>
  );
}
