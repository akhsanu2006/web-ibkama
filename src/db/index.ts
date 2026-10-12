import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "file:./storage/db/ibkama.db";

// Satu koneksi per proses (aman untuk hot reload dev).
const globalForDb = globalThis as unknown as {
  __ibkamaClient?: ReturnType<typeof createClient>;
};
const client =
  globalForDb.__ibkamaClient ??
  createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
if (process.env.NODE_ENV !== "production") globalForDb.__ibkamaClient = client;

// Pastikan relasi antar-tabel ditegakkan (SQLite mematikannya secara default).
void client.execute("PRAGMA foreign_keys = ON");

export const db = drizzle(client, { schema });
export { schema };
