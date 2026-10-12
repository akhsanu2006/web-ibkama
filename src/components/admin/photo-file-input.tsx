"use client";
import { useRef, useState } from "react";
import { pdfFirstPageToJpeg } from "@/lib/pdf-to-image";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

/**
 * Input foto. Bila `acceptPdf`, berkas PDF juga boleh dipilih: halaman pertamanya diubah menjadi JPG
 * di browser lalu menggantikan isi input, jadi yang terunggah tetap gambar.
 */
export function PhotoFileInput({ acceptPdf, className, ...common }: {
  id: string; name: string; "aria-invalid"?: boolean; acceptPdf?: boolean; className: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "ok" | "error"; msg?: string; preview?: string }>({ kind: "idle" });

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (status.preview) URL.revokeObjectURL(status.preview);
    if (!file || !acceptPdf || !(file.type === "application/pdf" || /\.pdf$/i.test(file.name))) { setStatus({ kind: "idle" }); return; }
    setStatus({ kind: "busy", msg: "Mengubah halaman pertama PDF menjadi foto…" });
    try {
      const jpg = await pdfFirstPageToJpeg(file);
      const dt = new DataTransfer();
      dt.items.add(jpg);
      input.files = dt.files;
      setStatus({ kind: "ok", msg: `PDF diubah menjadi foto (${jpg.name}). Foto inilah yang akan diunggah.`, preview: URL.createObjectURL(jpg) });
    } catch {
      input.value = "";
      setStatus({ kind: "error", msg: "PDF tidak dapat dibaca (mungkin rusak atau dikunci password). Coba berkas lain atau unggah JPG/PNG." });
    }
  }

  return (
    <div className="space-y-2">
      <input ref={ref} {...common} type="file" accept={acceptPdf ? `${IMAGE_ACCEPT},application/pdf` : IMAGE_ACCEPT}
        onChange={acceptPdf ? onChange : undefined} disabled={status.kind === "busy"} className={className} />
      {status.kind !== "idle" && (
        <div role={status.kind === "error" ? "alert" : "status"}
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-xs ${status.kind === "error" ? "bg-danger-bg text-danger" : "bg-green-50 text-green-900"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {status.preview && <img src={status.preview} alt="Pratinjau foto dari PDF" className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-line" />}
          <span>{status.msg}</span>
        </div>
      )}
    </div>
  );
}
