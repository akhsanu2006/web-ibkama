# Progres audit keamanan IBKAMA UMY

> Dokumen kerja audit. Tidak berisi secret, token, atau data pribadi. Ringkasan operasional: `docs/pra-deployment.md`.

## Status
Fase 1–7 selesai untuk semua yang dapat dikerjakan lokal. Keputusan: **SIAP SETELAH PRASYARAT** (hosting + kredensial).
Baseline: `edd4ca1` (A) · `f8a61d0` (B) · `10b925a` (C) · `6f3d036` (D) — utuh, tidak diubah.

## Commit audit
| Commit | Isi |
|---|---|
| E1 `1ebec8d` | pembersihan media (hapus/ganti), validasi isi unggahan, galat tak bocor |
| E2 `136a389` | batas Content-Length body untuk /hadir (5 MB) dan /login (64 KB) di proxy.ts |
| E3 `ca2ae00` | CSP enforcement, batas password 72 byte, zod jitless klien |
| E4 `4e41b10` | galat DB tanpa SQL (rantai cause), error boundary dashboard |
| E5 | suite regresi permanen + dokumen operasional |

## Temuan
| ID | Temuan | Prio | Bukti | Perbaikan | Hasil uji | Status | Tindak lanjut |
|---|---|---|---|---|---|---|---|
| F-01 | Aksi terikat di klien + useActionState → render ulang tanpa-JS berputar (CPU 100%, OOM) | P0 | Paket D | Paket D | suite `origin`, `body` (server responsif) | diperbaiki & terverifikasi | – |
| F-02 | Server Action tanpa `Origin` diproses | P3 | `origin` | tidak diubah (perilaku framework; SameSite=Lax; lintas-situs/null ditolak) | 12/12 | diterima sebagai risiko | – |
| F-03 | Body Server Action 60 MB berlaku untuk /login & /hadir (RSS 131→490 MB dari satu login 30 MB; 6×40 MB chunked → 834 MB) | P1 | `body` | E2 (413 via Content-Length) | 7/7; login 30 MB 941→30 ms | mitigasi lokal selesai, butuh aktivasi hosting | proxy (B2, B3) |
| F-04 | Hapus Program meninggalkan bukti presensi privat (foto/TTD) di disk & tabel media | P1 (privasi) | `content` (3 GAGAL sebelum) | E1 | 16/16 | diperbaiki & terverifikasi | – |
| F-05 | Media lama tertinggal saat berkas diganti/dihapus/penyimpanan gagal | P2 | `content` | E1 | 16/16 | diperbaiki & terverifikasi | – |
| F-06 | Unggahan hanya memeriksa MIME dari klien | P2 | `content` | E1 (signature isi) | HTML berlabel PNG ditolak | diperbaiki & terverifikasi | – |
| F-07 | `friendly()` meneruskan SQL + parameter (termasuk hash password) pada email ganda/FK | P2 | `misc` (GAGAL sebelum) | E1, E4 | 8/8 | diperbaiki & terverifikasi | – |
| F-08 | CSP masih Report-Only | P2 | next.config.ts | E3 | Chrome: 8 halaman publik + 10 admin + presensi + PDF tanpa pelanggaran | diperbaiki & terverifikasi | HSTS (B7) |
| F-09 | Password baru tanpa batas (bcrypt memotong 72 byte); login tanpa batas panjang | P3 | kode | E3 | `misc` | diperbaiki & terverifikasi | – |
| F-10 | `.env.local` berizin 644 | P3 | `ls -l` | chmod 600 | `ls -l` | diperbaiki (lokal) | atur izin di server |
| F-11 | Password Super Admin di `.env.local` | P2 | kode/env | dokumentasi | – | belum terselesaikan (tindakan manual) | D1 |
| F-12 | Tidak ada 2FA | P2 | kode | desain di pra-deployment.md | – | belum terselesaikan | D2 |
| F-13 | Google OAuth belum diuji dengan kredensial nyata | P2 | kode + uji jalur gagal | – | state/nonce/PKCE/cookie/flag OK; callback gagal → pesan benar | membutuhkan kredensial/pengujian eksternal | C1 |
| F-14 | `siteOrigin()` memercayai Host bila `NEXT_PUBLIC_SITE_URL` kosong | P3 | kode | `.env.example` diperjelas | runtime env terbukti dibaca | mitigasi lokal selesai, butuh aktivasi hosting | B4 |
| F-15 | IP dari `X-Forwarded-For` bisa dipalsukan tanpa proxy yang menimpanya | P2 | kode | dokumentasi | – | membutuhkan konfigurasi hosting | B3 |
| F-16 | Advisory dependensi dev (braces/esbuild) | P3 | `npm audit` | – | prod: 0 | diterima sebagai risiko | – |
| F-17 | Backup hanya di disk yang sama | P2 | `storage/db` | prosedur + latihan restore | restore identik | membutuhkan konfigurasi hosting | D4 |
| F-18 | Tidak ada error boundary dashboard | P3 | kode | E4 | uji browser | diperbaiki & terverifikasi | – |
| F-19 | Tidak ada tes regresi otomatis | P2 | – | suite permanen (111 uji) | semua lulus | diperbaiki & terverifikasi | jalankan sebelum rilis |
| F-20 | Video hero `02-hero-laptop.mp4` tidak ada → 404 (fungsional, bukan keamanan) | P3 | audit lama | – | – | belum terselesaikan | unggah via Foto & Video Situs |
| F-21 | Admin dapat mengubah/menghapus data periode lain lewat ID (kebijakan bisnis, tidak diuji) | P3 | kode | – | – | diterima sebagai risiko (perlu keputusan kebijakan) | – |

## Perubahan database
Tidak ada migrasi baru pada DB aktif dalam misi ini. DB aktif hanya dibaca (`sqlite3 .backup`).
Backup & latihan restore dilakukan pada salinan; hasil identik.
