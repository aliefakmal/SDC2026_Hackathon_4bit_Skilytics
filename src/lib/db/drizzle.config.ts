import { defineConfig } from "drizzle-kit";
import path from "path";
import fs from "fs";

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
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
  },
});
