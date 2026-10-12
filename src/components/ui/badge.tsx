import clsx from "clsx";

const tones = {
  green: "bg-green-100 text-green-800",
  brown: "bg-brown-100 text-brown-800",
  gray: "bg-neutral-100 text-neutral-600",
  red: "bg-danger-bg text-danger",
  gold: "bg-amber-50 text-amber-800",
} as const;

export function Badge({ tone = "green", children, className }: {
  tone?: keyof typeof tones; children: React.ReactNode; className?: string;
}) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide", tones[tone], className)}>
      {children}
    </span>
  );
}

/** Peta status → label Indonesia + warna. */
export const STATUS_LABEL: Record<string, { label: string; tone: keyof typeof tones }> = {
  planned: { label: "Direncanakan", tone: "gray" },
  ongoing: { label: "Berlangsung", tone: "green" },
  completed: { label: "Selesai", tone: "brown" },
  cancelled: { label: "Dibatalkan", tone: "red" },
  upcoming: { label: "Akan datang", tone: "green" },
  active: { label: "Aktif", tone: "green" },
  archived: { label: "Diarsipkan", tone: "brown" },
  draft: { label: "Draf", tone: "gray" },
  inactive: { label: "Nonaktif", tone: "gray" },
  // kategori berita
  kabar: { label: "Kabar", tone: "green" },
  prestasi: { label: "Prestasi", tone: "gold" },
  rekognisi: { label: "Rekognisi", tone: "brown" },
  // sumber angka (IBKAMA dalam Angka)
  manual: { label: "Manual", tone: "gray" },
  anggota: { label: "Otomatis · anggota", tone: "green" },
  berita: { label: "Otomatis · berita", tone: "green" },
  program_selesai: { label: "Otomatis · program selesai", tone: "green" },
  periode: { label: "Otomatis · periode", tone: "green" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABEL[status] ?? { label: status, tone: "gray" as const };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
