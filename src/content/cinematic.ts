/**
 * Konfigurasi tiga animasi sinematik berbasis scroll.
 *
 * CARA MEMASANG VIDEO FINAL (tanpa mengubah kode lain):
 *  1. Taruh berkas di public/cinematic/video/ dengan nama di bawah.
 *  2. Selesai. Komponen mendeteksi berkas otomatis; bila belum ada, tampil poster.
 *
 * Spesifikasi video: 16:9, MP4 H.264, tanpa audio, 24–30 fps, 6–10 detik,
 * keyframe rapat agar scrubbing mulus, contoh:
 *   ffmpeg -i in.mp4 -an -vf scale=1920:-2 -c:v libx264 -crf 24 -g 2 -movflags +faststart out.mp4
 */
export type Caption = { from: number; to: number; title: string; text?: string };

export type CinematicConfig = {
  id: string;
  /** null = belum tersedia → mode poster */
  src: string;
  mobileSrc?: string;
  poster: string;
  alt: string;
  /** tinggi track scroll (vh); makin besar = makin lambat */
  heightVh: number;
  /** progres (0–1) saat layar mulai memutih untuk transisi */
  whiteFrom: number;
  posterMotion: "push-in" | "hold";
  captions: Caption[];
  /**
   * true = video berjalan sendiri (autoplay + loop), progres scroll hanya
   * menggerakkan caption/zoom poster/transisi putih — bukan currentTime video.
   * false/undefined (default) = video di-scrub penuh mengikuti scroll, seperti dua sinematik lain.
   */
  autoplay?: boolean;
};

export const CINEMATIC: Record<"opening" | "hero" | "knowledge", CinematicConfig> = {
  opening: {
    id: "opening",
    src: "/cinematic/video/01-umy-to-ibkama.mp4",
    mobileSrc: "/cinematic/video/01-umy-to-ibkama-mobile.mp4",
    poster: "/cinematic/umy-poster.jpg",
    alt: "Tampak depan Universitas Muhammadiyah Yogyakarta",
    heightVh: 380,
    whiteFrom: 0.62,
    posterMotion: "push-in",
    autoplay: true,
    captions: [
      { from: 0, to: 0.3, title: "Universitas Muhammadiyah Yogyakarta", text: "Dari sinilah cerita kami bermula." },
      { from: 0.32, to: 0.62, title: "Bersahaja, Berkarya, Berjaya", text: "Wadah kader penerima Beasiswa Muhammadiyah." },
    ],
  },
  hero: {
    id: "hero",
    src: "/cinematic/video/02-hero-laptop.mp4",
    mobileSrc: "/cinematic/video/02-hero-laptop-mobile.mp4",
    poster: "/cinematic/hero-reference.jpg",
    alt: "Anggota IBKAMA mengenakan korsa hijau olive",
    heightVh: 380,
    whiteFrom: 0.7,
    posterMotion: "push-in",
    captions: [
      { from: 0.04, to: 0.36, title: "Aktif, modern, dekat dengan ilmu", text: "Kader yang belajar dan bertumbuh bersama teknologi." },
      { from: 0.4, to: 0.68, title: "Belajar tanpa henti", text: "Setiap layar adalah pintu menuju pengetahuan baru." },
    ],
  },
  knowledge: {
    id: "knowledge",
    src: "/cinematic/video/03-knowledge-orbit.mp4",
    mobileSrc: "/cinematic/video/03-knowledge-orbit-mobile.mp4",
    poster: "/cinematic/knowledge-poster.jpg",
    alt: "Anggota IBKAMA belajar dengan laptop, dikelilingi berbagai bidang ilmu",
    heightVh: 420,
    whiteFrom: 2, // tidak memutih: berakhir tenang lalu section final muncul
    posterMotion: "hold",
    captions: [
      { from: 0.05, to: 0.4, title: "Satu keluarga, beragam keilmuan", text: "Data, arsitektur, kedokteran — dan banyak lagi." },
      { from: 0.5, to: 0.95, title: "Matang dalam ilmu, teguh dalam nilai", text: "Kecakapan lintas jurusan yang dibingkai kaderisasi." },
    ],
  },
};
