import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "IBKAMA UMY — Bersahaja, Berkarya, Berjaya", template: "%s · IBKAMA UMY" },
  description:
    "Ikatan Beasiswa Kader Muhammadiyah Universitas Muhammadiyah Yogyakarta — pusat informasi, arsip, dan pengelolaan organisasi.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${poppins.variable} ${montserrat.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
