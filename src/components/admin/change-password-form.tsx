"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/ui/form";
import { changeOwnPassword, type AccountState } from "@/lib/actions/account";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<AccountState, FormData>(changeOwnPassword, undefined);
  const err = state?.fieldErrors ?? {};
  return (
    <form action={action} className="max-w-md space-y-5" noValidate>
      {state?.error && <p role="alert" className="rounded-2xl bg-danger-bg px-5 py-4 text-sm font-medium text-danger">{state.error}</p>}
      {state?.ok && <p role="status" className="rounded-2xl bg-green-50 px-5 py-4 text-sm font-semibold text-green-900">✓ {state.ok}</p>}
      <Field label="Password saat ini" htmlFor="currentPassword" required error={err.currentPassword}>
        <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" className={inputCls} />
      </Field>
      <Field label="Password baru" htmlFor="newPassword" required error={err.newPassword} help="Minimal 8 karakter dan berbeda dari password saat ini.">
        <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" className={inputCls} />
      </Field>
      <Field label="Ulangi password baru" htmlFor="confirmPassword" required error={err.confirmPassword}>
        <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" className={inputCls} />
      </Field>
      <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Ganti Password"}</Button>
    </form>
  );
}
