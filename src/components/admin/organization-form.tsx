"use client";
import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/ui/form";
import { updateOrganization } from "@/lib/actions/organization";
import type { Organization } from "@/db/schema";

export function OrganizationForm({ org }: { org: Organization }) {
  const [state, formAction, pending] = useActionState(updateOrganization, undefined);
  const err = state?.fieldErrors ?? {};
  const [valueRows, setValueRows] = useState(org.values.length > 0 ? org.values : [{ title: "", description: "" }]);

  return (
    <form action={formAction} className="space-y-10" noValidate>
      {state?.error && <p role="alert" className="rounded-2xl bg-danger-bg px-5 py-4 text-sm font-medium text-danger">{state.error}</p>}

      <section className="space-y-5">
        <h2 className="text-lg">Identitas</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Nama lengkap" htmlFor="name" required error={err.name} className="md:col-span-2"><input id="name" name="name" defaultValue={org.name} className={inputCls} /></Field>
          <Field label="Nama singkat" htmlFor="shortName" required error={err.shortName}><input id="shortName" name="shortName" defaultValue={org.shortName} className={inputCls} /></Field>
          <Field label="Tagline" htmlFor="tagline" required error={err.tagline}><input id="tagline" name="tagline" defaultValue={org.tagline} className={inputCls} /></Field>
          <Field label="Deskripsi" htmlFor="description" required error={err.description} className="md:col-span-2"><textarea id="description" name="description" rows={4} defaultValue={org.description} className={inputCls} /></Field>
          <Field label="Sejarah" htmlFor="history" required error={err.history} className="md:col-span-2"><textarea id="history" name="history" rows={6} defaultValue={org.history} className={inputCls} /></Field>
        </div>
      </section>

      <section className="space-y-5 border-t border-line pt-8">
        <h2 className="text-lg">Visi, misi, tujuan</h2>
        <Field label="Visi" htmlFor="vision" required error={err.vision}><textarea id="vision" name="vision" rows={3} defaultValue={org.vision} className={inputCls} /></Field>
        <Field label="Misi" htmlFor="missions" required error={err.missions} help="Satu misi per baris.">
          <textarea id="missions" name="missions" rows={6} defaultValue={org.missions.join("\n")} className={inputCls} />
        </Field>
        <Field label="Tujuan" htmlFor="goals" required error={err.goals}><textarea id="goals" name="goals" rows={3} defaultValue={org.goals} className={inputCls} /></Field>
      </section>

      <section className="space-y-4 border-t border-line pt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg">Nilai organisasi</h2>
          <Button type="button" variant="ghost" size="sm" onClick={() => setValueRows((r) => [...r, { title: "", description: "" }])}><Plus size={15} /> Tambah nilai</Button>
        </div>
        {err.value_title_0 && <p role="alert" className="text-xs font-medium text-danger">{err.value_title_0}</p>}
        <div className="space-y-4">
          {valueRows.map((v, i) => (
            <div key={i} className="grid gap-3 rounded-2xl bg-green-50/60 p-4 md:grid-cols-[1fr_2fr_auto] md:items-start">
              <input name={`value_title_${i}`} defaultValue={v.title} placeholder="Judul nilai" className={inputCls} />
              <input name={`value_desc_${i}`} defaultValue={v.description} placeholder="Deskripsi singkat" className={inputCls} />
              <button type="button" aria-label="Hapus nilai ini" onClick={() => setValueRows((r) => r.filter((_, j) => j !== i))} className="grid size-11 place-items-center rounded-full text-danger hover:bg-danger-bg justify-self-start md:justify-self-auto"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5 border-t border-line pt-8">
        <h2 className="text-lg">Kontak resmi</h2>
        <p className="text-xs text-muted">Jangan ganti dengan kontak yang belum resmi. Data ini tampil di halaman Kontak dan footer publik.</p>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Alamat / sekretariat" htmlFor="address" className="md:col-span-2"><textarea id="address" name="address" rows={2} defaultValue={org.address ?? ""} className={inputCls} /></Field>
          <Field label="Email" htmlFor="email" error={err.email}><input id="email" name="email" type="email" defaultValue={org.email ?? ""} className={inputCls} /></Field>
          <Field label="Nomor kontak" htmlFor="phone"><input id="phone" name="phone" defaultValue={org.phone ?? ""} className={inputCls} /></Field>
          <Field label="WhatsApp" htmlFor="whatsapp"><input id="whatsapp" name="whatsapp" defaultValue={org.whatsapp ?? ""} className={inputCls} /></Field>
          <Field label="Website" htmlFor="website" error={err.website}><input id="website" name="website" defaultValue={org.website ?? ""} className={inputCls} /></Field>
          <Field label="Instagram (handle)" htmlFor="instagramHandle"><input id="instagramHandle" name="instagramHandle" defaultValue={org.instagramHandle ?? ""} className={inputCls} /></Field>
          <Field label="Instagram (tautan)" htmlFor="instagramUrl" error={err.instagramUrl}><input id="instagramUrl" name="instagramUrl" defaultValue={org.instagramUrl ?? ""} className={inputCls} /></Field>
          <Field label="Nama WhatsApp Channel" htmlFor="waChannelName"><input id="waChannelName" name="waChannelName" defaultValue={org.waChannelName ?? ""} className={inputCls} /></Field>
          <Field label="Tautan WhatsApp Channel" htmlFor="waChannelUrl" error={err.waChannelUrl}><input id="waChannelUrl" name="waChannelUrl" defaultValue={org.waChannelUrl ?? ""} className={inputCls} /></Field>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3 border-t border-line pt-6">
        <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan Perubahan"}</Button>
      </div>
    </form>
  );
}
