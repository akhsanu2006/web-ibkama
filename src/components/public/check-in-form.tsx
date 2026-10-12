"use client";
import { useActionState, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/ui/form";
import { PhotoCapture } from "@/components/public/photo-capture";
import { SignaturePad } from "@/components/public/signature-pad";
import { checkIn, type FormState } from "@/lib/actions/attendance";

/**
 * Formulir presensi publik. Isian terkontrol agar tidak terhapus bila server menolak
 * (React 19 mereset input tak-terkontrol setelah aksi form selesai).
 */
export function CheckInForm({ code, programName, requireSignature, requirePhoto }: {
  code: string; programName: string; requireSignature: boolean; requirePhoto: boolean;
}) {
  const action: (prev: FormState, form: FormData) => Promise<FormState> = checkIn.bind(null, code);
  const [state, formAction, pending] = useActionState(action, undefined);
  const err = state?.fieldErrors ?? {};
  const [v, setV] = useState({ name: "", identifier: "", studyProgram: "", cohort: "" });
  const bind = (k: keyof typeof v) => ({ id: k, name: k, value: v[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setV((s) => ({ ...s, [k]: e.target.value })) });

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state?.error && <p role="alert" className="rounded-2xl bg-danger-bg px-5 py-4 text-sm font-medium text-danger">{state.error}</p>}
      <Field label="Nama lengkap" htmlFor="name" required error={err.name}>
        <input {...bind("name")} autoComplete="name" className={inputCls} />
      </Field>
      <Field label="NIM / identitas" htmlFor="identifier" required error={err.identifier}>
        <input {...bind("identifier")} inputMode="numeric" className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Program studi" htmlFor="studyProgram"><input {...bind("studyProgram")} className={inputCls} /></Field>
        <Field label="Angkatan" htmlFor="cohort"><input {...bind("cohort")} inputMode="numeric" placeholder="mis. 2023" className={inputCls} /></Field>
      </div>

      {(requirePhoto || requireSignature) && (
        <div className="space-y-5 border-t border-line pt-5">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-green-700" aria-hidden />
            Bukti kehadiran hanya dapat dilihat pengurus untuk verifikasi, tidak ditampilkan di website.
          </p>
          {requirePhoto && (
            <Field label="Foto bukti kehadiran" htmlFor="photo" required error={err.photo}>
              <PhotoCapture name="photo" label={programName} invalid={!!err.photo} />
            </Field>
          )}
          {requireSignature && (
            <Field label="Tanda tangan digital" htmlFor="signature" required error={err.signature}>
              <SignaturePad name="signature" invalid={!!err.signature} />
            </Field>
          )}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Mencatat…" : "Konfirmasi Kehadiran"}</Button>
    </form>
  );
}
