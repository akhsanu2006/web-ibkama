# Batas ukuran request presensi publik (reverse proxy 5 MB)

> **Status: BELUM AKTIF.** Konfigurasi proxy di bawah harus diterapkan di server hosting dan diverifikasi
> (lihat "Cara menguji"). Aplikasi sudah memiliki lapisan kedua (413 berdasarkan Content-Length), tetapi
> body *chunked* hanya bisa dibatasi di proxy.

## Mengapa diperlukan

Next.js hanya punya **satu** batas ukuran body untuk *semua* Server Action
(`experimental.serverActions.bodySizeLimit = "60mb"` di `next.config.ts`). Batas itu harus besar
karena unggahan video di dashboard (Media Situs) sampai 50 MB. Akibatnya presensi publik di
`/hadir/<kode>` — yang dapat diakses tanpa login — juga menerima body hingga 60 MB yang dibaca ke memori.

Kiriman presensi yang sah jauh lebih kecil: foto JPEG ±100–300 KB + tanda tangan PNG ±20–100 KB,
dan aplikasi menolak tiap bukti > 1,5 MB (`src/lib/actions/attendance.ts`). Maka di depan aplikasi
pasang batas **5 MB khusus untuk `/hadir/`**, tanpa mengubah batas dashboard.

## nginx (VPS)

```nginx
server {
    # ... konfigurasi domain & TLS (HTTPS wajib) ...

    # Login: hanya email + password. Tolak body > 64 KB sebelum sampai ke Next.js (413).
    location = /login {
        client_max_body_size 64k;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;                       # WAJIB: Server Action memeriksa Origin terhadap Host
        proxy_set_header X-Forwarded-For $remote_addr;     # TIMPA (jangan teruskan nilai dari klien)
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Presensi publik: foto + tanda tangan ≈ 4 MB sebagai data URL → batas 5 MB.
    location /hadir/ {
        client_max_body_size 5m;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Selebihnya: dashboard butuh unggahan video ≤ 50 MB.
    location / {
        client_max_body_size 60m;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Catatan penting:
- **Biarkan `proxy_request_buffering on` (bawaan nginx).** nginx menampung body lalu mengirim ke aplikasi dengan
  `Content-Length`, sehingga lapisan kedua di aplikasi (`src/proxy.ts`, 413 untuk /hadir > 5 MB dan /login > 64 KB)
  juga efektif. Tanpa buffering, klien dapat memakai body *chunked* yang hanya dibatasi 60 MB oleh Next.
- `X-Forwarded-For`: pembatas login & presensi membaca IP dari header ini (`src/lib/auth/rate-limit.ts`). Proxy
  **wajib menimpanya** dengan `$remote_addr`; bila nilai dari klien diteruskan, pembatas per IP dapat diakali
  (pembatas per email/program/NIM tetap berlaku).
- `Host $host` wajib: bila proxy mengganti Host (mis. ke `127.0.0.1:3000`), seluruh formulir ditolak Next.js
  ("Invalid Server Actions request") karena Origin ≠ Host.
- Setelah mengubah: `sudo nginx -t && sudo systemctl reload nginx`.

### Yang dilindungi aplikasi sendiri (aktif tanpa proxy) — hasil uji aktual
Server Action dapat dikirim ke **path mana pun** yang merender halaman, jadi batas dipasang pada semua POST
di luar `/admin` (`src/proxy.ts`). Diuji dengan body 30 MB ke build produksi (salinan DB):

| Jalur | Body dengan `Content-Length` | Body *chunked* (tanpa Content-Length) |
|---|---|---|
| `/hadir/*` | **413** bila > 5 MB (aplikasi) | **tidak dibatasi aplikasi** — hanya 60 MB (framework); butuh proxy |
| `/login` dan semua path publik lain (`/`, `/profil`, …) | **413** bila > 64 KB (aplikasi) | **tidak dibatasi aplikasi** — hanya 60 MB; butuh proxy |
| `/admin/*` (terautentikasi) | sengaja tidak dibatasi aplikasi: 60 MB (video Media Situs) | 60 MB |
| `/media/*` | POST → 405 | – |

Status chunked: **BELUM DIVERIFIKASI melalui reverse proxy nyata** (tidak ada nginx/caddy di lingkungan uji).
Terukur tanpa proxy: 6 × 40 MB *chunked* ke `/login` memuncak ±830 MB RSS. Dengan nginx `proxy_request_buffering on`
body ditampung lalu diteruskan dengan `Content-Length`, sehingga gate aplikasi ikut efektif — ini **harus diuji** setelah
terpasang (lihat "Cara menguji").

| Perlindungan lain | Status |
|---|---|
| Tiap bukti presensi ≤ 1,5 MB; data URL besar ditolak sebelum dekode | aktif di aplikasi |
| Batas per-perangkat/IP/program untuk kiriman presensi | aktif di aplikasi (efektif bila IP asli diteruskan proxy) |

## Hostinger

- **VPS Hostinger**: sama seperti bagian nginx di atas.
- **Hosting Node.js terkelola (Web App)**: reverse proxy dikelola Hostinger. Periksa apakah panel
  menyediakan pengaturan batas body per path; bila tidak, tanyakan ke dukungan Hostinger apakah
  `client_max_body_size` per lokasi bisa diatur. Bila tidak bisa per path, batas global 60 MB tetap
  berlaku dan risikonya hanya diredam oleh pembatas frekuensi (C-A) — catat sebagai risiko yang diterima.

## Cara menguji setelah diterapkan

```bash
# 6 MB acak ke halaman presensi → harus 413 dari proxy (bukan dari Next.js)
# (juga uji /login: head -c 100000 /dev/urandom ... https://DOMAIN/login → 413)
head -c 6291456 /dev/urandom > /tmp/besar.bin
curl -s -o /dev/null -w "%{http_code}\n" -X POST --data-binary @/tmp/besar.bin https://DOMAIN/hadir/uji

# 1 MB → harus diteruskan ke aplikasi (bukan 413; aplikasi akan menolak karena bukan aksi yang sah)
head -c 1048576 /dev/urandom > /tmp/kecil.bin
curl -s -o /dev/null -w "%{http_code}\n" -X POST --data-binary @/tmp/kecil.bin https://DOMAIN/hadir/uji

# Dashboard tetap menerima unggahan besar: unggah video ±20 MB lewat Media Situs → harus berhasil.
```

Uji juga presensi normal dari HP setelah pengaturan aktif (foto + tanda tangan → "Kehadiran tercatat").
