import type { Viewport } from "next";
import { Footer } from "@/components/public/footer";
import { Navbar } from "@/components/public/navbar";
import { ViewportFit } from "@/components/viewport-fit";
import { getCurrentUser } from "@/lib/auth/dal";
import { DESKTOP_WIDTH, isHp } from "@/lib/perangkat";
import { getOrganization } from "@/lib/queries/public";

/**
 * HP: render tata letak desktop selebar 1280px lalu diperkecil pas layar — tampilan sama persis dengan PC.
 * `initialScale: undefined` (eksplisit) menghapus initial-scale=1 bawaan Next agar browser HP memperkecil otomatis.
 * PC tidak terpengaruh (browser PC mengabaikan meta viewport).
 */
export async function generateViewport(): Promise<Viewport> {
  return (await isHp()) ? { width: DESKTOP_WIDTH, initialScale: undefined } : { width: "device-width", initialScale: 1 };
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [org, user, hp] = await Promise.all([getOrganization(), getCurrentUser(), isHp()]);
  return (
    <div data-perangkat={hp ? "hp" : "pc"}>
      {hp && <ViewportFit width={DESKTOP_WIDTH} />}
      <a href="#konten" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
        Lewati ke konten
      </a>
      <Navbar loggedIn={!!user} />
      <main id="konten">{children}</main>
      <Footer org={org} />
    </div>
  );
}
