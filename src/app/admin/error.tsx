"use client";
import { ErrorState } from "@/components/ui/empty-state";

/** Batas galat dashboard: pesan umum saja — detail galat tidak ditampilkan (hanya di log server). */
export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return <div className="mx-auto max-w-2xl py-16"><ErrorState onRetry={reset} message="Halaman dashboard belum dapat dimuat. Coba lagi, atau muat ulang beberapa saat lagi." /></div>;
}
