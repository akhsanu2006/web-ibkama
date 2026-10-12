import { Inbox } from "lucide-react";
import { ButtonLink } from "./button";

/** State kosong: selalu jelaskan kenapa kosong dan apa langkah berikutnya. */
export function EmptyState({ title, hint, action, className }: {
  title: string; hint?: string; action?: { href: string; label: string }; className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-dashed border-green-200 bg-green-50/60 px-6 py-14 text-center ${className ?? ""}`}>
      <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-white text-green-700 shadow-soft">
        <Inbox size={20} aria-hidden />
      </span>
      <p className="font-heading text-base font-semibold text-green-900">{title}</p>
      {hint && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{hint}</p>}
      {action && <div className="mt-6"><ButtonLink href={action.href} size="sm">{action.label}</ButtonLink></div>}
    </div>
  );
}

export function ErrorState({ message = "Terjadi kesalahan saat memuat data.", onRetry }: {
  message?: string; onRetry?: () => void;
}) {
  return (
    <div role="alert" className="rounded-3xl border border-danger/20 bg-danger-bg px-6 py-10 text-center">
      <p className="font-heading font-semibold text-danger">Ups, ada kendala</p>
      <p className="mt-2 text-sm text-muted">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-5 rounded-full bg-danger px-5 py-2 text-sm font-semibold text-white">
          Coba lagi
        </button>
      )}
    </div>
  );
}
