import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { googleConfigured } from "@/lib/auth/google";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  "akun-tidak-terdaftar": "Akun Google ini belum diberi akses. Hubungi Super Admin untuk didaftarkan.",
  "google-batal": "Masuk dengan Google dibatalkan.",
  "google-gagal": "Masuk dengan Google gagal. Silakan coba lagi.",
  "google-belum-dikonfigurasi": "Masuk dengan Google belum diaktifkan. Gunakan email dan password.",
  "periode-berakhir": "Masa akses Admin Anda sudah berakhir karena periode kepengurusannya tidak lagi aktif. Hubungi Super Admin untuk diperpanjang.",
  "akses-dicabut": "Akses akun Anda telah dicabut atau dinonaktifkan. Hubungi Super Admin bila ini keliru.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const message = error ? ERRORS[error] : undefined;
  const google = googleConfigured();

  return (
    <main className="grid min-h-dvh md:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-green-900 md:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cinematic/umy-poster.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-green-950 via-green-900/70 to-green-900/40" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-3"><Image src="/brand/logo.png" alt="" width={44} height={44} className="rounded-full bg-white p-0.5" /><span className="font-heading text-lg font-bold">IBKAMA UMY</span></Link>
          <div>
            <p className="font-heading text-4xl font-bold leading-tight !text-white">Bersahaja,<br />Berkarya,<br />Berjaya.</p>
            <p className="mt-4 max-w-sm text-sm text-white/70">Masuk untuk mengelola data organisasi lintas periode.</p>
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center bg-white px-6 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-10 flex items-center gap-2 md:hidden"><Image src="/brand/logo.png" alt="" width={36} height={36} /><span className="font-heading font-bold text-green-900">IBKAMA UMY</span></Link>
          <h1 className="text-3xl">Masuk</h1>
          <p className="mt-2 text-sm text-muted">Khusus pengurus yang sudah diberi akses.</p>

          {message && <p role="alert" className="mt-6 rounded-2xl bg-danger-bg px-4 py-3 text-sm text-danger">{message}</p>}

          {google && (
            <>
              {/* <a> biasa (bukan Link): harus navigasi penuh ke route handler OAuth */}
              <a href="/auth/google" className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-full bg-white text-[15px] font-semibold text-ink ring-1 ring-inset ring-line transition hover:bg-green-50">
                <GoogleMark />Masuk dengan Google
              </a>
              <div className="mt-6 flex items-center gap-3 text-xs text-muted">
                <span className="h-px flex-1 bg-line" />atau dengan email<span className="h-px flex-1 bg-line" />
              </div>
            </>
          )}

          <LoginForm />
          <Link href="/" className="mt-8 inline-block text-sm text-muted hover:text-green-800">← Kembali ke website</Link>
        </div>
      </section>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
