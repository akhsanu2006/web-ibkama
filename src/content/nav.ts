import { BookOpen, ClipboardList, House, Mail, Network, Newspaper } from "lucide-react";

/**
 * Tautan navigasi publik, dipakai menu titik tiga (Navbar, client), kotak navigasi beranda, dan Footer (server).
 * Diletakkan di modul tanpa "use client" agar aman diimpor dari Server Component
 * (mengekspor data biasa dari berkas "use client" tidak didukung lintas batas RSC).
 * Ketum kini menjadi bagian halaman Kepengurusan (/kepengurusan#ketum); Arsip & Dokumentasi kini melekat
 * pada tiap Program Kerja (halaman /arsip dan /dokumentasi tetap ada untuk data lama, tapi tidak di navigasi).
 */
export const NAV = [
  { href: "/", label: "Home", icon: House, desc: "Kembali ke halaman utama IBKAMA UMY." },
  { href: "/profil", label: "Profil", icon: BookOpen, desc: "Sejarah, visi & misi, tujuan, dan nilai organisasi." },
  { href: "/kepengurusan", label: "Kepengurusan", icon: Network, desc: "Bagan organisasi dan Ketua Umum lintas periode." },
  { href: "/program", label: "Program Kerja", icon: ClipboardList, desc: "Program kerja lengkap dengan arsip, dokumen, dan dokumentasinya." },
  { href: "/berita", label: "Berita", icon: Newspaper, desc: "Kabar terbaru, prestasi, dan rekognisi anak IBKAMA." },
  { href: "/kontak", label: "Kontak", icon: Mail, desc: "Sekretariat dan kanal resmi IBKAMA UMY." },
];
