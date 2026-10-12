import { z } from "zod";

/**
 * Modul efek-samping untuk komponen KLIEN: harus diimpor SEBELUM modul yang membuat skema zod.
 * Tanpa ini zod mencoba `new Function("")` untuk mendeteksi dukungan JIT; di bawah CSP tanpa 'unsafe-eval'
 * itu tercatat sebagai pelanggaran di setiap kunjungan (galatnya ditangkap, validasinya tetap sama).
 */
z.config({ jitless: true });
