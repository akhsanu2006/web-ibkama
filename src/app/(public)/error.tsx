"use client";
import { ErrorState } from "@/components/ui/empty-state";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <div className="mx-auto max-w-2xl px-6 pb-20 pt-40"><ErrorState onRetry={reset} message="Data belum dapat dimuat. Coba lagi beberapa saat." /></div>;
}
