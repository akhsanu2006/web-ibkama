"use client";
import { ShieldCheck, ShieldOff } from "lucide-react";

/** Tombol copot / aktifkan-kembali akses pengguna, dengan konfirmasi sebelum mencopot. */
export function AccessButton({ action, kind, itemName }: {
  action: () => Promise<void>; kind: "revoke" | "restore"; itemName: string;
}) {
  const revoke = kind === "revoke";
  return (
    <form action={action}
      onSubmit={(e) => { if (revoke && !confirm(`Copot akses ${itemName}? Akun tidak bisa login sampai diaktifkan kembali.`)) e.preventDefault(); }}>
      <button type="submit"
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ring-1 ring-inset transition ${revoke ? "text-danger ring-danger/30 hover:bg-danger-bg" : "text-green-800 ring-green-200 hover:bg-green-50"}`}>
        {revoke ? <ShieldOff size={13} aria-hidden /> : <ShieldCheck size={13} aria-hidden />}
        {revoke ? "Copot" : "Aktifkan"}
      </button>
    </form>
  );
}
