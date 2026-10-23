import { db, profilesTable } from "@workspace/db";
import { and, desc, eq, isNull, ne, sql } from "drizzle-orm";

export const guestProfileScope = (token: string) =>
  and(isNull(profilesTable.ownerUserId), eq(profilesTable.guestToken, token))!;
export const latestGuestProfileId = (token: string) =>
  sql`(SELECT p.id FROM profiles p WHERE p.owner_user_id IS NULL AND p.guest_token=${token} ORDER BY p.id DESC LIMIT 1)`;

/** Migrate this device's legacy guest list on access, keeping its newest intake. */
export async function keepOneGuestProfile(token: string) {
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${token},0))`,
    );
    const [latest] = await tx
      .select({ id: profilesTable.id })
      .from(profilesTable)
      .where(guestProfileScope(token))
      .orderBy(desc(profilesTable.id))
      .limit(1);
    if (latest)
      await tx
        .delete(profilesTable)
        .where(and(guestProfileScope(token), ne(profilesTable.id, latest.id)));
  });
}
