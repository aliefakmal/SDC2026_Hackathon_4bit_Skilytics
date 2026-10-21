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

let rawConnStr = process.env.DATABASE_URL.trim();
if (
  (rawConnStr.startsWith('"') && rawConnStr.endsWith('"')) ||
  (rawConnStr.startsWith("'") && rawConnStr.endsWith("'"))
) {
  rawConnStr = rawConnStr.slice(1, -1).trim();
}

// Strip channel_binding if present (not supported by node-postgres)
rawConnStr = rawConnStr.replace(/([?&])channel_binding=[^&]*(&|$)/g, "$1").replace(/[?&]$/, "");

const isNeon = rawConnStr.includes("neon.tech") || rawConnStr.includes("sslmode=");

export const pool = new Pool({
  connectionString: rawConnStr,
  ssl: isNeon ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
