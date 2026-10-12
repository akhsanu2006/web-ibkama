"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/ui/form";
import { ADMIN_POSITIONS } from "@/lib/permissions";
import type { FormState } from "@/lib/actions/users";

type Defaults = { name?: string; email?: string; role?: "admin" | "super_admin"; adminPosition?: string | null; isActive?: boolean };

export function UserForm({ action, defaults, mode, submitLabel, cancelHref, activePeriodName }: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  defaults?: Defaults; mode: "create" | "edit"; submitLabel: string; cancelHref: string;
  /** Nama periode aktif — akses Admin terikat ke periode ini. null = belum ada periode aktif. */
  activePeriodName: string | null;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [role, setRole] = useState<"admin" | "super_admin">(defaults?.role ?? "admin");
  const err = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-xl space-y-6" noValidate>
      {state?.error && <p role="alert" className="rounded-2xl bg-danger-bg px-5 py-4 text-sm font-medium text-danger">{state.error}</p>}

      <Field label="Nama lengkap" htmlFor="name" required error={err.name}>
        <input id="name" name="name" defaultValue={defaults?.name} className={inputCls} />
      </Field>

      {mode === "create" ? (
        <Field label="Email" htmlFor="email" required error={err.email} help="Dipakai untuk login. Untuk masuk dengan Google, isi dengan alamat akun Google (Gmail) pengguna.">
          <input id="email" name="email" type="email" defaultValue={defaults?.email} className={inputCls} />
        </Field>
      ) : (
        <Field label="Email" htmlFor="email-display" help="Email tidak dapat diubah di sini.">
          <input id="email-display" disabled defaultValue={defaults?.email} className={`${inputCls} text-muted`} />
        </Field>
      )}

      <Field label="Peran" htmlFor="role" required error={err.role}>
        <select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value as "admin" | "super_admin")} className={inputCls}>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </Field>

      {role === "admin" && (
        <p className={`rounded-2xl px-4 py-3.5 text-[13px] leading-relaxed ${activePeriodName ? "bg-green-50 text-green-900" : "bg-brown-100 text-brown-800"}`}>
          {activePeriodName
            ? <>Akses Admin berlaku untuk periode aktif <strong>{activePeriodName}</strong> dan berakhir otomatis saat periode baru diaktifkan.</>
            : <>Belum ada periode aktif — akun Admin baru bisa dibuat setelah Super Admin mengaktifkan periode.</>}
        </p>
      )}

      {role === "admin" && (
        <Field label="Jabatan admin (opsional)" htmlFor="adminPosition" error={err.adminPosition} help="Label jabatan; izin tetap mengikuti peran Admin.">
          <select id="adminPosition" name="adminPosition" defaultValue={defaults?.adminPosition ?? ""} className={inputCls}>
            <option value="">— Tidak ditentukan —</option>
            {ADMIN_POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </Field>
      )}

      <Field label={mode === "create" ? "Password (opsional)" : "Password baru (opsional)"} htmlFor={mode === "create" ? "password" : "newPassword"} error={err.password ?? err.newPassword}
        help={mode === "create" ? "Minimal 8 karakter. Kosongkan bila pengguna hanya masuk dengan akun Google." : "Minimal 8 karakter. Kosongkan bila tidak diubah."}>
        <input id={mode === "create" ? "password" : "newPassword"} name={mode === "create" ? "password" : "newPassword"} type="password" autoComplete="new-password" placeholder={mode === "edit" ? "Biarkan kosong bila tidak diubah" : undefined} className={inputCls} />
      </Field>

      <label className="flex items-center gap-3 rounded-2xl bg-green-50 px-4 py-3.5 text-sm font-medium text-green-950">
        <input type="checkbox" name="isActive" defaultChecked={defaults?.isActive ?? true} className="size-4 accent-green-800" /> Akun aktif (dapat login)
      </label>

      <div className="flex items-center justify-end gap-3 border-t border-line pt-6">
        <Link href={cancelHref} className="rounded-full px-5 py-2.5 text-sm font-semibold text-muted hover:bg-green-50">Batal</Link>
        <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : submitLabel}</Button>
      </div>
    </form>
  );
}
