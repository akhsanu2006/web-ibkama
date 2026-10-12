import { EmptyState } from "@/components/ui/empty-state";
export default function NotFound() {
  return <div className="mx-auto max-w-2xl px-6 pb-20 pt-40"><EmptyState title="Halaman tidak ditemukan" hint="Tautan mungkin salah, atau data tersebut tidak lagi tersedia untuk publik." action={{ href: "/", label: "Kembali ke beranda" }} /></div>;
}
