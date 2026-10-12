import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/public/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { NAV } from "@/content/nav";

/**
 * Navigasi utama versi beranda: setiap halaman tampil sebagai kotak. Saat kursor masuk,
 * lapisan hijau naik dari bawah, ikon berputar & berubah emas, panah bergeser; klik → halaman tujuan.
 */
export function ExploreGrid() {
  const items = NAV.filter((n) => n.href !== "/");
  return (
    <section aria-labelledby="jelajahi-judul" className="bg-white py-20 md:py-24">
      <Container>
        <header className="mx-auto max-w-3xl text-center">
          <p className="mb-3 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-brown-600">
            <span className="h-px w-6 bg-gold" aria-hidden />Jelajahi
          </p>
          {/* satu baris di layar lebar (HP menampilkan versi desktop yang diperkecil) */}
          <h2 id="jelajahi-judul" className="text-3xl leading-tight md:whitespace-nowrap md:text-4xl">Ruang Informasi IBKAMA UMY</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">Seluruh informasi organisasi, tertata rapi dalam satu ruang yang mudah diakses.</p>
        </header>
        {/* Tata letak 3–2 dengan lebar baris sama persis: grid 6 kolom — 3 kotak atas masing-masing 2 kolom,
            2 kotak bawah masing-masing 3 kolom (lebih panjang), celah sama → tepi kiri & kanan kedua baris sejajar. */}
        <ul className="mt-12 grid gap-4 sm:grid-cols-6">
          {items.map(({ href, label, desc, icon: Icon }, i) => (
            <li key={href} className={i < 3 ? "sm:col-span-2" : "sm:col-span-3"}>
              <Reveal delay={i * 60} className="h-full">
                <Link
                  href={href}
                  className="group relative isolate flex h-full min-h-[210px] flex-col justify-between overflow-hidden rounded-3xl bg-white p-6 shadow-soft ring-1 ring-line transition duration-500 ease-out hover:-translate-y-1.5 hover:shadow-lift hover:ring-green-800 focus-visible:-translate-y-1.5"
                >
                  {/* lapisan isi yang naik saat hover */}
                  <span aria-hidden className="absolute inset-0 -z-10 translate-y-full bg-green-900 transition-transform duration-500 ease-out group-hover:translate-y-0 group-focus-visible:translate-y-0" />
                  <span aria-hidden className="absolute -right-12 -top-12 -z-10 size-40 rounded-full bg-gold/0 blur-2xl transition duration-700 group-hover:bg-gold/25" />

                  <div>
                    <span className="grid size-12 place-items-center rounded-2xl bg-green-100 text-green-800 transition duration-500 group-hover:-rotate-12 group-hover:scale-110 group-hover:bg-white/10 group-hover:text-gold">
                      <Icon size={22} aria-hidden />
                    </span>
                  </div>

                  <div className="mt-8">
                    <h3 className="text-xl transition-colors duration-300 group-hover:!text-white">{label}</h3>
                    <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted transition-colors duration-300 group-hover:text-white/75">{desc}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-green-700 transition-colors duration-300 group-hover:text-gold">
                      Buka halaman
                      <ArrowUpRight size={15} aria-hidden className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
