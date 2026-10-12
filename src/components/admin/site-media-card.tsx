"use client";
import { useActionState, useEffect, useState } from "react";
import { ImageIcon, RotateCcw, Upload, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { replaceSiteMedia, resetSiteMedia, type SiteMediaState } from "@/lib/actions/site-media";
import type { SiteMediaSlot } from "@/content/site-media";

const LIMIT = { image: 8, video: 50 } as const; // MB — sama dengan batas server (src/lib/media.ts)
const ACCEPT = { image: "image/jpeg,image/png,image/webp", video: "video/mp4,video/webm" } as const;

/** Satu slot foto/video halaman publik: pratinjau saat ini, pilih pengganti (dengan pratinjau), simpan, atau kembalikan ke bawaan. */
export function SiteMediaCard({ slot, url, custom, canEdit }: { slot: SiteMediaSlot; url: string | null; custom: boolean; canEdit: boolean }) {
  const [picked, setPicked] = useState<{ url: string; name: string } | null>(null);
  // setelah berhasil, buang pratinjau lokal → kartu menampilkan media baru dari server + pesan sukses
  const [note, setNote] = useState<SiteMediaState>(undefined); // hasil aksi TERAKHIR (ganti atau kembalikan)
  const [, action, pending] = useActionState<SiteMediaState, FormData>(async (prev, fd) => {
    const r = await replaceSiteMedia(slot.key, prev, fd);
    if (r?.ok) setPicked(null);
    setNote(r);
    return r;
  }, undefined);
  const [, resetAction, resetting] = useActionState<SiteMediaState>(async () => {
    const r = await resetSiteMedia(slot.key);
    setPicked(null);
    setNote(r);
    return r;
  }, undefined);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => () => { if (picked) URL.revokeObjectURL(picked.url); }, [picked]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setLocalError(null);
    setNote(undefined);
    if (!f) return setPicked(null);
    if (f.size > LIMIT[slot.kind] * 1024 * 1024) {
      e.target.value = "";
      setPicked(null);
      return setLocalError(`Ukuran berkas ${(f.size / 1024 / 1024).toFixed(1)} MB melebihi batas ${LIMIT[slot.kind]} MB.`);
    }
    setPicked({ url: URL.createObjectURL(f), name: f.name });
  }

  const show = picked?.url ?? url;
  const msg = localError ?? note?.error;
  const ok = !msg && !picked ? note?.ok : null;
  const Icon = slot.kind === "video" ? Video : ImageIcon;

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-line">
      <div className="relative aspect-video bg-green-950">
        {show ? (
          slot.kind === "video"
            ? <video key={show} src={show} muted loop playsInline autoPlay controls className="size-full object-contain" />
            // eslint-disable-next-line @next/next/no-img-element
            : <img key={show} src={show} alt={`Pratinjau ${slot.title}`} className="size-full object-contain" />
        ) : (
          <div className="grid size-full place-items-center text-center text-sm text-white/70">
            <span><Icon size={28} className="mx-auto mb-2 opacity-70" aria-hidden />Belum ada {slot.kind === "video" ? "video" : "foto"} — saat ini tampil foto di slot terkait.</span>
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge tone="gray">{slot.page}</Badge>
          {picked ? <Badge tone="gold">Pratinjau (belum disimpan)</Badge> : <Badge tone={custom ? "green" : "brown"}>{custom ? "Sudah diganti" : "Bawaan"}</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="flex items-center gap-2 text-base"><Icon size={16} className="text-green-700" aria-hidden />{slot.title}</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{slot.hint}</p>
        <p className="mt-1 text-xs text-muted">
          {slot.kind === "video" ? `MP4/WebM tanpa suara, rasio 16:9, maks ${LIMIT.video} MB.` : `JPG/PNG/WebP, disarankan mendatar (16:9), maks ${LIMIT.image} MB.`}
        </p>

        {canEdit && (
          <div className="mt-auto pt-5">
            <form action={action} className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-green-800 ring-1 ring-inset ring-green-200 hover:bg-green-50">
                <Upload size={14} aria-hidden /> {picked ? "Ganti pilihan" : `Pilih ${slot.kind === "video" ? "video" : "foto"}`}
                <input type="file" name="file" accept={ACCEPT[slot.kind]} onChange={onPick} className="sr-only" />
              </label>
              <Button type="submit" size="sm" disabled={!picked || pending}>{pending ? "Mengunggah…" : "Simpan"}</Button>
              {picked && <span className="max-w-[12rem] truncate text-xs text-muted" title={picked.name}>{picked.name}</span>}
            </form>
            {custom && (
              <form action={resetAction} className="mt-3"
                onSubmit={(e) => { if (!confirm(`Kembalikan "${slot.title}" ke ${slot.fallback ? "berkas bawaan" : "kosong"}?`)) e.preventDefault(); }}>
                <button type="submit" disabled={resetting} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-danger">
                  <RotateCcw size={13} aria-hidden /> {resetting ? "Memproses…" : slot.fallback ? "Kembalikan ke bawaan" : "Hapus video"}
                </button>
              </form>
            )}
          </div>
        )}
        {msg && <p role="alert" className="mt-3 rounded-2xl bg-danger-bg px-4 py-2.5 text-xs font-medium text-danger">{msg}</p>}
        {ok && <p role="status" className="mt-3 rounded-2xl bg-green-50 px-4 py-2.5 text-xs font-semibold text-green-900">✓ {ok}</p>}
      </div>
    </article>
  );
}
