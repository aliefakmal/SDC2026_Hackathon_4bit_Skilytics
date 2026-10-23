import { readFileSync } from "node:fs";
import { pool } from "@workspace/db";
const migration = readFileSync(
  new URL(
    "../../../../lib/db/migrations/20261023_learning_journeys.sql",
    import.meta.url,
  ),
  "utf8",
);
try {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Exercise the identical additive table definition in a transaction-local table.
    await client.query(
      "CREATE TEMP TABLE learning_profile_migration_test (id integer PRIMARY KEY)",
    );
    await client.query(
      migration
        .replace(
          "CREATE TABLE IF NOT EXISTS learning_journeys",
          "CREATE TEMP TABLE learning_journey_migration_test",
        )
        .replace(
          "REFERENCES profiles(id)",
          "REFERENCES learning_profile_migration_test(id)",
        ),
    );
    await client.query(
      "INSERT INTO learning_profile_migration_test VALUES (1)",
    );
    await client.query(
      'INSERT INTO learning_journey_migration_test(profile_id,state) VALUES (1, \'{"stage":"intake","completed":{}}\')',
    );
    await client.query(
      "DELETE FROM learning_profile_migration_test WHERE id=1",
    );
    if (
      (await client.query("SELECT * FROM learning_journey_migration_test"))
        .rowCount
    )
      throw new Error("Cascade constraint test failed");
    await client.query("ROLLBACK");
    if (process.argv.includes("--apply")) await client.query(migration);
    console.log(
      process.argv.includes("--apply")
        ? "Learning journey migration applied"
        : "Learning journey migration verified and rolled back",
    );
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
