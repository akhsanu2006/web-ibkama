import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * CSP dalam mode ENFORCEMENT (diuji di Chrome sungguhan: halaman publik, login, dashboard, presensi, PDF.js).
 * Sebelum menambah sumber daya eksternal (gambar/skrip/iframe/font dari domain lain) tambahkan dulu ke kebijakan
 * ini, atau halaman akan memblokirnya. Untuk mencoba kebijakan baru tanpa memblokir, gunakan sementara kunci
 * "Content-Security-Policy-Report-Only" lalu kembalikan.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`, // dev: React butuh eval untuk debugging
  "style-src 'self' 'unsafe-inline'", // animasi & mask memakai style inline
  "img-src 'self' data: blob:", // QR, tanda tangan, foto kamera (data:), pratinjau unggahan (blob:)
  "media-src 'self' blob:", // video sinematik/logo dari situs sendiri + pratinjau video
  "font-src 'self'", // next/font menyajikan font dari situs sendiri
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`, // dev: hot-reload memakai websocket
  "worker-src 'self' blob:", // worker pdf.js
  "frame-src 'none'", // belum ada iframe di situs
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // kamera WAJIB diizinkan untuk situs sendiri (foto bukti presensi)
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  // HSTS SENGAJA BELUM DIPASANG — aktifkan setelah domain produksi HTTPS stabil.
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  experimental: {
    serverActions: {
      // Default Next.js hanya 1 MB — foto dokumentasi (maks 8 MB) & dokumen (maks 25 MB,
      // lihat src/lib/media.ts) akan gagal diunggah. Sisakan ruang untuk overhead multipart.
      bodySizeLimit: "60mb", // video Media Situs maks 50 MB
    },
    // proxy.ts mencakup /admin/*: tanpa ini body >10 MB dipotong diam-diam sebelum sampai ke Server Action.
    proxyClientMaxBodySize: "60mb",
  },
  // Halaman Ketum digabung ke Kepengurusan; tautan lama tetap berfungsi (redirect permanen).
  async redirects() {
    return [{ source: "/leadership", destination: "/kepengurusan#ketum", permanent: true }];
  },
};

export default nextConfig;
