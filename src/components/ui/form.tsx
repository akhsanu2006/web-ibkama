import clsx from "clsx";

export const inputCls =
  "block w-full rounded-2xl border-0 bg-white px-4 py-3 text-sm text-ink ring-1 ring-inset ring-line placeholder:text-muted/60 focus:ring-2 focus:ring-green-700 disabled:bg-neutral-50";

export function Field({ label, htmlFor, help, error, required, children, className }: {
  label: string; htmlFor: string; help?: string; error?: string; required?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={clsx("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-[13px] font-semibold text-green-950">
        {label}{required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
      </label>
      {children}
      {help && !error && <p className="text-xs text-muted">{help}</p>}
      {error && <p role="alert" className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
