import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Login dengan akun Google (OpenID Connect, authorization code + PKCE).
 *
 * PENTING: Google hanya membuktikan "pemilik email ini". Hak akses tetap ditentukan
 * tabel `users` — email harus sudah didaftarkan Super Admin di Pengguna & Peran dan
 * berstatus aktif. Tidak ada pendaftaran mandiri.
 *
 * Kredensial dari environment (TIDAK PERNAH di kode):
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *   NEXT_PUBLIC_SITE_URL (opsional; untuk redirect URI di balik reverse proxy)
 */
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export const OAUTH_COOKIE = "ibkama_google_oauth";
export const CALLBACK_PATH = "/auth/google/callback";

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function redirectUri(requestOrigin: string) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || requestOrigin).replace(/\/$/, "");
  return `${base}${CALLBACK_PATH}`;
}

const b64url = (bytes: Uint8Array) =>
  Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const random = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)));

/** Membuat URL ke halaman izin Google + nilai rahasia sementara yang disimpan di cookie httpOnly. */
export async function startGoogleLogin(requestOrigin: string) {
  const state = random();
  const nonce = random();
  const verifier = random(48);
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));

  const url = new URL(AUTH_URL);
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(requestOrigin),
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();

  return { url: url.toString(), cookieValue: JSON.stringify({ state, nonce, verifier }) };
}

/** Menukar `code` dengan ID token lalu memverifikasi tanda tangan, penerbit, audiens, nonce, dan email. */
export async function finishGoogleLogin(code: string, verifier: string, nonce: string, requestOrigin: string) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(requestOrigin),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Penukaran kode Google gagal (${res.status}).`);
  const { id_token } = (await res.json()) as { id_token?: string };
  if (!id_token) throw new Error("Google tidak mengirim ID token.");

  const { payload } = await jwtVerify(id_token, JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: process.env.GOOGLE_CLIENT_ID!,
  });
  if (payload.nonce !== nonce) throw new Error("Nonce tidak cocok.");
  if (payload.email_verified !== true || typeof payload.email !== "string")
    throw new Error("Email Google belum terverifikasi.");
  return payload.email.toLowerCase();
}
