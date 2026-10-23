import { pgTable, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles";

export type LearningState = {
  stage: "intake" | "matcher" | "pathway" | "active";
  planId?: number;
  startDate?: string;
  durationWeeks?: Record<string, number>;
  completed: Record<string, string>;
  finishedAt?: string;
};
export const learningJourneysTable = pgTable("learning_journeys", {
  profileId: integer("profile_id")
    .primaryKey()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  state: jsonb("state").$type<LearningState>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
