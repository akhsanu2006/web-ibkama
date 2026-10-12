"use client";
import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/ui/form";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      <Field label="Email" htmlFor="email"><input id="email" name="email" type="email" autoComplete="username" required className={inputCls} /></Field>
      <Field label="Password" htmlFor="password"><input id="password" name="password" type="password" autoComplete="current-password" required className={inputCls} /></Field>
      {state?.error && <p role="alert" className="rounded-2xl bg-danger-bg px-4 py-3 text-sm text-danger">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Memeriksa…" : "Masuk"}</Button>
    </form>
  );
}
