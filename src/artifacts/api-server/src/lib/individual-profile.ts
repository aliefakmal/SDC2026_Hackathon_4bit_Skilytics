import { db, profilesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

// Keep legacy rows intact; the account uses its active journey, then its latest completed intake.
export function primaryProfileId(userId: number) {
  return sql`(SELECT p.id FROM profiles p WHERE p.owner_user_id=${userId} ORDER BY CASE WHEN EXISTS (SELECT 1 FROM learning_journeys lj WHERE lj.profile_id=p.id AND lj.state->>'stage'='active') THEN 0 WHEN p.onboarding_step='complete' THEN 1 ELSE 2 END,p.id DESC LIMIT 1)`;
}
export async function individualProfile(
  userId: number,
  executor: Pick<typeof db, "select"> = db,
) {
  const [row] = await executor
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, primaryProfileId(userId)))
    .limit(1);
  return row;
}
