# Batas ukuran request presensi publik (reverse proxy 5 MB)

> **Status: BELUM AKTIF.** Pengaturan ini harus diterapkan di server hosting. Di lingkungan lokal
> (`npm run dev` / `npm run start`) tidak ada reverse proxy, sehingga perlindungan ini belum berlaku.

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
    # ... konfigurasi domain & TLS ...

    # Presensi publik: tolak body > 5 MB sebelum sampai ke Next.js (respons 413).
    location /hadir/ {
        client_max_body_size 5m;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;   # TIMPA (jangan teruskan nilai dari klien)
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Selebihnya (dashboard butuh unggahan video ≤ 50 MB).
    location / {
        client_max_body_size 60m;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Catatan `X-Forwarded-For`: pembatas login & presensi membaca IP dari header ini
(`src/lib/auth/rate-limit.ts`). Proxy **wajib menimpanya** dengan `$remote_addr`; bila nilai dari klien
diteruskan apa adanya, pembatas per IP dapat diakali.

Setelah mengubah: `sudo nginx -t && sudo systemctl reload nginx`.

## Hostinger

- **VPS Hostinger**: sama seperti bagian nginx di atas.
- **Hosting Node.js terkelola (Web App)**: reverse proxy dikelola Hostinger. Periksa apakah panel
  menyediakan pengaturan batas body per path; bila tidak, tanyakan ke dukungan Hostinger apakah
  `client_max_body_size` per lokasi bisa diatur. Bila tidak bisa per path, batas global 60 MB tetap
  berlaku dan risikonya hanya diredam oleh pembatas frekuensi (C-A) — catat sebagai risiko yang diterima.

## Cara menguji setelah diterapkan

```bash
# 6 MB acak ke halaman presensi → harus 413 dari proxy (bukan dari Next.js)
head -c 6291456 /dev/urandom > /tmp/besar.bin
curl -s -o /dev/null -w "%{http_code}\n" -X POST --data-binary @/tmp/besar.bin https://DOMAIN/hadir/uji

# 1 MB → harus diteruskan ke aplikasi (bukan 413; aplikasi akan menolak karena bukan aksi yang sah)
head -c 1048576 /dev/urandom > /tmp/kecil.bin
curl -s -o /dev/null -w "%{http_code}\n" -X POST --data-binary @/tmp/kecil.bin https://DOMAIN/hadir/uji

# Dashboard tetap menerima unggahan besar: unggah video ±20 MB lewat Media Situs → harus berhasil.
```

Uji juga presensi normal dari HP setelah pengaturan aktif (foto + tanda tangan → "Kehadiran tercatat").
