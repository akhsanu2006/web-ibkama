/**
 * Slot foto/video halaman publik yang bisa diganti dari dashboard (Media Situs).
 * `fallback` = berkas bawaan di /public, dipakai selama slot belum diganti (dan saat "Kembalikan ke bawaan").
 */
export type SiteMediaSlot = {
  key: string;
  kind: "image" | "video";
  page: "Beranda" | "Profil";
  title: string;
  hint: string;
  fallback: string | null;
};

export const SITE_MEDIA: SiteMediaSlot[] = [
  { key: "opening.video", kind: "video", page: "Beranda", title: "Video pembuka (awal halaman Home)", hint: "Video sinematik pertama: UMY → IBKAMA. Diputar otomatis saat halaman dibuka.", fallback: "/cinematic/video/01-umy-to-ibkama.mp4" },
  { key: "opening.poster", kind: "image", page: "Beranda", title: "Gambar awal video pembuka", hint: "Tampil sebelum video pembuka siap diputar (dan bila video tidak bisa dimuat).", fallback: "/cinematic/umy-poster.jpg" },
  { key: "logo.video", kind: "video", page: "Beranda", title: "Video logo koin", hint: "Animasi logo di samping “Bersahaja, Berkarya, Berjaya.” — berputar mengikuti scroll.", fallback: "/brand/logo-coin.mp4" },
  { key: "hero.poster", kind: "image", page: "Beranda", title: "Foto “Aktif, modern, dekat dengan ilmu”", hint: "Foto layar penuh pada sinematik kedua (bersama caption “Belajar tanpa henti”).", fallback: "/cinematic/hero-reference.jpg" },
  { key: "hero.video", kind: "video", page: "Beranda", title: "Video “Aktif, modern, dekat dengan ilmu” (opsional)", hint: "Bila diisi, video ini diputar mengikuti scroll menggantikan foto di atas.", fallback: null },
  { key: "knowledge.video", kind: "video", page: "Beranda", title: "Video “Satu keluarga, beragam keilmuan”", hint: "Video sinematik ketiga, diputar mengikuti scroll.", fallback: "/cinematic/video/03-knowledge-orbit.mp4" },
  { key: "knowledge.poster", kind: "image", page: "Beranda", title: "Gambar awal video “Satu keluarga, beragam keilmuan”", hint: "Tampil sebelum video siap diputar.", fallback: "/cinematic/knowledge-poster.jpg" },
  { key: "profil.hero", kind: "image", page: "Profil", title: "Foto utama halaman Profil", hint: "Foto layar penuh di bagian atas halaman Profil (saat ini: Pelantikan Pengurus 2026/2027).", fallback: "/profil/pelantikan-2026.jpg" },
];

export const slotByKey = (key: string) => SITE_MEDIA.find((s) => s.key === key);
