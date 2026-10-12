import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
const E = process.argv[2];
const db = createClient({ url: `file:${E}/ibkama.db` });
const active = (await db.execute("select id from periods where status='active'")).rows[0].id;
const archived = (await db.execute("select id from periods where status='archived'")).rows[0].id;
const pw = "Uji-Audit-" + Math.random().toString(36).slice(2, 10);
const hash = await bcrypt.hash(pw, 10);
const U = [
  ["uji-e-super", "super_admin", active, 1], ["uji-e-admin", "admin", active, 1],
  ["uji-e-admin2", "admin", active, 1], ["uji-e-old", "admin", archived, 1],
];
for (const [id, role, period, act] of U)
  await db.execute({ sql: "insert into users (id,name,email,password_hash,role,is_active,period_id) values (?,?,?,?,?,?,?)",
    args: [id, id, `${id}@uji.invalid`, hash, role, act, period] });
// media fixtures (file nyata di salinan unggahan)
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const media = [
  ["uji-e-m-pub", "image", "public", "image/png", "attendance-none", null],
  ["uji-e-m-priv", "image", "private", "image/png", "attendance", "uji-e-prog"],
  ["uji-e-m-int", "document", "public", "text/plain", "documents", null],  // dokumen internal (visibility di tabel documents)
  ["uji-e-m-doc", "document", "public", "text/plain", "documents", null],
];
mkdirSync(`${E}/uploads/2026`, { recursive: true });
for (const [id, kind, vis, mime, ot, oid] of media) {
  const rel = `2026/${id}.${kind === "image" ? "png" : "txt"}`;
  writeFileSync(`${E}/uploads/${rel}`, kind === "image" ? png : Buffer.from("isi dokumen uji\n".repeat(50)));
  await db.execute({ sql: "insert into media (id,kind,path,original_name,mime,size,period_id,visibility,owner_type,owner_id) values (?,?,?,?,?,?,?,?,?,?)",
    args: [id, kind, rel, `${id}.bin`, mime, 800, active, vis, ot, oid] });
}
await db.execute({ sql: "insert into programs (id,period_id,name,status,is_public,attendance_code,attendance_open,attendance_require_signature,attendance_require_photo) values ('uji-e-prog',?,'UJI AUDIT E','planned',0,'ujikodeE000000000000AA',1,0,0)", args: [active] });
await db.execute({ sql: "insert into program_attendances (id,program_id,period_id,name,identifier,photo_media_id) values ('uji-e-att',?,?,'Peserta Uji E','20269999','uji-e-m-priv')", args: ["uji-e-prog", active] });
for (const [id, title, mediaId, vis] of [["uji-e-doc-int", "Dok internal uji", "uji-e-m-int", "internal"], ["uji-e-doc-pub", "Dok publik uji", "uji-e-m-doc", "public"]])
  await db.execute({ sql: "insert into documents (id,period_id,title,media_id,visibility) values (?,?,?,?,?)", args: [id, active, title, mediaId, vis] });
writeFileSync(`${E}/akun.json`, JSON.stringify({ pw, active, archived }));
console.log("fixture siap");
