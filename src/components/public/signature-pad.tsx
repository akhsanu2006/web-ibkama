"use client";
import { useEffect, useRef, useState } from "react";
import { Eraser, PenLine } from "lucide-react";

/**
 * Kanvas tanda tangan digital (jari/stylus/mouse). Hasil PNG dikirim lewat input tersembunyi `name`
 * sebagai data URL; kosong bila belum ditandatangani.
 */
export function SignaturePad({ name, invalid }: { name: string; invalid?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  // nilai terkontrol: React 19 mereset input tak-terkontrol setelah aksi form, termasuk saat ada error validasi
  const [value, setValue] = useState("");
  const signed = value !== "";

  // Ukuran kanvas mengikuti lebar elemen × devicePixelRatio agar garis tajam.
  useEffect(() => {
    const c = canvas.current!;
    const fit = () => {
      const r = c.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      c.width = Math.round(r.width * dpr);
      c.height = Math.round(r.height * dpr);
      const ctx = c.getContext("2d")!;
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = 2.4; ctx.strokeStyle = "#17331f";
    };
    fit();
    // ukuran ulang menghapus isi kanvas → wajib tanda tangan ulang
    const ro = new ResizeObserver(() => { fit(); setValue(""); });
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  const point = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !last.current) return;
    const p = point(e), ctx = canvas.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.quadraticCurveTo(last.current.x, last.current.y, (last.current.x + p.x) / 2, (last.current.y + p.y) / 2);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    // simpan dengan latar putih (PNG transparan sulit dibaca di rekap)
    const src = canvas.current!;
    const out = document.createElement("canvas");
    out.width = src.width; out.height = src.height;
    const ctx = out.getContext("2d")!;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(src, 0, 0);
    setValue(out.toDataURL("image/png"));
  };
  const clear = () => {
    const c = canvas.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setValue("");
  };

  return (
    <div>
      <div className={`relative overflow-hidden rounded-2xl bg-white ring-1 ${invalid ? "ring-danger" : "ring-line"}`}>
        <canvas
          ref={canvas}
          aria-label="Area tanda tangan digital"
          className="block h-44 w-full cursor-crosshair touch-none"
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up}
        />
        {!signed && (
          <span className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted/70">
            <span className="flex items-center gap-2"><PenLine size={16} aria-hidden /> Tanda tangan di sini</span>
          </span>
        )}
        <span aria-hidden className="pointer-events-none absolute inset-x-6 bottom-10 border-b border-dashed border-line" />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className={signed ? "font-semibold text-green-700" : "text-muted"}>{signed ? "✓ Tanda tangan tersimpan" : "Gunakan jari atau stylus."}</span>
        <button type="button" onClick={clear} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold text-green-800 hover:bg-green-50">
          <Eraser size={14} aria-hidden /> Ulangi
        </button>
      </div>
      <input type="hidden" name={name} value={value} readOnly />
    </div>
  );
}
