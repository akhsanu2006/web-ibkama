"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/actions/resource";

/** Konfirmasi hapus (dialog native, aksesibel). `action` = server action yang mengembalikan FormState. */
export function DeleteButton({ action, label = "Hapus", itemName, iconOnly }: {
  action: () => Promise<FormState>; label?: string; itemName: string; iconOnly?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, run, pending] = useActionState(async () => action(), undefined);
  const [, force] = useState(0);
  useEffect(() => { if (state?.error) force((n) => n + 1); }, [state]);
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} aria-label={`${label} ${itemName}`}
        className={iconOnly ? "grid size-9 place-items-center rounded-full text-danger hover:bg-danger-bg" : "inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-semibold text-danger ring-1 ring-inset ring-danger/30 hover:bg-danger-bg"}>
        <Trash2 size={15} aria-hidden />{!iconOnly && label}
      </button>
      <dialog ref={ref} className="m-auto w-[min(92vw,26rem)] rounded-3xl p-0 shadow-lift backdrop:bg-black/40">
        <form action={run} className="p-7">
          <h2 className="text-lg">Hapus data ini?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted"><strong className="text-ink">{itemName}</strong> akan dihapus permanen dan tidak dapat dikembalikan.</p>
          {state?.error && <p role="alert" className="mt-4 rounded-2xl bg-danger-bg px-4 py-3 text-sm text-danger">{state.error}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => ref.current?.close()}>Batal</Button>
            <Button type="submit" variant="danger" size="sm" disabled={pending}>{pending ? "Menghapus…" : "Ya, hapus"}</Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
