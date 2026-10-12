// SEMENTARA — klien CDP minimal untuk uji CSP/hidrasi di Chrome headless sungguhan.
import { spawn } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
const S = process.env.AUDIT_DIR, BASE = process.env.BASE ?? "http://localhost:3300", PORT = 9333;
if (!S) { console.error("Set AUDIT_DIR (direktori kerja run.sh)."); process.exit(2); }
mkdirSync(`${S}/chrome-profile`, { recursive: true });
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${S}/chrome-profile`, "--no-first-run", "--disable-gpu",
  "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--window-size=1280,900", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let list; for (let i = 0; i < 40; i++) { try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (list.length) break; } catch {} await sleep(250); }
const target = list.find((t) => t.type === "page");
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); const events = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } else if (d.method) events.push(d); };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); return r.result?.result?.value ?? r.result?.exceptionDetails?.text; };
for (const d of ["Runtime", "Page", "Log", "DOM", "Network"]) await send(`${d}.enable`);
await send("Page.addScriptToEvaluateOnNewDocument", { source: `window.__vio=[]; document.addEventListener('securitypolicyviolation',e=>window.__vio.push(e.violatedDirective+' '+e.blockedURI));` });
const go = async (path, wait = 3000) => { events.length = 0; await send("Page.navigate", { url: BASE + path }); await sleep(wait); };
const report = async (label) => {
  const r = await ev(`(()=>{const k=[...document.querySelectorAll('a,button,input,form')].find(e=>Object.keys(e).some(x=>x.startsWith('__reactProps')));
    return JSON.stringify({h1:document.querySelector('h1')?.textContent?.slice(0,40),hydrated:!!k,skeleton:!!document.querySelector('[aria-label="Memuat halaman"]'),
    imgs:document.images.length,imgsBroken:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).length,vio:window.__vio})})()`);
  const errs = events.filter((e) => (e.method === "Runtime.exceptionThrown") || (e.method === "Log.entryAdded" && ["error"].includes(e.params.entry.level)) || (e.method === "Runtime.consoleAPICalled" && e.params.type === "error"))
    .map((e) => (e.params.entry?.text || e.params.exceptionDetails?.text || e.params.args?.[0]?.value || "").toString().slice(0, 140));
  console.log(`${label.padEnd(28)} ${r} errors=${JSON.stringify(errs)}`);
};
const mode = process.argv[2];
if (mode === "galat") {
  const tok = readFileSync(`${S}/token.txt`, "utf8").trim();
  await send("Network.setCookie", { name: "ibkama_session", value: tok, url: BASE });
  await go("/admin/integrasi", 4000);
  console.log(await ev(`JSON.stringify({teks:document.body.innerText.replace(/\\s+/g,' ').slice(0,260),adaTombolCobaLagi:!!([...document.querySelectorAll('button')].find(b=>/Coba lagi/i.test(b.textContent))),bocorSQL:/SQLITE|no such table|integrations/i.test(document.body.innerText)})`));
}
if (mode === "admin") {
  const tok = readFileSync(`${S}/token.txt`, "utf8").trim();
  await send("Network.setCookie", { name: "ibkama_session", value: tok, url: BASE });
  for (const p of ["/admin", "/admin/anggota/new", "/admin/program", "/admin/berita/new", "/admin/presensi", "/admin/presensi/uji-e-prog", "/admin/pengguna", "/admin/media-situs", "/admin/integrasi", "/admin/akun"]) { await go(p, 3500); await report(p); }
}
if (mode === "pages") {
  for (const p of ["/", "/profil", "/kepengurusan", "/program", "/berita", "/kontak", "/login", "/hadir/ujikodeE000000000000AA"]) { await go(p, 3500); await report(p); }
}
if (mode === "kamera") {
  await go("/hadir/ujikodeE000000000000AA", 3000);
  await send("Browser.grantPermissions", { permissions: ["videoCapture"], origin: BASE }).catch((e) => console.log("grant gagal", e));
  const probe = await ev(`(async()=>{try{const s=await navigator.mediaDevices.getUserMedia({video:true});const t=s.getVideoTracks()[0];const out={ok:true,label:t.label,settings:t.getSettings()};s.getTracks().forEach(x=>x.stop());return JSON.stringify(out)}catch(e){return JSON.stringify({ok:false,name:e.name,msg:e.message})}})()`);
  console.log("getUserMedia langsung:", probe);
  await ev(`[...document.querySelectorAll('button')].find(b=>/Buka kamera/.test(b.textContent)).click()`); await sleep(3000);
  console.log("UI:", await ev(`JSON.stringify({video:!!document.querySelector('video'),vw:document.querySelector('video')?.videoWidth,ready:document.querySelector('video')?.readyState,pesan:document.body.innerText.match(/Kamera[^\n]{0,80}/)?.[0],vio:window.__vio})`));
}
if (mode === "hadir") {
  await go("/hadir/ujikodeE000000000000AA", 3500); await report("hadir (sebelum isi)");
  const typeInto = async (sel, text) => { await ev(`document.querySelector('${sel}').focus()`); await send("Input.insertText", { text }); };
  await typeInto("input[name=name]", "Uji CSP Chrome"); await typeInto("input[name=identifier]", "2026 5555");
  // tanda tangan dengan mouse sungguhan
  await ev(`document.querySelector('canvas').scrollIntoView({block:'center'})`); await sleep(200);
  const b2 = JSON.parse(await ev(`(()=>{const r=document.querySelector('canvas').getBoundingClientRect();return JSON.stringify({x:r.left,y:r.top,w:r.width,h:r.height})})()`));
  const mouse = (type, x, y) => send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons: 1, clickCount: 1, pointerType: "mouse" });
  await mouse("mousePressed", b2.x + 20, b2.y + 40);
  for (let i = 1; i < 25; i++) await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: b2.x + 20 + i * 8, y: b2.y + 40 + Math.sin(i / 3) * 30, button: "left", buttons: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: b2.x + 220, y: b2.y + 60, button: "left", clickCount: 1 });
  await sleep(300);
  // foto: kamera palsu Chrome (getUserMedia) → klik "Buka kamera", lalu ambil foto
  await ev(`[...document.querySelectorAll('button')].find(b=>/Buka kamera/.test(b.textContent)).click()`);
  let live = false; for (let i = 0; i < 20 && !live; i++) { await sleep(400); live = await ev(`!!document.querySelector('video') && document.querySelector('video').videoWidth>0`); }
  await ev(`document.querySelector('button[aria-label="Ambil foto"]')?.click()`); await sleep(1000);
  const st = JSON.parse(await ev(`JSON.stringify({sig:document.querySelector('input[name=signature]').value.slice(0,22),sigLen:document.querySelector('input[name=signature]').value.length,photo:document.querySelector('input[name=photo]').value.slice(0,23),photoLen:document.querySelector('input[name=photo]').value.length,vio:window.__vio})`));
  console.log("kamera live:", live, "| bukti:", JSON.stringify(st));
  await ev(`[...document.querySelectorAll('button')].find(b=>/Konfirmasi Kehadiran/.test(b.textContent)).click()`); await sleep(3500);
  await report("hadir (setelah kirim)");
  console.log("URL akhir:", await ev("location.pathname+location.search"));
}
await send("Browser.close").catch(() => {}); chrome.kill(); process.exit(0);
