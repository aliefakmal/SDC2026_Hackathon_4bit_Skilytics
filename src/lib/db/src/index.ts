import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

import fs from "node:fs";

if (!process.env.DATABASE_URL) {
  for (const envFile of [".env", "../../.env", "../../../src/.env"]) {
    if (fs.existsSync(envFile) && typeof process.loadEnvFile === "function") {
      try {
        process.loadEnvFile(envFile);
        break;
      } catch {}
    }
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";
