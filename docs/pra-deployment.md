# Checklist pra-deployment IBKAMA UMY

> Disusun dari audit keamanan terakhir (commit `6f3d036` → `2c13259`). Hanya memuat hasil yang telah dibuktikan. Isinya membedakan apa yang
> **sudah terbukti lokal**, apa yang **butuh konfigurasi hosting**, apa yang **butuh kredensial/pengujian
> eksternal**, dan apa yang **masih berisiko**. Jangan mencentang butir hosting sebelum benar-benar diuji di server.

## 0. Keputusan
**READY AFTER PREREQUISITES (SIAP SETELAH PRASYARAT).** Bukan READY TO DEPLOY. Kode lokal terverifikasi (suite regresi 116 uji lulus + uji browser sungguhan, diulang dari kondisi aktual pada verifikasi final).
Jangan membuka ke publik sebelum butir **B1–B6** (hosting) selesai dan **A-Super Admin (D1)** ditangani.

## A. Sudah aman dan terverifikasi secara lokal
| # | Butir | Bukti |
|---|---|---|
| A1 | Dependensi produksi 0 kerentanan (Next 16.3.8) | `npm audit --omit=dev` |
| A2 | Semua Server Action dan halaman admin memeriksa izin di server; admin biasa tidak bisa memakai fitur Super Admin | suite `authz` (kontrol positif) |
| A3 | Sesi: versi sesi, logout mencabut semua perangkat, ganti password mencabut perangkat lain, token palsu/alg=none/kedaluwarsa ditolak | suite `session` |
| A4 | Login: pesan gagal seragam, kunci per pasangan email+IP/IP/email, bertahan setelah restart | suite `session` |
| A5 | Media privat (bukti presensi, dokumen internal) tidak bisa dibuka anonim; Range/HEAD aman; traversal ditolak | suite `media` |
| A6 | Bukti presensi, media lama, dan media saat hapus data ikut dibersihkan (tidak ada berkas yatim) | suite `content` |
| A7 | Unggahan divalidasi tipe + ukuran + isi (signature); HTML berlabel gambar ditolak | suite `content` |
| A8 | Presensi: NIM dinormalisasi, kuota atomik (serentak), QR kedaluwarsa/diganti, mode peserta terdaftar | Paket C + suite `body` |
| A8b | Gate ukuran body (413 via Content-Length) berlaku di semua POST non-`/admin`, tidak dapat dilewati lewat path | suite `body` (E6) |
| A9 | Ekspor CSV menetralkan formula (`= + - @ TAB CR`) | suite `csv` |
| A10 | CSP **enforcement** berjalan di Chrome sungguhan: halaman publik, login, admin, presensi (kamera, tanda tangan), konversi PDF | `browser-check.mjs` |
| A11 | Header: CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy (kamera hanya situs sendiri), tanpa X-Powered-By | suite `headers` |
| A12 | Server Action: Origin lintas-situs dan `null` ditolak framework; request malformed tidak melumpuhkan server | suite `origin` |
| A13 | Galat DB tidak bocor ke pengguna; error boundary dashboard tersedia | suite `misc` + uji browser |
| A14 | Backup SQLite online + unggahan dapat dipulihkan (baris, skema, berkas identik; `integrity_check` ok) | latihan restore |

## B. Membutuhkan konfigurasi hosting (BELUM AKTIF sampai diuji)
| # | Butir | Cara |
|---|---|---|
| B1 | HTTPS pada domain produksi | sertifikat TLS di reverse proxy; cookie `Secure` otomatis aktif di `NODE_ENV=production` |
| B2 | Batas body: `/login` 64 KB, `/hadir/` 5 MB, selebihnya 60 MB | `docs/hosting-batas-request.md` (nginx); uji dengan curl 6 MB → 413 |
| B3 | Proxy MENIMPA `X-Forwarded-For` dengan IP asli dan meneruskan `Host` | contoh nginx di dokumen yang sama |
| B4 | `NEXT_PUBLIC_SITE_URL=https://<domain>` (runtime) | variabel lingkungan aplikasi |
| B5 | `SESSION_SECRET` baru khusus produksi (≥ 32 karakter acak) | `openssl rand -base64 48`; jangan memakai nilai dev |
| B6 | Penyimpanan persisten untuk `storage/db` dan `storage/uploads` + backup terjadwal luar-server | lihat bagian "Backup" |
| B7 | HSTS bertahap setelah HTTPS stabil | lihat bagian "HSTS" |
| B8 | Hosting Node terkelola (bukan VPS): tanyakan apakah batas body per-path bisa diatur; bila tidak, pakai VPS | dukungan penyedia |

## C. Membutuhkan kredensial atau pengujian eksternal
| # | Butir | Status |
|---|---|---|
| C1 | **Google OAuth nyata.** Kode diperiksa (state, nonce, PKCE S256, issuer, audience, `email_verified`, cookie `HttpOnly; Secure; SameSite=Lax; path` terbatas) dan jalur gagal diuji lokal dengan nilai dummy. Alur penuh dengan Google **belum** diuji. | butuh `GOOGLE_CLIENT_ID/SECRET` + redirect URI produksi |
| C2 | Uji akhir di domain produksi (lihat "Uji pasca-deploy") | setelah B1–B6 |

Prosedur uji OAuth: (1) buat OAuth client tipe *Web application*, daftarkan
`https://<domain>/auth/google/callback`; (2) set `GOOGLE_CLIENT_ID/SECRET`; (3) daftarkan akun Google uji sebagai
Admin lewat Pengguna & Peran; (4) uji: akun terdaftar → masuk; email tak terdaftar → `akun-tidak-terdaftar`;
akun dinonaktifkan → ditolak; batal di layar Google → `google-batal`; buka `/auth/google/callback?code=x&state=y`
tanpa cookie → `google-gagal`.

## D. Masih berisiko / belum boleh dianggap selesai
| # | Butir | Risiko | Tindakan |
|---|---|---|---|
| D1 | **Password Super Admin asli ada di `.env.local`** (hanya dipakai `db:seed`). Izin berkas sudah 600, tetapi password-nya tetap tersimpan dalam teks biasa. | pengambilalihan akun Super Admin bila berkas bocor | hapus baris `SUPERADMIN_*` dari server; ganti password dari `/admin/akun`; gunakan pengelola password |
| D2 | **Tidak ada 2FA aplikasi** untuk Super Admin | password bocor = akses penuh | lihat "2FA" di bawah |
| D3 | Body *chunked* hanya dibatasi 60 MB tanpa proxy (di semua path publik): 6 × 40 MB ke `/login` memuncak ±830 MB. **Belum diuji melalui proxy nyata.** | kehabisan memori (DoS) | B2 + `proxy_request_buffering on`, lalu uji chunked |
| D6 | Entri pertama `X-Forwarded-For` dipercaya (tanpa pengaturan hop tepercaya) | pembatas per-IP dapat diakali bila proxy menambahkan header | B3: proxy wajib MENIMPA; BELUM DIVERIFIKASI |
| D7 | `SUPERADMIN_PASSWORD` 12 karakter | password lemah untuk akun penuh | ganti ≥ 16 karakter unik (D1) |
| D4 | Backup hanya di disk yang sama | kehilangan disk = kehilangan data | cron + salinan luar-server terenkripsi |
| D5 | Tes otomatis hanya suite regresi ini (belum ada unit test) | regresi tak terdeteksi | jalankan suite sebelum tiap rilis |

## Backup dan pemulihan
```bash
# backup konsisten (aman saat aplikasi berjalan)
TS=$(date +%Y%m%d-%H%M%S); mkdir -p backups
sqlite3 storage/db/ibkama.db ".backup 'backups/ibkama-$TS.db'"
tar -czf "backups/uploads-$TS.tgz" -C storage uploads
sqlite3 "backups/ibkama-$TS.db" "pragma integrity_check"      # harus: ok
# salin ke luar server (terenkripsi), mis. rclone/scp; backup memuat hash password → jangan dibuka publik
```
Pemulihan (aplikasi dihentikan): salin `backups/ibkama-<ts>.db` ke `storage/db/ibkama.db`, ekstrak
`uploads-<ts>.tgz` ke `storage/`, jalankan `pragma integrity_check`, lalu start. **Rollback rilis:** `git checkout
<commit-sebelumnya>`, `npm ci && npm run build`, pulihkan DB bila rilis mengubah skema. Skema berubah **hanya** lewat
`ALTER TABLE ... ADD COLUMN` manual yang sudah dilatih pada salinan; jangan jalankan `drizzle-kit push`.

## HSTS (setelah HTTPS stabil)
Pasang di proxy, bukan di aplikasi, dan naikkan bertahap: `max-age=300` (1 hari uji) → `86400` → `604800` →
`31536000`. Jangan `includeSubDomains`/`preload` sebelum semua subdomain pasti HTTPS.
```nginx
add_header Strict-Transport-Security "max-age=300" always;
```

## 2FA Super Admin (belum diimplementasikan — keputusan desain)
Tidak dikerjakan karena perlu migrasi skema pada database aktif (kolom rahasia TOTP + tabel kode pemulihan) dan
ada risiko mengunci akun. Desain yang disarankan: TOTP RFC 6238 (HMAC-SHA1, 30 dtk, ±1 jendela), rahasia
dienkripsi dengan kunci turunan `SESSION_SECRET`, 10 kode pemulihan sekali pakai (di-hash), langkah kedua setelah
password diverifikasi dan sebelum sesi dibuat, dibatasi percobaan seperti login, dan prosedur darurat oleh Super Admin
lain. **Mitigasi sementara:** masuk memakai Google (aktifkan Verifikasi 2 Langkah pada akun Google Super Admin),
gunakan password panjang unik dari pengelola password, dan jaga minimal dua Super Admin.

## Uji pasca-deploy (wajib)
1. `curl -sI https://<domain>/` → ada `Content-Security-Policy`, `X-Frame-Options: DENY`, tanpa `X-Powered-By`.
2. `head -c 6291456 /dev/urandom | curl -s -o /dev/null -w "%{http_code}\n" -X POST --data-binary @- https://<domain>/hadir/uji` → `413`.
3. Login Super Admin; buka `/admin/akun`; keluar → token lama ditolak.
4. Buat program uji → buka presensi → pindai QR dari HP (kamera, tanda tangan) → "Kehadiran tercatat" → hapus program
   → pastikan bukti hilang (`/media/<id>` → 404).
5. Unggah video 20 MB di Media Situs (batas 60 MB di proxy) dan PDF anggota (konversi PDF → foto).
6. Ekspor CSV presensi; buka di spreadsheet; pastikan tidak ada formula yang berjalan.
7. Tanpa login, buka `/media/<id bukti privat>` dan `/admin/pengguna` → `404` / pengalihan ke `/login`.

## Risiko yang diterima (dengan alasan)
- **Server Action tanpa header `Origin` diproses** (perilaku framework): browser selalu mengirim `Origin` pada POST
  lintas-situs dan cookie sesi `SameSite=Lax` tidak ikut terkirim; Origin lintas-situs/`null` ditolak (teruji).
- **Media publik dapat dibuka dengan ID-nya** (UUID acak 122 bit) walau induknya tidak dipublikasikan: ID tidak
  pernah ditampilkan ke publik; akses privat/internal dicek di server.
- **Pencocokan Google berdasarkan email** (bukan `sub`): akun harus lebih dulu didaftarkan Super Admin dan aktif.
- **Advisory dependensi dev** (`braces`, `esbuild` via lint/drizzle-kit): hanya tooling pengembangan, tidak ada di
  runtime produksi; `npm audit fix --force` justru menurunkan versi.
