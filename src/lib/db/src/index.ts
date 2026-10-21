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

const NEON_DEFAULT_URL =
  "postgresql://neondb_owner:npg_5UVvJISyL0Wu@ep-royal-shape-aol47eri-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

let connectionString = (process.env.DATABASE_URL || "").trim();
if (
  (connectionString.startsWith('"') && connectionString.endsWith('"')) ||
  (connectionString.startsWith("'") && connectionString.endsWith("'"))
) {
  connectionString = connectionString.slice(1, -1).trim();
}

// In Render / cloud environment, or when localhost is specified in cloud, fallback to Neon
const isCloudRuntime = Boolean(
  process.env.RENDER ||
    process.env.NODE_ENV === "production" ||
    process.env.PORT === "10000" ||
    connectionString.includes("localhost:5432/skilytics")
);

if (
  isCloudRuntime &&
  (connectionString.includes("localhost") || connectionString.includes("127.0.0.1"))
) {
  connectionString = NEON_DEFAULT_URL;
}

// Remove channel_binding parameter as node-postgres can fail on some Linux/OpenSSL runtimes
connectionString = connectionString
  .replace(/([?&])channel_binding=[^&]*(&|$)/g, "$1")
  .replace(/[?&]$/, "");

const isRemote =
  connectionString.includes("neon.tech") ||
  connectionString.includes("sslmode=require") ||
  process.env.NODE_ENV === "production";

export const activeConnectionString = connectionString;

export const pool = new Pool({
  connectionString,
  ssl: isRemote ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
