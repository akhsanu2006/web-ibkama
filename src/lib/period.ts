/** "2026/2027" ⇄ "2026-2027" (aman untuk URL). */
export const periodSlug = (name: string) => name.replace("/", "-");
export const mediaUrl = (id?: string | null) => (id ? `/media/${id}` : null);

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
export function formatDate(iso?: string | null) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
export const monthName = (m: number) => MONTHS[m - 1];
