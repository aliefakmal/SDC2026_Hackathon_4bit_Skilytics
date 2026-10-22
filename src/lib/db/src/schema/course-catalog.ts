import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const courseCatalogSnapshotsTable = pgTable("course_catalog_snapshots", {
  provider: text("provider").primaryKey(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
  payload: jsonb("payload").$type<unknown>().notNull(),
});
