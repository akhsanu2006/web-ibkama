export function AdminPageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-2xl md:text-3xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>}</div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-3xl bg-white p-6 ring-1 ring-line shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-3 font-heading text-4xl font-bold text-green-900">{value}</p>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </div>
  );
}
