"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/ui/form";
import { updateIntegration, type FormState } from "@/lib/actions/integrations";
import type { Integration } from "@/db/schema";

export function IntegrationForm({ integration }: { integration: Integration }) {
  const action: (prev: FormState, form: FormData) => Promise<FormState> = updateIntegration.bind(null, integration.key);
  const [state, formAction, pending] = useActionState(action, undefined);
  const err = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-line shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-heading text-base font-bold text-green-950">{integration.label}</h3>
        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${integration.enabled ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-500"}`}>
          {integration.enabled ? "Terhubung" : "Belum dikonfigurasi"}
        </span>
      </div>
      {state?.error && <p role="alert" className="rounded-2xl bg-danger-bg px-4 py-3 text-sm text-danger">{state.error}</p>}
      <Field label="Tautan" htmlFor={`url-${integration.key}`} error={err.url} help="Tautan publik resmi, mis. Instagram, WhatsApp, formulir Google, atau kalender.">
        <input id={`url-${integration.key}`} name="url" defaultValue={integration.url ?? ""} placeholder="https://" className={inputCls} />
      </Field>
      <Field label="Tautan embed (opsional)" htmlFor={`embed-${integration.key}`} error={err.embedUrl} help="Untuk embed Google Calendar/Forms bila diperlukan.">
        <input id={`embed-${integration.key}`} name="embedUrl" defaultValue={integration.embedUrl ?? ""} placeholder="https://" className={inputCls} />
      </Field>
      <label className="flex items-center gap-3 text-sm font-medium text-green-950">
        <input type="checkbox" name="enabled" defaultChecked={integration.enabled} className="size-4 accent-green-800" /> Aktifkan integrasi ini
      </label>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Menyimpan…" : "Simpan"}</Button>
      </div>
    </form>
  );
}
