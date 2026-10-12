import "server-only";
import { cache } from "react";
import { headers } from "next/headers";

/**
 * Deteksi HP dari header permintaan. Di HP, situs publik menampilkan tata letak desktop yang sama persis,
 * dirender selebar DESKTOP_WIDTH lalu diperkecil pas layar (lihat (public)/layout.tsx & globals.css).
 */
export const DESKTOP_WIDTH = 1280;

export const isHp = cache(async () => {
  const h = await headers();
  if (h.get("sec-ch-ua-mobile") === "?1") return true;
  return /Mobi|Android|iPhone|iPod|IEMobile|Opera Mini|BlackBerry/i.test(h.get("user-agent") ?? "");
});
