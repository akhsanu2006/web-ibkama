"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";

const MSG: Record<string, string> = {
  ditambahkan: "Data berhasil ditambahkan.", diperbarui: "Data berhasil diperbarui.", dihapus: "Data berhasil dihapus.",
  tersimpan: "Perubahan berhasil disimpan.", ditolak: "Anda tidak memiliki akses ke halaman tersebut.",
  dicopot: "Akses akun berhasil dicopot. Akun tidak bisa login lagi.", diaktifkan: "Akses akun aktif kembali untuk periode aktif.",
  "diri-sendiri": "Anda tidak dapat mencopot akses akun Anda sendiri.",
  "super-terakhir": "Tidak dapat mencopot Super Admin terakhir.",
  "tanpa-periode": "Belum ada periode aktif. Aktifkan periode terlebih dahulu.",
};
const FAILURES = new Set(["ditolak", "diri-sendiri", "super-terakhir", "tanpa-periode"]);

/** Toast sukses/peringatan dari ?ok=, ?akses=, atau ?gagal= (dibaca langsung dari URL) lalu membersihkan URL. */
export function Flash() {
  const params = useSearchParams();
  const code = params.get("ok") ?? params.get("akses") ?? params.get("gagal") ?? undefined;
  const [shown, setShown] = useState(!!code);
  const router = useRouter(); const path = usePathname();
  useEffect(() => {
    if (!code) return;
    setShown(true);
    const t = setTimeout(() => setShown(false), 4500);
    router.replace(path, { scroll: false });
    return () => clearTimeout(t);
  }, [code, path, router]);
  if (!shown || !code) return null;
  const denied = FAILURES.has(code);
  return (
    <div role="status" className={`fixed bottom-6 right-6 z-[70] flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-medium text-white shadow-lift ${denied ? "bg-danger" : "bg-green-800"}`}>
      <CheckCircle2 size={18} aria-hidden />{MSG[code] ?? code}
      <button onClick={() => setShown(false)} aria-label="Tutup" className="ml-2 opacity-70 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}
