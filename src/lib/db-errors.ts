/**
 * drizzle membungkus galat SQLite ("Failed query: <SQL> params: <nilai>") dan menaruh pesan asli di `cause`.
 * Memeriksa `e.message` saja tidak mengenali pelanggaran UNIQUE/FK — dan membuat SQL beserta parameternya
 * (mis. hash password) ikut tampil ke pengguna. Selalu klasifikasikan lewat rantai `cause`, tampilkan pesan sendiri.
 */
function messages(e: unknown): string {
  const out: string[] = [];
  for (let c: unknown = e, i = 0; c && i < 6; c = (c as { cause?: unknown }).cause, i++) out.push(c instanceof Error ? c.message : String(c));
  return out.join(" | ");
}

export const isUniqueViolation = (e: unknown) => /UNIQUE constraint/i.test(messages(e));
export const isForeignKeyViolation = (e: unknown) => /FOREIGN KEY constraint/i.test(messages(e));

/** Catat detail HANYA di log server (dipotong, tanpa parameter). */
export function logDbError(scope: string, e: unknown) {
  const m = messages(e).replace(/params:[\s\S]*$/, "").slice(0, 300);
  console.error(`[${scope}] galat tak terduga:`, m);
}
