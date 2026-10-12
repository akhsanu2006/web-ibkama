# Progres audit keamanan IBKAMA UMY

> Dokumen kerja. Tidak berisi secret, token, atau data pribadi.

## Baseline
`edd4ca1` (A) → `f8a61d0` (B) → `10b925a` (C) → `6f3d036` (D). Tanpa remote. Working tree bersih saat audit dimulai.

## Fase 1 — Inventarisasi (SELESAI, berdasarkan pembacaan kode)
Diperiksa: seluruh Server Action (`src/lib/actions/*`), rute (`media`, `export`, `auth/*`), `dal.ts`, `access.ts`,
`session.ts`, `rate-limit.ts`, `proxy.ts`, `next.config.ts`, `permissions.ts`, `media.ts`, query publik/admin,
`google.ts`, seed, `.env.example`, `docs/hosting-batas-request.md`.

Terkonfirmasi dari kode (belum diuji dinamis, ditandai KODE):
- KODE: semua aksi non-publik memanggil `assertPermission`; halaman admin memakai `requirePagePermission`/`requireUser`.
- KODE: tidak ada `dangerouslySetInnerHTML`/`eval`; SQL mentah hanya `sql` ber-parameter (rate-limit, presensi).
- KODE: `deleteResource` tidak menghapus berkas media pemiliknya; hapus program ikut menghapus baris presensi
  (cascade FK) tetapi bukti foto/TTD privat tetap tertinggal di disk dan tabel `media`.
- KODE: `saveResource` tidak menghapus media lama saat berkas diganti/dihapus.
- KODE: `friendly()` pada resource/users mengembalikan pesan galat mentah (bisa memuat SQL) ke pengguna admin.
- KODE: `siteOrigin()` memercayai header Host/X-Forwarded-Host bila `NEXT_PUBLIC_SITE_URL` kosong.
- KODE: `bodySizeLimit` Server Action 60 MB berlaku juga untuk /login dan /hadir.
- KODE: unggahan hanya memeriksa `file.type` kiriman klien (tanpa pemeriksaan magic bytes).
- KODE: password baru tanpa batas panjang (bcrypt memotong 72 byte) pada createUser/updateUser.
- Dependensi produksi: `npm audit --omit=dev` = 0 kerentanan. Dev: 9 (braces/esbuild, hanya tooling).

## Fase 2 — Pengujian terkontrol (BERJALAN)
Lihat bagian hasil di bawah (diisi per batch).

## Hasil Fase 2 (build produksi, DB & unggahan SALINAN)
| Grup | Hasil |
|---|---|
| Media (anonim/berizin/periode berakhir, Range, HEAD, traversal) | 16/16 lulus |
| Otorisasi halaman & Server Action (admin vs Super Admin vs anonim) + kontrol positif | 21/21 lulus |
| Origin: valid / tanpa / lintas-situs / "null" / malformed | Lintas-situs & "null" → 500 tidak diproses; tanpa Origin → DIPROSES (perilaku framework); malformed tak melumpuhkan server |
| Sesi/login/lockout/token (palsu, alg=none, kedaluwarsa, kunci salah) | 19/19 lulus (1 salah-harness diperbaiki) |
| Konten/unggahan/XSS | sebelum perbaikan 3 GAGAL (berkas yatim); setelah E1: 16/16 lulus |
| Batas body | sebelum: 30 MB diproses, RSS 131→490 MB; setelah E2: >5 MB (/hadir), >64 KB (/login) → 413; chunked tetap 60 MB |

## Commit audit
- `1ebec8d` E1 — pembersihan media, validasi isi unggahan, galat aman
- E2 — batas Content-Length di proxy (lihat git log)
