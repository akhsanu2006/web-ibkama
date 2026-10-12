# IBKAMA UMY — Digital Organization Management Platform

Website resmi + sistem pengelolaan data **Ikatan Beasiswa Kader Muhammadiyah Universitas Muhammadiyah Yogyakarta (IBKAMA UMY)**. Dibangun agar tetap relevan lintas periode kepengurusan — lihat [`docs/ARSITEKTUR.md`](docs/ARSITEKTUR.md) untuk arsitektur lengkap (stack, ERD, matriks peran, sitemap).

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local   # lalu isi SESSION_SECRET & kredensial Super Admin
npm run db:push              # buat skema database
npm run db:seed              # isi data organisasi resmi + akun Super Admin
npm run dev                  # buka http://localhost:3000
```

`SESSION_SECRET` minimal 32 karakter acak (`openssl rand -base64 48`). `SUPERADMIN_EMAIL` dan `SUPERADMIN_PASSWORD` hanya dipakai sekali saat `db:seed` membuat akun pertama — setelah itu ganti password dari halaman **Pengguna & Peran** di dashboard.

## Login dashboard

Demi keamanan, **tidak ada tombol Login** di navigasi publik. Pintu masuk tersembunyi di teks hak cipta paling bawah footer ("© … Seluruh hak dilindungi.") — klik teks itu, atau buka `/login` langsung. Halaman login & dashboard ditandai `noindex` agar tidak muncul di mesin pencari.

> Catatan: menyembunyikan tombol hanya mengurangi perhatian publik. Pengaman yang sebenarnya tetap login + pemeriksaan hak akses di server pada setiap permintaan.

Super Admin (penuh, termasuk mengangkat/mencopot Admin di **Pengguna & Peran**) dapat menambah akun **Admin** untuk Ketua Umum, Sekretaris, Bendahara, Ketua/Sekretaris Divisi. Admin dapat mengunggah data Program, Event, Arsip, Dokumen, Kepengurusan, Ketum, dan Dokumentasi; tidak dapat membuka Periode, Pengguna, Profil Organisasi, dan Integrasi.

### Masuk dengan Google

1. Di [Google Cloud Console](https://console.cloud.google.com/apis/credentials) buat **OAuth client ID** tipe *Web application*.
2. Daftarkan *Authorized redirect URI*: `https://<domain-website>/auth/google/callback` (dan `http://localhost:3000/auth/google/callback` untuk pengembangan).
3. Isi `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` (serta `NEXT_PUBLIC_SITE_URL` di produksi) pada environment server, lalu restart.

Tombol "Masuk dengan Google" muncul otomatis setelah dikonfigurasi. Hanya email yang sudah didaftarkan Super Admin di **Pengguna & Peran** dan berstatus aktif yang bisa masuk — akun Google lain ditolak. Saat menambah pengguna, password boleh dikosongkan bila orang itu hanya akan masuk dengan Google.

## Alur kerja pengurus (tanpa developer)

1. **Kelola Periode** → buat periode baru (mis. `2027/2028`) → jadikan aktif. Periode lama otomatis diarsipkan, datanya tidak pernah hilang.
2. **Anggota & Pengurus**, **Divisi**, **Program Kerja**, **Event** → tambahkan data untuk periode yang sedang dipilih.
3. **Presensi QR** → buka presensi pada sebuah event untuk memunculkan kode QR; peserta memindai dan mengisi form di `/hadir/[kode]` tanpa login; rekap dan ekspor CSV tersedia di halaman yang sama.
4. **Arsip Organisasi**, **Dokumen**, **Dokumentasi** → unggah dan klasifikasikan per periode & kategori.
5. **Riwayat Ketua Umum** → satu entri per periode, tampil sebagai timeline publik di `/leadership`.
6. **Profil Organisasi** dan **Integrasi** (khusus Super Admin) → ubah identitas resmi, kontak, dan tautan Google Forms/Calendar/Drive/WhatsApp/Instagram kapan pun diperlukan.

## Video sinematik

Tiga animasi scroll-driven belum memiliki berkas video final. Taruh video di `public/cinematic/video/` dengan nama yang tercantum di komentar [`src/content/cinematic.ts`](src/content/cinematic.ts) — tidak perlu mengubah kode lain. Sebelum video terpasang, publik melihat poster elegan, bukan video palsu.

## Struktur proyek

Lihat bagian "Arsitektur kode" di [`docs/ARSITEKTUR.md`](docs/ARSITEKTUR.md).

## Perintah lain

```bash
npm run build      # build produksi
npm run lint        # ESLint
npm run db:generate # buat migration file dari perubahan schema.ts
```
