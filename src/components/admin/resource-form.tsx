"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { saveResource } from "@/lib/actions/resource";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/ui/form";
import { PhotoFileInput } from "@/components/admin/photo-file-input";
import type { Field as F } from "@/lib/resources/types";

const fileCls = "block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-green-100 file:px-4 file:py-2.5 file:text-[13px] file:font-semibold file:text-green-900 hover:file:bg-green-200";

type Option = { value: string; label: string; periodId?: string; short?: string };
type Props = {
  slug: string; id: string | null; fields: F[]; values: Record<string, unknown>;
  lookups: Record<string, Option[]>; cancelHref: string; submitLabel: string;
};

export function ResourceForm({ slug, id, fields, values, lookups, cancelHref, submitLabel }: Props) {
  const [state, action, pending] = useActionState(saveResource.bind(null, slug, id), undefined);
  const err = state?.fieldErrors ?? {};
  // Periode terpilih di form: divisi/anggota/program lain ikut disaring ke periode ini saja.
  const [period, setPeriod] = useState(String(values.periodId ?? ""));
  const hasPeriodField = fields.some((f) => f.name === "periodId");

  return (
    <form action={action} className="space-y-6" noValidate>
      {state?.error && <p role="alert" className="rounded-2xl bg-danger-bg px-5 py-4 text-sm font-medium text-danger">{state.error}</p>}
      <div className="grid gap-5 md:grid-cols-2">
        {fields.map((f) => {
          const v = values[f.name];
          const cur = v ?? f.default ?? "";
          const span = f.span === 2 || f.type === "textarea" || f.type === "checkbox" || f.type === "image" || f.type === "file" ? "md:col-span-2" : "";
          const common = { id: f.name, name: f.name, "aria-invalid": !!err[f.name] || undefined };
          let control: React.ReactNode;
          if (f.type === "textarea") control = <textarea {...common} rows={4} defaultValue={String(cur)} className={inputCls} placeholder={f.placeholder} />;
          else if (f.type === "select") {
            let opts: Option[] = f.options ?? lookups[f.lookup!] ?? [];
            const filterByPeriod = hasPeriodField && f.name !== "periodId" && opts.some((o) => o.periodId);
            if (filterByPeriod) opts = period ? opts.filter((o) => o.periodId === period).map((o) => ({ ...o, label: o.short ?? o.label })) : [];
            control = (
              <select key={filterByPeriod ? `${f.name}-${period}` : f.name} {...common} defaultValue={String(cur)} className={inputCls}
                onChange={f.name === "periodId" ? (e) => setPeriod(e.target.value) : undefined}>
                <option value="">{f.required ? "— Pilih —" : "— Tidak ada —"}</option>
                {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            );
          } else if (f.type === "checkbox") {
            return (
              <label key={f.name} className={`flex items-center gap-3 rounded-2xl bg-green-50 px-4 py-3.5 text-sm font-medium text-green-950 ${span}`}>
                <input type="checkbox" name={f.name} defaultChecked={Boolean(v ?? f.default)} className="size-4 accent-green-800" />{f.label}
              </label>
            );
          } else if (f.type === "image" || f.type === "file") {
            control = (
              <div className="space-y-3">
                {typeof v === "string" && v && (
                  <div className="flex items-center gap-4 rounded-2xl bg-green-50 p-3">
                    {f.type === "image"
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={`/media/${v}`} alt="Berkas saat ini" className="size-16 rounded-xl object-cover" />
                      : <a href={`/media/${v}`} className="text-sm font-semibold text-green-800 underline">Berkas saat ini</a>}
                    <label className="flex items-center gap-2 text-xs text-muted"><input type="checkbox" name={`remove_${f.name}`} className="accent-red-700" /> Hapus berkas ini</label>
                  </div>
                )}
                {f.type === "image"
                  ? <PhotoFileInput {...common} acceptPdf={f.acceptPdf} className={fileCls} />
                  : <input {...common} type="file" className={fileCls} />}
              </div>
            );
          } else control = <input {...common} type={f.type === "number" ? "number" : f.type} min={f.type === "number" ? 0 : undefined} defaultValue={String(cur)} placeholder={f.placeholder} className={inputCls} />;
          return <Field key={f.name} label={f.label} htmlFor={f.name} help={f.help} error={err[f.name]} required={f.required} className={span}>{control}</Field>;
        })}
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-line pt-6">
        <Link href={cancelHref} className="rounded-full px-5 py-2.5 text-sm font-semibold text-muted hover:bg-green-50">Batal</Link>
        <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : submitLabel}</Button>
      </div>
    </form>
  );
}
