import Image from "next/image";
import Link from "next/link";
import { Check, ImageOff, Pencil, X } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { deleteResource } from "@/lib/actions/resource";
import { formatDate } from "@/lib/period";
import type { Option } from "@/lib/queries/admin";
import type { Column, LookupKey } from "@/lib/resources/types";
import { DeleteButton } from "./delete-button";

type Row = Record<string, unknown>;

function Cell({ col, row, lookups }: { col: Column; row: Row; lookups: Record<LookupKey, Option[]> }) {
  const v = row[col.name];
  if (col.kind === "image") {
    return v ? (
      <div className="relative size-10 overflow-hidden rounded-xl ring-1 ring-line">
        <Image src={`/media/${v}`} alt="" fill sizes="40px" className="object-cover" unoptimized />
      </div>
    ) : (
      <span className="grid size-10 place-items-center rounded-xl bg-green-50 text-green-300"><ImageOff size={16} aria-hidden /></span>
    );
  }
  if (col.kind === "bool") return v ? <Check size={16} className="text-green-700" aria-label="Ya" /> : <X size={16} className="text-muted/50" aria-label="Tidak" />;
  if (col.kind === "status") return v ? <StatusBadge status={String(v)} /> : <span className="text-muted">—</span>;
  if (col.kind === "date") return <span>{v ? formatDate(String(v)) : "—"}</span>;
  if (col.kind === "lookup" && col.lookup) {
    const opt = lookups[col.lookup]?.find((o) => o.value === v);
    return <span>{opt?.label ?? (v ? String(v) : "—")}</span>;
  }
  const s = v === null || v === undefined || v === "" ? "—" : String(v);
  return <span className="line-clamp-2">{s}</span>;
}

export function ResourceTable({ slug, columns, rows, lookups, canUpdate, canDelete, rowLabel }: {
  slug: string; columns: Column[]; rows: Row[]; lookups: Record<LookupKey, Option[]>;
  canUpdate: boolean; canDelete: boolean;
  rowLabel: (row: Row) => string;
}) {
  return (
    <div className="overflow-x-auto rounded-3xl bg-white ring-1 ring-line shadow-soft">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wider text-muted">
            {columns.map((c) => <th key={c.name} className="px-5 py-4 font-semibold">{c.label}</th>)}
            {(canUpdate || canDelete) && <th className="px-5 py-4"><span className="sr-only">Aksi</span></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row.id)} className="border-b border-line/70 last:border-0 hover:bg-green-50/40">
              {columns.map((c) => <td key={c.name} className="px-5 py-3.5 align-middle text-ink/90">{Cell({ col: c, row, lookups })}</td>)}
              {(canUpdate || canDelete) && (
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1.5">
                    {canUpdate && (
                      <Link href={`/admin/${slug}/${row.id}`} aria-label={`Ubah ${rowLabel(row)}`} className="grid size-9 place-items-center rounded-full text-green-800 hover:bg-green-50">
                        <Pencil size={15} aria-hidden />
                      </Link>
                    )}
                    {canDelete && <DeleteButton action={deleteResource.bind(null, slug, String(row.id))} itemName={rowLabel(row)} iconOnly />}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
