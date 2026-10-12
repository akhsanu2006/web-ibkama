import { readFileSync } from "node:fs";
import { SignJWT } from "jose";
import { createClient } from "@libsql/client";
import { createRequire } from "node:module";
const { encodeReply } = createRequire(import.meta.url)("next/dist/compiled/react-server-dom-turbopack/client.edge");
const BASE = process.env.BASE ?? "http://localhost:3300";
const E = process.env.E;
if (!E || !/audit/i.test(E)) { console.error("E harus menunjuk direktori kerja salinan (mengandung 'audit'). Gunakan run.sh."); process.exit(2); }
const db = createClient({ url: `file:${E}/ibkama.db` });
const secret = readFileSync(".env.local", "utf8").match(/^SESSION_SECRET=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
let pass = 0, fail = 0;
const ok = (c, l, x = "") => { if (c) pass++; else fail++; console.log(`${c ? "LULUS" : "GAGAL"}  ${l}${x ? "  — " + x : ""}`); };
const one = async (s, a = []) => Object.values((await db.execute({ sql: s, args: a })).rows[0] ?? {})[0];
async function ck(uid) {
  const v = Number(await one("select session_version from users where id=?", [uid]));
  const t = await new SignJWT({ userId: uid, expiresAt: Date.now() + 3600e3, v }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(new Date(Date.now() + 3600e3)).sign(new TextEncoder().encode(secret));
  return `ibkama_session=${t}`;
}
const T = 10000;
async function rq(path, { method = "GET", headers = {}, body, as } = {}) {
  const ac = new AbortController(), t0 = Date.now(), to = setTimeout(() => ac.abort(), T);
  const h = { ...headers }; if (as) h.cookie = await ck(as);
  try {
    const r = await fetch(`${BASE}${path}`, { method, headers: h, body, signal: ac.signal, redirect: "manual" });
    const buf = Buffer.from(await r.arrayBuffer());
    return { s: r.status, h: r.headers, n: buf.length, t: buf.toString("utf8").slice(0, 3000), ms: Date.now() - t0 };
  } catch { return { s: "TIMEOUT", h: new Headers(), n: 0, t: "", ms: Date.now() - t0 }; } finally { clearTimeout(to); }
}
const alive = async () => (await rq("/login")).s === 200;
const man = () => JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")).node;
const actId = (name) => Object.entries(man()).find(([, v]) => v.exportedName === name)?.[0];
async function act(name, args, { as, origin = BASE, path = "/admin", headers: extra = {} } = {}) {
  const body = await encodeReply(args);
  const headers = { "next-action": actId(name), accept: "text/x-component", ...extra };
  if (origin !== null) headers.origin = origin;
  return rq(path, { method: "POST", headers, body, as });
}
const group = process.argv[2];

if (group === "media") {
  console.log("== Media & otorisasi file");
  let r = await rq("/media/uji-e-m-pub"); ok(r.s === 200 && r.h.get("content-type") === "image/png", "publik anonim → 200", `${r.s}`);
  ok(r.h.get("x-content-type-options") === "nosniff", "nosniff pada media");
  r = await rq("/media/uji-e-m-priv"); ok(r.s === 404, "bukti presensi privat, anonim → 404", `${r.s}`);
  r = await rq("/media/uji-e-m-priv", { as: "uji-e-admin" }); ok(r.s === 200 && /no-store/.test(r.h.get("cache-control")), "bukti privat, admin login → 200 + no-store", `${r.s}`);
  r = await rq("/media/uji-e-m-int"); ok(r.s === 404, "dokumen internal, anonim → 404 (walau media 'public')", `${r.s}`);
  r = await rq("/media/uji-e-m-int", { as: "uji-e-admin" }); ok(r.s === 200, "dokumen internal, admin → 200", `${r.s}`);
  r = await rq("/media/uji-e-m-doc"); ok(r.s === 200 && /attachment/.test(r.h.get("content-disposition")), "dokumen publik → attachment", `${r.s}`);
  r = await rq("/media/uji-e-m-priv", { as: "uji-e-old" }); ok(r.s === 404, "akun admin periode berakhir → 404 (sesi tak berlaku)", `${r.s}`);
  r = await rq("/media/..%2F..%2F.env.local"); ok(r.s === 404, "traversal di id → 404", `${r.s}`);
  r = await rq("/media/uji-e-m-pub", { headers: { range: "bytes=0-0" } }); ok(r.s === 206 && r.n === 1, "Range 0-0 → 206 1 byte", `${r.s}/${r.n}`);
  r = await rq("/media/uji-e-m-pub", { headers: { range: "bytes=999999-" } }); ok(r.s === 416, "Range di luar ukuran → 416", `${r.s}`);
  r = await rq("/media/uji-e-m-pub", { headers: { range: "bytes=5-2" } }); ok(r.s === 416, "Range terbalik → 416", `${r.s}`);
  r = await rq("/media/uji-e-m-pub", { headers: { range: "bytes=-99999999999999999999" } }); ok(typeof r.s === "number" && r.s < 500, "Range sufiks sangat besar tidak 5xx", `${r.s}`);
  r = await rq("/media/uji-e-m-pub", { method: "HEAD" }); ok(r.s === 200 && r.n === 0, "HEAD → 200 tanpa body");
  r = await rq("/media/uji-e-m-pub", { method: "POST", body: "x" }); ok(r.s === 405, "POST ke media → 405", `${r.s}`);
  ok(await alive(), "server responsif setelah semua uji media");
}

if (group === "authz") {
  console.log("== Otorisasi halaman & aksi (admin biasa vs Super Admin vs anonim)");
  for (const p of ["/admin/pengguna", "/admin/pengguna/new", "/admin/periode/new", "/admin/integrasi", "/admin/organisasi"]) {
    let r = await rq(p, { as: "uji-e-admin" }); ok(r.s === 307 && /akses=ditolak/.test(r.h.get("location") ?? ""), `admin biasa GET ${p} → ditolak`, `${r.s} ${r.h.get("location") ?? ""}`);
    r = await rq(p); ok(r.s === 307 && /\/login/.test(r.h.get("location") ?? ""), `anonim GET ${p} → /login`, `${r.s}`);
  }
  let r = await rq("/admin/pengguna", { as: "uji-e-super" }); ok(r.s === 200, "Super Admin GET /admin/pengguna → 200", `${r.s}`);
  // aksi langsung (Server Action) oleh admin biasa
  const fd = new FormData(); for (const [k, v] of Object.entries({ name: "X", email: "x-uji@uji.invalid", role: "super_admin", password: "Passw0rd!x" })) fd.append(k, v);
  const before = Number(await one("select count(*) from users"));
  r = await act("createUser", [undefined, fd], { as: "uji-e-admin" });
  ok(Number(await one("select count(*) from users")) === before, "admin biasa memanggil createUser → tidak ada akun dibuat", `HTTP ${r.s}`);
  r = await act("deleteUser", ["uji-e-admin2"], { as: "uji-e-admin" });
  ok(await one("select count(*) from users where id='uji-e-admin2'") == 1, "admin biasa memanggil deleteUser → akun tetap ada", `HTTP ${r.s}`);
  const fd2 = new FormData(); fd2.append("name", "Admin Naik"); fd2.append("role", "super_admin"); fd2.append("isActive", "on");
  r = await act("updateUser", ["uji-e-admin", undefined, fd2], { as: "uji-e-admin" });
  ok(await one("select role from users where id='uji-e-admin'") === "admin", "admin biasa menaikkan perannya sendiri → ditolak", `HTTP ${r.s}`);
  const fd3 = new FormData(); fd3.append("url", "https://example.org"); fd3.append("enabled", "on");
  const k = await one("select key from integrations limit 1");
  r = await act("updateIntegration", [k, undefined, fd3], { as: "uji-e-admin" });
  ok((await one("select url from integrations where key=?", [k])) !== "https://example.org", "admin biasa updateIntegration → ditolak", `HTTP ${r.s}`);
  r = await act("setActivePeriod", [await one("select id from periods where status='archived'")], { as: "uji-e-admin" });
  ok(await one("select count(*) from periods where status='active'") == 1 && await one("select count(*) from periods where status='archived'") >= 1, "admin biasa setActivePeriod → ditolak", `HTTP ${r.s}`);
  r = await act("deleteUser", ["uji-e-admin2"], { as: undefined });
  ok(await one("select count(*) from users where id='uji-e-admin2'") == 1, "anonim memanggil deleteUser → ditolak", `HTTP ${r.s}`);
  r = await act("revokeAccess", ["uji-e-admin2"], { as: "uji-e-admin" });
  ok(await one("select is_active from users where id='uji-e-admin2'") == 1, "admin biasa revokeAccess → ditolak", `HTTP ${r.s}`);
  // ekspor CSV
  r = await rq("/admin/presensi/uji-e-prog/export"); ok(r.s !== 200, "ekspor CSV anonim → bukan 200", `${r.s}`);
  r = await rq("/admin/presensi/uji-e-prog/export", { as: "uji-e-admin" }); ok(r.s === 200 && /text\/csv/.test(r.h.get("content-type")), "ekspor CSV admin berizin → 200", `${r.s}`);
  ok(await alive(), "server responsif");
}

if (group === "origin") {
  console.log("== Server Action: Origin valid / tanpa / tidak sesuai / malformed");
  const code = "ujikodeE000000000000AA";
  const mk = () => { const f = new FormData(); for (const [k, v] of Object.entries({ code, name: "Uji Origin", identifier: "", studyProgram: "", cohort: "", photo: "", signature: "" })) f.append(k, v); return f; };
  const row = async () => Number(await one("select count(*) from program_attendances where program_id='uji-e-prog'"));
  const path = `/hadir/${code}`;
  const res = {};
  for (const [name, origin] of [["valid", BASE], ["tanpa", null], ["beda", "https://evil.example"], ["null", "null"]]) {
    const r = await act("checkIn", [undefined, mk()], { origin, path });
    res[name] = r; console.log(`   [${name}] HTTP ${r.s} ${r.ms}ms ${r.t.replace(/\s+/g, " ").slice(0, 110)}`);
    ok(await alive(), `server responsif setelah Origin ${name}`);
  }
  ok(res.valid.s === 200 && /Periksa kembali isian/.test(res.valid.t), "Origin valid diproses (ditolak validasi NIM kosong)");
  ok(res.beda.s !== 200 || !/Periksa kembali isian/.test(res.beda.t), "Origin lintas-situs TIDAK diproses oleh aksi", `HTTP ${res.beda.s}`);
  ok(res.null.s !== 200 || !/Periksa kembali isian/.test(res.null.t), "Origin 'null' TIDAK diproses oleh aksi", `HTTP ${res.null.s}`);
  console.log(`   [info] Origin tanpa → ${/Periksa kembali isian/.test(res.tanpa.t) ? "DIPROSES (framework mengizinkan)" : "ditolak"} HTTP ${res.tanpa.s}`);
  // malformed
  const malformed = [
    ["body acak", "garbage-not-multipart", { "content-type": "text/plain" }],
    ["action id palsu", await encodeReply([undefined, mk()]), { "next-action": "ffffffffffffffffffffffffffffffffffffffffff", accept: "text/x-component", origin: BASE }],
    ["multipart rusak", "--x\r\nContent-Disposition: form-data; name=\"0\"\r\n\r\n[[[[", { "content-type": "multipart/form-data; boundary=x", "next-action": actId("checkIn"), origin: BASE }],
    ["JSON dalam tidak valid", (() => { const f = new FormData(); f.append("0", "{not json"); return f; })(), { "next-action": actId("checkIn"), origin: BASE, accept: "text/x-component" }],
  ];
  for (const [n, body, headers] of malformed) {
    const r = await rq(path, { method: "POST", headers, body });
    console.log(`   [malformed:${n}] HTTP ${r.s} ${r.ms}ms`);
    ok(r.s !== "TIMEOUT" && (await alive()), `malformed '${n}' tidak melumpuhkan server`, `HTTP ${r.s}`);
  }
  ok(await row() === 1, "tidak ada baris kehadiran baru dari seluruh kiriman uji");
}
if (group === "content") {
  console.log("== Konten, unggahan, XSS, dan pembersihan berkas");
  const { existsSync } = await import("node:fs");
  const mediaCount = async () => Number(await one("select count(*) from media"));
  const news = async (over = {}, file) => {
    const f = new FormData();
    for (const [k, v] of Object.entries({ category: "kabar", date: "2026-10-01", title: "Berita Uji", summary: "", body: "", sourceUrl: "", personName: "", level: "", isPublic: "on", ...over })) f.append(k, v);
    if (file) f.append("coverMediaId", file);
    return f;
  };
  // kontrol positif: Super Admin dapat memanggil aksi yang sama dengan jalur uji admin biasa
  const k = await one("select key from integrations limit 1");
  const fdI = new FormData(); fdI.append("url", "https://example.org/kontrol"); fdI.append("enabled", "on");
  await act("updateIntegration", [k, undefined, fdI], { as: "uji-e-super" });
  ok(await one("select url from integrations where key=?", [k]) === "https://example.org/kontrol", "KONTROL POSITIF: Super Admin updateIntegration berhasil (harness valid)");
  // URL berbahaya & validasi
  let n0 = Number(await one("select count(*) from news"));
  await act("saveResource", ["berita", null, undefined, await news({ sourceUrl: "javascript:alert(1)" })], { as: "uji-e-admin" });
  ok(Number(await one("select count(*) from news")) === n0, "sourceUrl javascript: ditolak validasi server");
  // XSS tersimpan: judul berisi tag
  await act("saveResource", ["berita", null, undefined, await news({ title: "<script>alert(1)</script><img src=x onerror=alert(2)>" })], { as: "uji-e-admin" });
  const xid = await one("select id from news where title like '%<script>%'");
  ok(!!xid, "judul ber-tag tersimpan apa adanya (kontrol)");
  let r = await rq(`/berita/${xid}`);
  ok(r.s === 200 && !/<script>alert\(1\)/.test(r.t) && !/<img src=x onerror/.test(r.t), "halaman publik meng-escape tag (tidak ada <script>/<img> mentah)", `HTTP ${r.s}`);
  // unggahan
  const html = new File([Buffer.from("<html><script>alert(1)</script></html>")], "x.png", { type: "image/png" });
  const m00 = await mediaCount();
  await act("saveResource", ["berita", null, undefined, await news({ title: "Cover HTML" }, html)], { as: "uji-e-admin" });
  const cid = await one("select cover_media_id from news where title='Cover HTML'");
  console.log(`   [info] berkas HTML berlabel image/png → ${cid ? "DITERIMA (tanpa pemeriksaan isi)" : "ditolak"}`);
  ok(!cid && await mediaCount() === m00, "berkas HTML berlabel image/png DITOLAK (pemeriksaan isi)");
  if (cid) { r = await rq(`/media/${cid}`); ok(r.h.get("content-type") === "image/png" && r.h.get("x-content-type-options") === "nosniff", "…tetapi disajikan sebagai image/png + nosniff (tidak dieksekusi)", `${r.h.get("content-type")}`); }
  const big = new File([Buffer.alloc(9 * 1024 * 1024, 1)], "b.png", { type: "image/png" });
  const mb = await mediaCount();
  await act("saveResource", ["berita", null, undefined, await news({ title: "Cover Besar" }, big)], { as: "uji-e-admin" });
  ok(await mediaCount() === mb, "gambar 9 MB (>8 MB) ditolak, tidak ada media baru");
  const exe = new File([Buffer.from("MZ....")], "x.exe", { type: "application/x-msdownload" });
  await act("saveResource", ["berita", null, undefined, await news({ title: "Cover EXE" }, exe)], { as: "uji-e-admin" });
  ok(await mediaCount() === mb, "MIME tak diizinkan ditolak");
  // pembersihan berkas saat ganti & hapus
  const png = new File([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64")], "c.png", { type: "image/png" });
  await act("saveResource", ["berita", null, undefined, await news({ title: "Cover Ganti" }, png)], { as: "uji-e-admin" });
  const nid = await one("select id from news where title='Cover Ganti'"); const c1 = await one("select cover_media_id from news where id=?", [nid]);
  const png2 = new File([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64")], "d.png", { type: "image/png" });
  await act("saveResource", ["berita", nid, undefined, await news({ title: "Cover Ganti" }, png2)], { as: "uji-e-admin" });
  const c2 = await one("select cover_media_id from news where id=?", [nid]);
  ok(c1 && c2 && c1 !== c2, "cover diganti (kontrol)");
  ok(Number(await one("select count(*) from media where id=?", [c1])) === 0, "media LAMA dihapus saat cover diganti");
  const c2path = await one("select path from media where id=?", [c2]);
  ok(existsSync(`${E}/uploads/${c2path}`), "berkas cover ada di disk sebelum hapus (kontrol)");
  await act("deleteResource", ["berita", nid], { as: "uji-e-admin" });
  ok(Number(await one("select count(*) from news where id=?", [nid])) === 0, "berita terhapus (kontrol)");
  ok(Number(await one("select count(*) from media where id=?", [c2])) === 0 && !existsSync(`${E}/uploads/${c2path}`), "media cover ikut terhapus (baris + berkas) saat berita dihapus");
  // hapus program berisi presensi → bukti privat harus ikut terhapus
  ok(existsSync(`${E}/uploads/2026/uji-e-m-priv.png`), "berkas bukti privat ada sebelum hapus program (kontrol)");
  await act("deleteResource", ["program", "uji-e-prog"], { as: "uji-e-super" });
  ok(Number(await one("select count(*) from programs where id='uji-e-prog'")) === 0, "program terhapus (kontrol)");
  ok(Number(await one("select count(*) from media where id='uji-e-m-priv'")) === 0 && !existsSync(`${E}/uploads/2026/uji-e-m-priv.png`), "bukti presensi privat ikut terhapus bersama program");
  ok(await alive(), "server responsif");
}

if (group === "body") {
  console.log("== Batas ukuran request (Server Action publik), tanpa reverse proxy");
  const { execSync } = await import("node:child_process");
  const pid = execSync(`lsof -ti tcp:${new URL(BASE).port} -sTCP:LISTEN | head -1`).toString().trim();
  const rss = () => Math.round(Number(execSync(`ps -o rss= -p ${pid}`).toString()) / 1024);
  const code = "ujikodeE000000000000AA";
  const mb = (n) => "data:image/jpeg;base64," + "A".repeat(Math.round(n * 1024 * 1024));
  const hadir = (photoMB) => { const f = new FormData(); for (const [k, v] of Object.entries({ code, name: "Uji Besar", identifier: "55556666", studyProgram: "", cohort: "", signature: "" })) f.append(k, v); f.append("photo", mb(photoMB)); return f; };
  const base = rss(); console.log(`   rss awal ${base} MB`);
  for (const size of [1, 6, 30, 65]) {
    const r = await act("checkIn", [undefined, hadir(size)], { path: `/hadir/${code}` });
    const msg = /terlalu besar/.test(r.t) ? "ditolak aplikasi: bukti terlalu besar" : /Periksa|Lengkapi/.test(r.t) ? "ditolak validasi" : r.t.replace(/\s+/g, " ").slice(0, 70);
    console.log(`   POST ±${size} MB ke /hadir → HTTP ${r.s} ${r.ms}ms | ${msg} | rss ${rss()} MB`);
    ok(r.s !== "TIMEOUT" && await alive(), `server responsif setelah ${size} MB`);
  }
  // alur SAH: foto & TTD mendekati batas aplikasi (±1,4 MB masing-masing) tidak boleh terputus
  { const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(1.4 * 1024 * 1024, 7)]);
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(1.4 * 1024 * 1024, 9)]);
    const f = new FormData(); for (const [k, v] of Object.entries({ code, name: "Uji Sah Besar", identifier: "77778888", studyProgram: "", cohort: "" })) f.append(k, v);
    f.append("photo", "data:image/jpeg;base64," + jpg.toString("base64")); f.append("signature", "data:image/png;base64," + png.toString("base64"));
    const r = await act("checkIn", [undefined, f], { path: `/hadir/${code}`, headers: { "x-forwarded-for": "10.7.7.7" } });
    const saved = Number(await one("select count(*) from program_attendances where identifier='77778888'"));
    console.log(`   presensi SAH foto+TTD ±2×1,4 MB → HTTP ${r.s} ${r.ms}ms, tersimpan=${saved}`);
    ok(saved === 1, "presensi sah dengan bukti besar (≈3,8 MB body) tetap tersimpan"); }
  // gate tidak boleh dilewati lewat path: aksi sah dikirim ke halaman publik lain
  for (const path of ["/profil", "/", "/kepengurusan"]) {
    const r = await act("checkIn", [undefined, hadir(10)], { path });
    ok(r.s === 413, `10 MB ke ${path} dengan aksi checkIn → 413 (gate berlaku di semua path publik)`, `HTTP ${r.s}`);
  }
  { const lf = new FormData(); lf.append("email", "a@b.c"); lf.append("password", "p".repeat(200 * 1024));
    const r = await act("login", [undefined, lf], { path: "/profil" });
    ok(r.s === 413, "aksi login 200 KB dikirim ke /profil → 413", `HTTP ${r.s}`); }
  ok(await alive(), "server responsif setelah uji bypass path");
  // login dengan password raksasa
  const lf = new FormData(); lf.append("email", "tidak-ada@uji.invalid"); lf.append("password", "p".repeat(30 * 1024 * 1024));
  const lr = await act("login", [undefined, lf], { path: "/login" });
  console.log(`   POST ±30 MB ke /login → HTTP ${lr.s} ${lr.ms}ms | rss ${rss()} MB`);
  ok(lr.s !== "TIMEOUT" && await alive(), "server responsif setelah login 30 MB");
  // 4 permintaan 30 MB serentak (terbatas)
  const t1 = Date.now();
  const rs = await Promise.all([0, 1, 2, 3].map(() => act("checkIn", [undefined, hadir(30)], { path: `/hadir/${code}` })));
  console.log(`   4 × 30 MB serentak → ${rs.map((r) => r.s).join(",")} ${Date.now() - t1}ms | rss puncak ${rss()} MB`);
  ok(await alive(), "server responsif setelah 4×30 MB serentak");
  console.log(`   [info] akibat: aplikasi MENERIMA & membaca body hingga 60 MB dari anonim (/hadir, /login)`);
}

if (group === "session") {
  console.log("== Login, sesi, pembatasan percobaan, token");
  const { pw } = JSON.parse(readFileSync(`${E}/akun.json`, "utf8"));
  const login = async (email, password, ip) => {
    const f = new FormData(); f.append("email", email); f.append("password", password);
    const body = await encodeReply([undefined, f]);
    const r = await fetch(`${BASE}/login`, { method: "POST", body, redirect: "manual", headers: { "next-action": actId("login"), accept: "text/x-component", origin: BASE, "x-forwarded-for": ip } });
    const t = await r.text(); const sc = r.headers.getSetCookie?.() ?? [];
    const sess = sc.find((c) => c.startsWith("ibkama_session="));
    return { s: r.status, t, red: r.headers.get("x-action-redirect"), cookie: sess ? sess.split(";")[0] : null, flags: sess ?? "" };
  };
  const get = async (path, cookie) => { const r = await fetch(`${BASE}${path}`, { headers: cookie ? { cookie } : {}, redirect: "manual" }); return { s: r.status, loc: r.headers.get("location") ?? "" }; };
  // 1. login benar
  let r = await login("uji-e-admin@uji.invalid", pw, "10.5.0.1");
  ok(!!r.cookie && (r.red ?? "").startsWith("/admin"), "login benar → cookie sesi + redirect /admin");
  ok(/HttpOnly/i.test(r.flags) && /SameSite=lax/i.test(r.flags) && /Expires=|Max-Age=/i.test(r.flags), "cookie HttpOnly + SameSite=Lax + kedaluwarsa", r.flags.replace(/ibkama_session=[^;]+/, "ibkama_session=<disembunyikan>"));
  console.log(`   [info] flag Secure: ${/;\s*Secure/i.test(r.flags) ? "ada" : "tidak ada (NODE_ENV=production? " + process.env.NODE_ENV + ")"}`);
  const ck1 = r.cookie;
  ok((await get("/admin", ck1)).s === 200, "cookie sah → /admin 200");
  // 2. pesan generik
  const msgs = new Set();
  for (const [e, p, ip] of [["uji-e-admin@uji.invalid", "salah-1", "10.5.1.1"], ["tidak-ada@uji.invalid", "salah-2", "10.5.1.2"], ["uji-e-old@uji.invalid", pw, "10.5.1.3"]]) {
    const x = await login(e, p, ip); msgs.add((x.t.match(/"error":"([^"]+)"/) ?? [])[1] ?? "?");
  }
  ok(msgs.size === 1, "pesan gagal identik (email salah/password salah/periode berakhir)", [...msgs][0]?.slice(0, 40));
  // 3. kunci percobaan
  for (let i = 0; i < 5; i++) await login("uji-e-admin2@uji.invalid", "salah", "10.5.2.1");
  r = await login("uji-e-admin2@uji.invalid", pw, "10.5.2.1");
  ok(/Terlalu banyak percobaan/.test(r.t) && !r.cookie, "setelah 5 gagal: terkunci walau password benar");
  r = await login("uji-e-admin2@uji.invalid", pw, "10.5.2.99");
  ok(!!r.cookie || !/Terlalu banyak/.test(r.t), "IP lain untuk email sama tidak ikut terkunci (kunci per pasangan)", "lanjut");
  ok(Number(await one("select count(*) from auth_attempts where key like 'login-pair:%'")) >= 1, "kunci tersimpan di DB (bertahan setelah restart)");
  // 4. pembatalan sesi: logout
  r = await login("uji-e-admin@uji.invalid", pw, "10.5.3.1"); const ckA = r.cookie;
  r = await login("uji-e-admin@uji.invalid", pw, "10.5.3.2"); const ckB = r.cookie;
  ok((await get("/admin", ckA)).s === 200 && (await get("/admin", ckB)).s === 200, "dua perangkat sama-sama masuk");
  { const body = await encodeReply([]); await fetch(`${BASE}/admin`, { method: "POST", body, headers: { cookie: ckA, "next-action": actId("logout"), accept: "text/x-component", origin: BASE }, redirect: "manual" }); }
  let g = await get("/admin", ckB); ok(g.s === 307 && /auth\/keluar\?alasan=sesi-berakhir/.test(g.loc), "setelah logout di A, token perangkat B ikut ditolak", `${g.s} ${g.loc}`);
  g = await get("/admin", ck1); ok(g.s === 307, "token lama (login pertama) juga ditolak", `${g.s}`);
  // 5. ganti password sendiri
  r = await login("uji-e-admin@uji.invalid", pw, "10.5.4.1"); const ckC = r.cookie;
  r = await login("uji-e-admin@uji.invalid", pw, "10.5.4.2"); const ckD = r.cookie;
  { const f = new FormData(); f.append("currentPassword", pw); f.append("newPassword", pw + "-baru"); f.append("confirmPassword", pw + "-baru");
    const rr = await fetch(`${BASE}/admin/akun`, { method: "POST", body: await encodeReply([undefined, f]), headers: { cookie: ckC, "next-action": actId("changeOwnPassword"), accept: "text/x-component", origin: BASE }, redirect: "manual" });
    var newCk = (rr.headers.getSetCookie?.() ?? []).find((c) => c.startsWith("ibkama_session="))?.split(";")[0];
    ok(/berhasil diganti/.test(await rr.text()), "ganti password berhasil"); }
  ok(!!newCk && (await get("/admin", newCk)).s === 200, "perangkat yang mengganti tetap masuk (token baru)");
  g = await get("/admin", ckD); ok(g.s === 307, "perangkat lain dikeluarkan setelah ganti password", `${g.s}`);
  r = await login("uji-e-admin@uji.invalid", pw, "10.5.4.3"); ok(!r.cookie, "password lama tidak berlaku");
  // 6. token rusak
  const parts = ck1.replace("ibkama_session=", "").split(".");
  const forged = `ibkama_session=${parts[0]}.${Buffer.from(JSON.stringify({ userId: "uji-e-super", expiresAt: Date.now() + 1e8, v: 0 })).toString("base64url")}.${parts[2]}`;
  g = await get("/admin", forged); ok(g.s === 307 && /\/login/.test(g.loc), "payload dipalsukan (tanda tangan lama) ditolak", `${g.s}`);
  const none = `ibkama_session=${Buffer.from('{"alg":"none"}').toString("base64url")}.${Buffer.from(JSON.stringify({ userId: "uji-e-super", expiresAt: Date.now() + 1e8 })).toString("base64url")}.`;
  g = await get("/admin", none); ok(g.s === 307, "token alg=none ditolak", `${g.s}`);
  const expired = await new SignJWT({ userId: "uji-e-super", expiresAt: Date.now() - 1000, v: 0 }).setProtectedHeader({ alg: "HS256" }).setExpirationTime(new Date(Date.now() - 1000)).sign(new TextEncoder().encode(secret));
  g = await get("/admin", `ibkama_session=${expired}`); ok(g.s === 307, "token kedaluwarsa ditolak", `${g.s}`);
  const wrongKey = await new SignJWT({ userId: "uji-e-super", expiresAt: Date.now() + 1e6, v: 0 }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1h").sign(new TextEncoder().encode("x".repeat(40)));
  g = await get("/admin", `ibkama_session=${wrongKey}`); ok(g.s === 307, "token dengan kunci salah ditolak", `${g.s}`);
  // 7. akun dinonaktifkan / dicopot
  await db.execute("update users set is_active=0 where id='uji-e-admin2'");
  g = await get("/admin", await ck("uji-e-admin2")); ok(g.s === 307, "akun dinonaktifkan: token sah-kripto langsung ditolak", `${g.s}`);
  ok(await alive(), "server responsif");
}

if (group === "csv") {
  console.log("== Ekspor CSV: formula injection & kutipan");
  const bad = [["=1+1", "90000001"], ["+SUM(A1:A2)", "90000002"], ["-2+3", "90000003"], ["@cmd", "90000004"], ["\tTab", "90000005"], ["  =spasi", "90000006"], ['Koma, "kutip"; titik', "90000007"], ["Baris\r\n=2+2", "90000008"]];
  for (const [nm, nim] of bad)
    await db.execute({ sql: "insert into program_attendances (id,program_id,period_id,name,identifier,study_program,device_info) values (?,?,?,?,?,?,?)",
      args: [`uji-csv-${nim}`, "uji-e-prog", await one("select id from periods where status='active'"), nm, nim, "=HYPERLINK(\"http://x\")", "=cmd|' /C calc'!A0"] });
  const r = await rq("/admin/presensi/uji-e-prog/export", { as: "uji-e-admin" });
  ok(r.s === 200, "ekspor 200", `${r.s}`);
  const full = await (await fetch(`${BASE}/admin/presensi/uji-e-prog/export`, { headers: { cookie: await ck("uji-e-admin") } })).text();
  // parser CSV sederhana (kutip ganda, koma)
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < full.length; i++) { const c = full[i];
    if (q) { if (c === '"') { if (full[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\r" && full[i + 1] === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; i++; }
    else cell += c; }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const data = rows.slice(1).filter((x) => x.length > 1);
  const dangerous = data.flatMap((x) => x).filter((c) => /^\s*[=+\-@\t\r]/.test(c) && !c.startsWith("'") && !/^\s*'/.test(c) && !/^https?:\/\//.test(c));
  ok(data.length >= 8, "semua baris terbaca utuh (baris baru dalam sel tidak memecah baris)", `${data.length} baris`);
  ok(dangerous.length === 0, "tidak ada sel berawalan = + - @ TAB CR tanpa awalan '", dangerous.slice(0, 2).join(" | "));
  ok(data.some((x) => x[0] === "'=1+1") && data.some((x) => x[7] === "'=cmd|' /C calc'!A0") && data.some((x) => x[0].includes('Koma, "kutip"; titik')), "payload dinetralkan; teks biasa tetap utuh");
  ok(r.h.get("content-disposition")?.startsWith("attachment"), "Content-Disposition: attachment");
}

if (group === "headers") {
  console.log("== Header keamanan (build produksi)");
  for (const p of ["/", "/login", "/hadir/ujikodeE000000000000AA", "/admin", "/media/uji-e-m-pub"]) {
    const r = await rq(p, { as: p === "/admin" ? "uji-e-admin" : undefined });
    const h = (n) => r.h.get(n);
    const okAll = /default-src 'self'/.test(h("content-security-policy") ?? "") && !h("content-security-policy-report-only") && h("x-frame-options") === "DENY"
      && h("x-content-type-options") === "nosniff" && !!h("referrer-policy") && /camera=\(self\)/.test(h("permissions-policy") ?? "") && !h("x-powered-by");
    ok(okAll, `header lengkap pada ${p}`, `CSP:${h("content-security-policy") ? "enforce" : "—"} XFO:${h("x-frame-options")} powered:${h("x-powered-by") ?? "tidak ada"}`);
  }
  const r2 = await rq("/"); ok(!r2.h.get("strict-transport-security"), "HSTS belum dikirim aplikasi (dipasang di reverse proxy setelah HTTPS stabil)");
}

if (group === "misc") {
  console.log("== Pesan galat DB, batas password, input panjang");
  const active = await one("select id from periods where status='active'");
  await db.execute({ sql: "insert into divisions (id,period_id,name) values ('uji-div',?,'Divisi Uji')", args: [active] });
  await db.execute({ sql: "insert into programs (id,period_id,division_id,name,status,is_public) values ('uji-prog-div',?,'uji-div','Prog Uji','planned',0)", args: [active] });
  let r = await act("deleteResource", ["divisi", "uji-div"], { as: "uji-e-admin" });
  ok(await one("select count(*) from divisions where id='uji-div'") == 1, "hapus divisi yang masih dipakai program → ditolak (data tetap)");
  ok(/masih dipakai oleh data lain/.test(r.t) && !/SQLITE|Failed query|params|FOREIGN KEY constraint/i.test(r.t), "pesan FK ramah, tanpa SQL/parameter", r.t.replace(/\s+/g, " ").slice(0, 100));
  // email ganda (UNIQUE) oleh Super Admin
  const f = new FormData(); for (const [k, v] of Object.entries({ name: "Ganda", email: "uji-e-admin@uji.invalid", role: "admin", password: "Passw0rd!xx" })) f.append(k, v);
  r = await act("createUser", [undefined, f], { as: "uji-e-super" });
  ok(!/SQLITE|Failed query|params:|insert into/i.test(r.t) && /sudah terdaftar/.test(r.t), "email ganda: pesan ramah, tanpa SQL", r.t.replace(/\s+/g, " ").slice(0, 110));
  // password terlalu panjang
  const f2 = new FormData(); for (const [k, v] of Object.entries({ name: "Panjang", email: "panjang-uji@uji.invalid", role: "admin", password: "a".repeat(80) })) f2.append(k, v);
  const n0 = Number(await one("select count(*) from users"));
  r = await act("createUser", [undefined, f2], { as: "uji-e-super" });
  ok(Number(await one("select count(*) from users")) === n0 && /terlalu panjang/.test(r.t), "createUser password 80 karakter ditolak", r.t.replace(/\s+/g, " ").slice(0, 90));
  const f3 = new FormData(); for (const [k, v] of Object.entries({ currentPassword: "x", newPassword: "b".repeat(80), confirmPassword: "b".repeat(80) })) f3.append(k, v);
  r = await act("changeOwnPassword", [undefined, f3], { as: "uji-e-admin" });
  ok(/terlalu panjang/.test(r.t), "changeOwnPassword 80 karakter ditolak", r.t.replace(/\s+/g, " ").slice(0, 90));
  const f4 = new FormData(); for (const [k, v] of Object.entries({ name: "Uji Admin", role: "admin", isActive: "on", newPassword: "c".repeat(80) })) f4.append(k, v);
  r = await act("updateUser", ["uji-e-admin2", undefined, f4], { as: "uji-e-super" });
  ok(/terlalu panjang/.test(r.t), "updateUser newPassword 80 karakter ditolak", r.t.replace(/\s+/g, " ").slice(0, 90));
  // login dengan password 2000 karakter
  const lf = new FormData(); lf.append("email", "uji-e-admin@uji.invalid"); lf.append("password", "p".repeat(2000));
  const t0 = Date.now(); r = await act("login", [undefined, lf], { path: "/login", headers: { "x-forwarded-for": "10.6.6.6" } });
  ok(/terlalu panjang/.test(r.t) && Date.now() - t0 < 1500, "login password 2000 karakter ditolak cepat sebelum bcrypt", `${Date.now() - t0}ms`);
  ok(await alive(), "server responsif");
}

console.log(`RINGKASAN grup ${group}: ${pass} lulus, ${fail} gagal`);
process.exit(fail ? 1 : 0);
