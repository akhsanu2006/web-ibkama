import { Search } from "lucide-react";

/** Form pencarian GET sederhana; mempertahankan parameter lain lewat hidden input. */
export function SearchBox({ q, placeholder, keep = {} }: { q?: string; placeholder: string; keep?: Record<string, string | undefined> }) {
  return (
    <form className="relative w-full max-w-xs">
      {Object.entries(keep).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
      <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
      <input type="search" name="q" defaultValue={q} placeholder={placeholder}
        className="w-full rounded-full border-0 bg-white py-2.5 pl-10 pr-4 text-sm ring-1 ring-inset ring-line placeholder:text-muted/60 focus:ring-2 focus:ring-green-700" />
    </form>
  );
}
