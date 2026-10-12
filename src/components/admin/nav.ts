import { BarChart3, CalendarCheck2, Clapperboard, Crown, Newspaper, FileText, FolderArchive, Gauge, Images, Layers, Link2, ListTree, Settings2, UserCog, UserRound, Users, Building2, ClipboardList, Tags } from "lucide-react";
import type { Resource } from "@/lib/permissions";

export type NavGroup = { title: string; items: { href: string; label: string; icon: typeof Gauge; perm?: Resource; superOnly?: boolean }[] };

export const ADMIN_NAV: NavGroup[] = [
  { title: "Umum", items: [{ href: "/admin", label: "Ringkasan", icon: Gauge }, { href: "/admin/periode", label: "Periode", icon: Layers, perm: "period" }, { href: "/admin/akun", label: "Akun Saya", icon: UserRound }] },
  { title: "Organisasi", items: [
    { href: "/admin/anggota", label: "Anggota & Pengurus", icon: Users, perm: "member" },
    { href: "/admin/divisi", label: "Divisi", icon: ListTree, perm: "division" },
    { href: "/admin/jabatan", label: "Jabatan", icon: Building2, perm: "position" },
    { href: "/admin/leadership", label: "Riwayat Ketua Umum", icon: Crown, perm: "leadership" },
  ] },
  { title: "Kegiatan", items: [
    { href: "/admin/program", label: "Program Kerja", icon: ClipboardList, perm: "program" },
    { href: "/admin/presensi", label: "Presensi QR", icon: CalendarCheck2, perm: "attendance" },
  ] },
  { title: "Publikasi", items: [
    { href: "/admin/berita", label: "Berita & Prestasi", icon: Newspaper, perm: "news" },
    { href: "/admin/angka", label: "IBKAMA dalam Angka", icon: BarChart3, perm: "highlight" },
    { href: "/admin/media-situs", label: "Foto & Video Situs", icon: Clapperboard, perm: "site_media" },
  ] },
  { title: "Arsip", items: [
    { href: "/admin/arsip", label: "Arsip Organisasi", icon: FolderArchive, perm: "archive" },
    { href: "/admin/kategori-arsip", label: "Kategori Arsip", icon: Tags, perm: "archive" },
    { href: "/admin/dokumen", label: "Dokumen", icon: FileText, perm: "document" },
    { href: "/admin/dokumentasi", label: "Dokumentasi", icon: Images, perm: "gallery" },
  ] },
  { title: "Sistem", items: [
    { href: "/admin/pengguna", label: "Pengguna & Peran", icon: UserCog, superOnly: true },
    { href: "/admin/organisasi", label: "Profil Organisasi", icon: Settings2, superOnly: true },
    { href: "/admin/integrasi", label: "Integrasi", icon: Link2, superOnly: true },
  ] },
];
