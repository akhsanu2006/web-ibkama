"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, SwitchCamera } from "lucide-react";

const MAX_W = 960;

/**
 * Foto bukti kehadiran diambil LANGSUNG dari kamera (bukan galeri), lalu diberi stempel
 * "IBKAMA UMY · nama kegiatan · tanggal & jam" agar sulit dipakai ulang/dimanipulasi.
 * Cadangan bila kamera web tak tersedia: input kamera bawaan HP (capture).
 * Hasil JPEG dikirim lewat input tersembunyi `name` sebagai data URL.
 */
export function PhotoCapture({ name, label, invalid }: { name: string; label: string; invalid?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const fallback = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"idle" | "live" | "done">("idle");
  const [facing, setFacing] = useState<"user" | "environment">("user");
  // nilai terkontrol (lihat SignaturePad): foto tidak hilang bila server menolak isian lain
  const [preview, setPreview] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const stop = () => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; };
  useEffect(() => stop, []);

  async function start(f = facing) {
    setMsg(null);
    if (!navigator.mediaDevices?.getUserMedia) { fallback.current?.click(); return; }
    try {
      stop();
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: f, width: { ideal: 1280 } }, audio: false });
      setMode("live");
      requestAnimationFrame(() => { if (video.current) { video.current.srcObject = stream.current; video.current.play().catch(() => {}); } });
    } catch {
      setMsg("Kamera tidak bisa dibuka (izin ditolak?). Membuka kamera bawaan HP…");
      fallback.current?.click();
    }
  }

  /** Gambar sumber ke kanvas (maks lebar MAX_W) + pita stempel di bawah, lalu simpan. */
  function finish(src: CanvasImageSource, w: number, h: number) {
    const scale = Math.min(1, MAX_W / w);
    const c = document.createElement("canvas");
    c.width = Math.round(w * scale); c.height = Math.round(h * scale);
    const ctx = c.getContext("2d")!;
    ctx.drawImage(src, 0, 0, c.width, c.height);
    const band = Math.max(34, Math.round(c.height * 0.075));
    ctx.fillStyle = "rgba(23, 51, 31, .8)";
    ctx.fillRect(0, c.height - band, c.width, band);
    ctx.fillStyle = "#fff";
    ctx.font = `600 ${Math.round(band * 0.36)}px system-ui, sans-serif`;
    ctx.textBaseline = "middle";
    const when = new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "medium" });
    ctx.fillText(`IBKAMA UMY · ${label} · ${when}`.slice(0, 90), Math.round(band * 0.35), c.height - band / 2, c.width - band * 0.7);
    const url = c.toDataURL("image/jpeg", 0.82);
    setPreview(url);
    setMode("done");
  }

  function snap() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    // pratinjau kamera depan dicerminkan agar nyaman, tetapi foto bukti disimpan TIDAK terbalik
    // supaya tulisan (spanduk, papan nama kegiatan) tetap terbaca
    finish(v, v.videoWidth, v.videoHeight);
    stop();
  }

  function fromFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const img = new Image();
    img.onload = () => { finish(img, img.naturalWidth, img.naturalHeight); URL.revokeObjectURL(img.src); };
    img.onerror = () => setMsg("Foto tidak dapat dibaca. Coba lagi.");
    img.src = URL.createObjectURL(file);
  }

  function retake() {
    setPreview(null);
    setMode("idle");
    start();
  }

  return (
    <div>
      <div className={`relative overflow-hidden rounded-2xl bg-green-950 ring-1 ${invalid ? "ring-danger" : "ring-line"}`}>
        {mode === "live" && (
          <>
            <video ref={video} playsInline muted className={`aspect-[4/3] w-full object-cover ${facing === "user" ? "-scale-x-100" : ""}`} />
            <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-3">
              <button type="button" onClick={snap} aria-label="Ambil foto" className="grid size-16 place-items-center rounded-full bg-white shadow-lift ring-4 ring-white/40 transition active:scale-95">
                <Camera size={24} className="text-green-900" aria-hidden />
              </button>
              <button type="button" aria-label="Ganti kamera depan/belakang"
                onClick={() => { const f = facing === "user" ? "environment" : "user"; setFacing(f); start(f); }}
                className="absolute right-3 grid size-10 place-items-center rounded-full bg-white/20 text-white backdrop-blur">
                <SwitchCamera size={18} aria-hidden />
              </button>
            </div>
          </>
        )}
        {mode === "done" && preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Pratinjau foto bukti kehadiran" className="w-full" />
        )}
        {mode === "idle" && (
          <button type="button" onClick={() => start()} className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 text-white/85 transition hover:text-white">
            <span className="grid size-14 place-items-center rounded-full bg-white/10"><Camera size={24} aria-hidden /></span>
            <span className="text-sm font-semibold">Buka kamera & ambil foto</span>
            <span className="max-w-[16rem] text-center text-xs text-white/60">Foto diambil langsung saat ini dan diberi stempel waktu.</span>
          </button>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className={mode === "done" ? "font-semibold text-green-700" : "text-muted"}>{msg ?? (mode === "done" ? "✓ Foto tersimpan" : "Pastikan wajah dan suasana kegiatan terlihat.")}</span>
        {mode === "done" && (
          <button type="button" onClick={retake} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold text-green-800 hover:bg-green-50">
            <RefreshCw size={14} aria-hidden /> Foto ulang
          </button>
        )}
      </div>
      <input ref={fallback} type="file" accept="image/*" capture="user" className="hidden" onChange={fromFile} tabIndex={-1} aria-hidden />
      <input type="hidden" name={name} value={preview ?? ""} readOnly />
    </div>
  );
}
