import "server-only";
import { cache } from "react";
import { db, schema } from "@/db";
import { SITE_MEDIA } from "@/content/site-media";
import { mediaUrl } from "@/lib/period";
import { CINEMATIC, type CinematicConfig } from "@/content/cinematic";

/** URL efektif tiap slot: media pengganti bila ada, kalau tidak berkas bawaan. */
export const getSiteMedia = cache(async () => {
  const rows = await db.select().from(schema.siteMedia);
  const custom = new Map(rows.map((r) => [r.key, r.mediaId]));
  const out: Record<string, { url: string | null; custom: boolean; mediaId: string | null }> = {};
  for (const s of SITE_MEDIA) {
    const id = custom.get(s.key) ?? null;
    out[s.key] = { url: id ? mediaUrl(id) : s.fallback, custom: !!id, mediaId: id };
  }
  return out;
});

/**
 * Konfigurasi sinematik dengan media pengganti. Video pengganti dipakai juga untuk layar kecil
 * (HP kini menampilkan versi desktop, jadi varian mobile bawaan hanya dipakai selama belum diganti).
 */
export async function cinematicWithSiteMedia(): Promise<typeof CINEMATIC> {
  const m = await getSiteMedia();
  const apply = (cfg: CinematicConfig, id: "opening" | "hero" | "knowledge"): CinematicConfig => {
    const video = m[`${id}.video`], poster = m[`${id}.poster`];
    return {
      ...cfg,
      src: video?.url ?? cfg.src,
      mobileSrc: video?.custom ? video.url ?? undefined : cfg.mobileSrc,
      poster: poster?.url ?? cfg.poster,
    };
  };
  return { opening: apply(CINEMATIC.opening, "opening"), hero: apply(CINEMATIC.hero, "hero"), knowledge: apply(CINEMATIC.knowledge, "knowledge") };
}
