// Run from repository root after the profile-creation guard is deployed.
// Refuses to delete anything outside the exact backed-up 45,215 empty drafts.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import pg from "../lib/db/node_modules/pg/lib/index.js";

const directory = join("scratch", "backups");
const backup = readdirSync(directory).filter((name) => /^skilytics-.*\.json\.gz$/.test(name)).sort().at(-1);
if (!backup) throw new Error("A verified local backup is required");
const backupPath = join(directory, backup);
const bytes = readFileSync(backupPath);
const manifest = JSON.parse(readFileSync(`${backupPath}.manifest.json`, "utf8"));
if (createHash("sha256").update(bytes).digest("hex") !== manifest.checksumSha256) throw new Error("Backup checksum mismatch");
const snapshot = JSON.parse(gunzipSync(bytes).toString("utf8"));
if (snapshot.format !== "skilytics-json-snapshot-v1" || snapshot.tables.profiles.length !== 45297) throw new Error("Unexpected backup contents");
const url = readFileSync("src/.env", "utf8").match(/^DATABASE_URL=(.*)$/m)?.[1]?.replace(/^["']|["']$/g, "");
if (!url) throw new Error("DATABASE_URL missing");
const client = new pg.Client({ connectionString: url });
const predicate = `p.guest_token=$1 AND p.owner_user_id IS NULL AND p.name='Draft profile' AND p.onboarding_step='cv'
  AND p.cv_file_name IS NULL AND p.cv_text IS NULL AND p.cv_uploaded_at IS NULL AND p.cv_extraction_key IS NULL
  AND p.verified=false AND coalesce(jsonb_array_length(p.skills),0)=0 AND coalesce(jsonb_array_length(p.riasec_answers),0)=0
  AND p.riasec_scores IS NULL AND NOT EXISTS (SELECT 1 FROM plans x WHERE x.profile_id=p.id)
  AND NOT EXISTS (SELECT 1 FROM agent_insights x WHERE x.profile_id=p.id)`;
await client.connect();
try {
  await client.query("BEGIN");
  const group = await client.query("SELECT guest_token,count(*)::int n FROM profiles WHERE owner_user_id IS NULL GROUP BY guest_token ORDER BY n DESC LIMIT 1");
  const token = group.rows[0]?.guest_token;
  if (!token || group.rows[0].n !== 45217) throw new Error("Guest cohort changed; cleanup aborted");
  const candidates = (await client.query(`SELECT p.id FROM profiles p WHERE ${predicate} ORDER BY p.id FOR UPDATE OF p`, [token])).rows.map((r) => r.id);
  const backedUp = new Set(snapshot.tables.profiles.filter((p) => p.guest_token === token).map((p) => p.id));
  if (candidates.length !== 45215 || candidates.some((id) => !backedUp.has(id))) throw new Error("Deletion set differs from backup; cleanup aborted");
  const protectedRows = (await client.query("SELECT id FROM profiles WHERE guest_token=$1 AND cv_file_name IS NOT NULL AND cv_text IS NOT NULL ORDER BY id", [token])).rows;
  if (protectedRows.length !== 2 || protectedRows.some((r) => candidates.includes(r.id))) throw new Error("CV profile check failed");
  const result = await client.query(`DELETE FROM profiles p WHERE ${predicate} RETURNING p.id`, [token]);
  if (result.rowCount !== 45215) throw new Error("Deletion count changed; cleanup rolled back");
  const remaining = await client.query("SELECT count(*)::int n FROM profiles WHERE guest_token=$1", [token]);
  if (remaining.rows[0].n !== 2) throw new Error("Unexpected remaining profile count; cleanup rolled back");
  await client.query("COMMIT");
  const report = { deleted: result.rowCount, preservedCvProfiles: protectedRows.length, backup: backupPath, completedAt: new Date().toISOString() };
  writeFileSync(join(directory, "cleanup-report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} catch (error) { await client.query("ROLLBACK").catch(() => {}); throw error; }
finally { await client.end(); }
