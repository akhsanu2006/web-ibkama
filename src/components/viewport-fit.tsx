"use client";
import { useEffect } from "react";

/**
 * HP: pastikan halaman selebar `width` langsung diperkecil pas layar (sebagian browser HP
 * tidak menghitung skala awal sendiri). Tidak melakukan apa pun bila meta viewport halaman bukan `width`.
 */
export function ViewportFit({ width }: { width: number }) {
  useEffect(() => {
    const vv = window.visualViewport;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!vv || !meta || !meta.content.startsWith(`width=${width}`)) return;
    const deviceWidth = vv.width * vv.scale; // lebar layar (CSS px) sesuai orientasi saat ini
    if (deviceWidth >= width) return;
    meta.content = `width=${width}, initial-scale=${(deviceWidth / width).toFixed(4)}`;
  }, [width]);
  return null;
}
