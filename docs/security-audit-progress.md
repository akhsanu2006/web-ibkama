# Progres audit keamanan IBKAMA UMY

> Dokumen kerja audit. Tidak berisi secret, token, atau data pribadi. Ringkasan operasional: `docs/pra-deployment.md`.

## Status
Verifikasi final repository selesai (lihat "Verifikasi ulang final"). Keputusan: **READY AFTER PREREQUISITES**
(SIAP SETELAH PRASYARAT) — bukan READY TO DEPLOY: HTTPS, reverse proxy, backup eksternal, OAuth produksi, dan 2FA
belum tersedia/BELUM DIVERIFIKASI.
Baseline: `edd4ca1` (A) · `f8a61d0` (B) · `10b925a` (C) · `6f3d036` (D) — utuh, tidak diubah.

## Commit audit (terverifikasi ada di repository, branch `main`, tanpa remote)
| Commit | Isi |
|---|---|
| E1 `1ebec8d` | pembersihan media (hapus/ganti), validasi isi unggahan, galat tak bocor |
| E2 `136a389` | batas Content-Length body untuk /hadir (5 MB) dan /login (64 KB) di proxy.ts |
| – `4cfd4bd` | catatan progres awal |
| E3 `ca2ae00` | CSP enforcement, batas password 72 byte, zod jitless klien |
| E4 `4e41b10` | galat DB tanpa SQL (rantai cause), error boundary dashboard |
| E5 `4a96bce` | suite regresi permanen + dokumen operasional |
| – `693ff5e` | rapikan peringatan lint skrip |
| E6 `1066aae` | gate body berlaku di semua POST non-`/admin` (perbaikan bypass lewat path) |
| – `2c13259` | koreksi komentar next.config (CSP sudah enforcement) |

## Verifikasi ulang final (hasil aktual sesi ini)
| Pemeriksaan | Hasil |
|---|---|
| Branch / working tree | `main`; hanya `.claude/` tak terlacak; semua commit yang dirujuk dokumen ada; berkas inti terlacak |
| `tsc --noEmit` | 0 error |
| `npm run build` | sukses (2 peringatan lama: dynamic filesystem tracing; satu peringatan `package-lock.json` induk) |
| `eslint .` | 5 masalah lama (4 error, 1 peringatan), identik baseline |
| `npm audit --omit=dev` | 0 kerentanan (Next 16.3.8) |
| `npm audit` (dev) | 9 (4 sedang, 5 tinggi): `braces`, `esbuild` — hanya tooling lint/drizzle-kit |
| Suite regresi (`run.sh`, salinan DB/unggahan) | **116 uji lulus, 0 gagal** (media 16, authz 21, origin 12, session 20, content 16, csv 5, headers 6, misc 8, body 12) |
| Chrome sungguhan, CSP enforcement | 8 halaman publik + 10 halaman admin + presensi (kamera palsu, tanda tangan, kirim) tanpa pelanggaran CSP; satu 404 beranda = video hero yang memang tidak ada |
| Rahasia | `SESSION_SECRET`, `SUPERADMIN_PASSWORD`, `SUPERADMIN_EMAIL`: 0 commit, 0 berkas terlacak, 0 di bundle klien/server; `.env.local` izin 600 dan tidak terlacak |
| DB aktif | tidak dibuka untuk tulis; pengujian memakai salinan |

## Temuan
| ID | Temuan | Prio | Bukti | Perbaikan | Hasil uji | Status | Tindak lanjut |
|---|---|---|---|---|---|---|---|
| F-01 | Aksi terikat di klien + useActionState → render ulang tanpa-JS berputar (CPU 100%, OOM) | P0 | Paket D | Paket D | suite `origin`, `body` (server responsif) | diperbaiki & terverifikasi | – |
| F-02 | Server Action tanpa `Origin` diproses | P3 | `origin` | tidak diubah (perilaku framework; SameSite=Lax; lintas-situs/null ditolak) | 12/12 | diterima sebagai risiko | – |
| F-03 | Body Server Action 60 MB berlaku untuk /login & /hadir (RSS 131→490 MB dari satu login 30 MB; 6×40 MB chunked → 834 MB) | P1 | `body` | E2 + E6 (413 via Content-Length di semua POST non-admin) | 12/12; login 30 MB 941→30 ms; chunked tetap 60 MB | mitigasi parsial lokal; **chunked BELUM DIVERIFIKASI melalui proxy nyata** | proxy (B2, B3) |
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
| F-22 | Gate E2 dapat dilewati lewat path: aksi `checkIn`/`login` yang sah dikirim ke `/profil` atau `/` menerima 30 MB (HTTP 200) | P1 | uji jalur sesi ini | E6 | 12/12 grup body; suite penuh 116/116; Chrome tanpa regresi | diperbaiki & terverifikasi | – |
| F-23 | Konfigurasi IP tepercaya: aplikasi memakai entri PERTAMA `X-Forwarded-For` (tanpa pengaturan hop tepercaya). Pembatas per-IP dapat diakali bila proxy menambahkan, bukan menimpa. | P2 | `rate-limit.ts:39` | dokumentasi (proxy wajib menimpa) | – | BELUM DIVERIFIKASI (butuh proxy nyata) | B3 |
| F-24 | `SUPERADMIN_PASSWORD` berpanjang 12 karakter dan masih di `.env.local` (tidak ikut commit/bundle) | P2 | pemeriksaan panjang | – | – | belum terselesaikan (tindakan manual) | D1; pakai ≥ 16 karakter |
| F-25 | `SESSION_SECRET` lokal dipakai untuk uji; harus nilai baru khusus produksi | P2 | – | – | kualitas lokal baik (64 karakter) | membutuhkan konfigurasi hosting | B5 |
| F-26 | `../package-lock.json` liar di luar repo membuat Next menebak root workspace | P3 | peringatan build | – | – | belum terselesaikan | hapus berkas liar atau set `outputFileTracingRoot` |
| F-27 | Komentar `next.config.ts` menyebut CSP Report-Only padahal enforcement | P3 | kode | `2c13259` | – | diperbaiki | – |

## Tidak tersedia / BELUM DIVERIFIKASI
| Butir | Bukti pemeriksaan | Tindakan manual |
|---|---|---|
| HTTPS dan HSTS | tidak ada domain/sertifikat; flag cookie `Secure` hanya teruji dengan `NODE_ENV=production` lokal | pasang TLS, uji pasca-deploy |
| Reverse proxy (nginx) | tidak terpasang; konfigurasi di dokumen belum pernah dijalankan | pasang dan uji curl 6 MB → 413, chunked, `Host`/`X-Forwarded-For` |
| Google OAuth produksi | `GOOGLE_CLIENT_ID/SECRET` tidak ada; hanya jalur gagal dan awal alur teruji | buat OAuth client, uji prosedur di pra-deployment.md |
| Backup eksternal | tidak ada crontab/LaunchAgent; 7 backup hanya di disk yang sama | jadwalkan + salin luar-server terenkripsi |
| 2FA | tidak ada di kode (0 berkas menyebut TOTP/2FA) | keputusan desain + migrasi terlatih |
| `NEXT_PUBLIC_SITE_URL` | kosong di `.env.local`; terbukti dibaca saat runtime | set di server produksi |

## Perubahan database
Tidak ada migrasi pada DB aktif dalam misi audit dan verifikasi ini. DB aktif hanya dibaca (`sqlite3 .backup`).
