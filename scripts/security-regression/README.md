# Suite regresi keamanan

Menguji build produksi lokal terhadap **salinan** database dan unggahan (aslinya hanya dibaca).

```bash
npm run build
sh scripts/security-regression/run.sh            # semua grup
sh scripts/security-regression/run.sh authz csv   # sebagian
```

| Grup | Isi |
|---|---|
| `media` | akses media anonim / berizin / periode berakhir, Range, HEAD, traversal |
| `authz` | halaman & Server Action admin vs Super Admin vs anonim (ada kontrol positif) |
| `origin` | Server Action dengan Origin valid / tanpa / lintas-situs / `null` / body malformed |
| `session` | login, kunci percobaan, logout, ganti password, token palsu/kedaluwarsa |
| `content` | validasi URL, XSS tersimpan, isi unggahan, pembersihan berkas saat ganti/hapus |
| `csv` | ekspor CSV: formula injection, kutipan, baris baru |
| `headers` | header keamanan (CSP enforce, XFO, nosniff, Referrer-Policy, Permissions-Policy) |
| `misc` | pesan galat DB tanpa SQL, batas panjang password, input login panjang |
| `body` | batas ukuran body Server Action publik + presensi sah dengan bukti besar |

Syarat: `sqlite3`, Node ≥ 20, `lsof`, dan `.env.local` berisi `SESSION_SECRET`. Port uji `3300` (ubah dengan `AUDIT_PORT`).
Kedua DB dan unggahan uji dibuat di `.audit-work/` (diabaikan Git) lalu dihapus.

`browser-check.mjs` (opsional, macOS + Google Chrome): memeriksa hidrasi, pelanggaran CSP, dan alur presensi
di Chrome sungguhan. Dijalankan manual terhadap server uji yang masih hidup dengan `AUDIT_DIR` dan `token.txt`.
