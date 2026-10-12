"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/ui/form";
import type { FormState } from "@/lib/actions/period";

export function PeriodForm({ action, defaults, submitLabel, cancelHref }: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  defaults?: { name?: string; description?: string | null };
  submitLabel: string; cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const err = state?.fieldErrors ?? {};
  return (
    <form action={formAction} className="max-w-xl space-y-6" noValidate>
      {state?.error && <p role="alert" className="rounded-2xl bg-danger-bg px-5 py-4 text-sm font-medium text-danger">{state.error}</p>}
      <Field label="Nama periode" htmlFor="name" required error={err.name} help="Format tahun/tahun, mis. 2027/2028.">
        <input id="name" name="name" defaultValue={defaults?.name} placeholder="2027/2028" className={inputCls} />
      </Field>
      <Field label="Keterangan (opsional)" htmlFor="description" error={err.description}>
        <textarea id="description" name="description" rows={3} defaultValue={defaults?.description ?? ""} className={inputCls} />
      </Field>
      <div className="flex items-center justify-end gap-3 border-t border-line pt-6">
        <Link href={cancelHref} className="rounded-full px-5 py-2.5 text-sm font-semibold text-muted hover:bg-green-50">Batal</Link>
        <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : submitLabel}</Button>
      </div>
    </form>
  );
}
