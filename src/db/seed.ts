import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "./index";
import {
  archiveCategorySeed,
  defaultDivisions,
  highlightSeed,
  integrationSeed,
  organizationSeed,
  positionSeed,
} from "./seed-data";

async function main() {
  // Profil organisasi (tidak menimpa jika sudah pernah diedit)
  const org = await db.select().from(schema.organization).limit(1);
  if (org.length === 0) await db.insert(schema.organization).values(organizationSeed);

  for (const c of archiveCategorySeed)
    await db.insert(schema.archiveCategories).values(c).onConflictDoNothing();
  for (const p of positionSeed)
    await db.insert(schema.positions).values(p).onConflictDoNothing();
  for (const i of integrationSeed)
    await db.insert(schema.integrations).values(i).onConflictDoNothing();
  if ((await db.select({ id: schema.highlights.id }).from(schema.highlights).limit(1)).length === 0)
    await db.insert(schema.highlights).values(highlightSeed);

  // Periode yang belum punya divisi sama sekali diberi divisi bawaan (yang sudah diatur tidak disentuh).
  for (const p of await db.select().from(schema.periods)) {
    const has = await db.select({ id: schema.divisions.id }).from(schema.divisions).where(eq(schema.divisions.periodId, p.id)).limit(1);
    if (has.length === 0) await db.insert(schema.divisions).values(defaultDivisions.map((d) => ({ ...d, periodId: p.id })));
  }

  // Super Admin: kredensial dari environment, tidak pernah dari source code.
  const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD;
  const name = process.env.SUPERADMIN_NAME ?? "Akhsanu Cahya Putra";
  if (email && password) {
    const exists = await db.select().from(schema.users).where(eq(schema.users.email, email));
    if (exists.length === 0) {
      await db.insert(schema.users).values({
        name,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: "super_admin",
      });
      console.log(`Super Admin dibuat: ${email}`);
    } else console.log("Super Admin sudah ada, dilewati.");
  } else {
    console.log("SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD belum diset — akun Super Admin tidak dibuat.");
  }
  console.log("Seed selesai.");
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
