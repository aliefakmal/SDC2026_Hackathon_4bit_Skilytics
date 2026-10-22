// Run from the repository root: node src/scripts/backup-db.mjs
// The snapshot is kept in git-ignored scratch/backups and contains personal data.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync, gunzipSync } from "node:zlib";
import pg from "../lib/db/node_modules/pg/lib/index.js";

const env = readFileSync("src/.env", "utf8");
const connectionString = env.match(/^DATABASE_URL=(.*)$/m)?.[1]?.replace(/^["']|["']$/g, "");
if (!connectionString) throw new Error("DATABASE_URL missing from src/.env");
const client = new pg.Client({ connectionString });
await client.connect();
try {
  await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const tableNames = (await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows.map((r) => r.tablename);
  const columns = (await client.query("SELECT table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position")).rows;
  const tables = {};
  for (const table of tableNames) {
    if (!/^[a-z_]+$/.test(table)) throw new Error("Unexpected table name");
    tables[table] = (await client.query(`SELECT * FROM "${table}"`)).rows;
  }
  await client.query("COMMIT");
  const snapshot = { format: "skilytics-json-snapshot-v1", createdAt: new Date().toISOString(), columns, tables };
  const dir = join("scratch", "backups"); mkdirSync(dir, { recursive: true });
  const file = join(dir, `skilytics-${new Date().toISOString().replace(/[:.]/g, "-")}.json.gz`);
  const compressed = gzipSync(JSON.stringify(snapshot), { level: 9 });
  writeFileSync(file, compressed, { flag: "wx" });
  const checksum = createHash("sha256").update(compressed).digest("hex");
  const reread = JSON.parse(gunzipSync(readFileSync(file)).toString("utf8"));
  if (reread.tables.profiles?.length !== tables.profiles?.length || reread.format !== snapshot.format) throw new Error("Backup verification failed");
  const manifest = { file, checksumSha256: checksum, createdAt: snapshot.createdAt, tables: Object.fromEntries(tableNames.map((name) => [name, tables[name].length])) };
  writeFileSync(`${file}.manifest.json`, JSON.stringify(manifest, null, 2), { flag: "wx" });
  console.log(JSON.stringify(manifest));
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  await client.end();
}
