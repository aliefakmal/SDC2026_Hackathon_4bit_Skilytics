import app from "./app";
import { logger } from "./lib/logger";
import { seedCatalog } from "./lib/seed";
import { startMarketScheduler, checkCourseLinks } from "./lib/market";
import { seedDemoAccounts, purgeStaleGuestData } from "./lib/auth";
import { seedDemoMembers } from "./lib/demo";
import { existsSync } from "node:fs";

for (const envFile of [".env", "../../.env", "../../../src/.env"]) {
  if (existsSync(envFile) && typeof process.loadEnvFile === "function") {
    try {
      process.loadEnvFile(envFile);
      break;
    } catch {}
  }
}

const rawPort = process.env["PORT"] || "5000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  seedCatalog()
    .then(() => checkCourseLinks())
    .then(() => seedDemoAccounts())
    .then(() => seedDemoMembers())
    .then(() => purgeStaleGuestData())
    .then(() => {
      startMarketScheduler();
      setInterval(() => purgeStaleGuestData().catch((err) => logger.error({ err }, "Guest purge failed")), 24 * 3600 * 1000).unref();
    })
    .catch((err) => logger.error({ err }, "Startup seeding failed"));
});
