import {
  db,
  profilesTable,
  predictionsTable,
  plansTable,
  usersTable,
} from "@workspace/db";
import { and, eq, desc, sql } from "drizzle-orm";
import type { Request } from "express";
import { profileScope } from "./profiles";
import { learningState } from "./learning-journey";
import type { CourseView } from "./catalog";
import outcomes from "../../../../synthetic-data/tvet/graduate-employment-2024-2026.json";
export const graduateOutcomes = outcomes;
export function graduateYears() {
  return [2024, 2025, 2026].map((year) => {
    const rows = outcomes.rows.filter((r) => r.year === year);
    const graduates = rows.reduce((n, r) => n + r.graduates, 0),
      employed = rows.reduce((n, r) => n + r.employedWithinSixMonths, 0);
    return { year, graduates, employed, rate: (100 * employed) / graduates };
  });
}
export function graduateScenario(years: number) {
  return Math.min(
    100,
    graduateYears().at(-1)!.rate + 2 * Math.min(10, Math.max(0, years)),
  );
}
function policyScope(req: Request) {
  return and(
    eq(predictionsTable.question, "TVET compulsory courses"),
    eq(predictionsTable.lang, "settings"),
    sql`${predictionsTable.ownerUserId} IN (SELECT id FROM users WHERE role='tvet' AND organization=${req.user!.organization})`,
  );
}
export async function compulsoryIds(req: Request): Promise<number[]> {
  if (req.user?.role !== "tvet") return [];
  const [row] = await db
    .select({ content: predictionsTable.content })
    .from(predictionsTable)
    .where(policyScope(req))
    .orderBy(desc(predictionsTable.id))
    .limit(1);
  if (!row) return [];
  const data = JSON.parse(row.content);
  return Array.isArray(data.courseIds) ? data.courseIds : [];
}
/** Append newly required learning without erasing progress or moving existing deadlines. Completed awards remain unchanged. */
export async function saveCompulsory(req: Request, required: CourseView[]) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${"tvet-policy:" + req.user!.organization},0))`,
    );
    await tx
      .insert(predictionsTable)
      .values({
        ownerUserId: req.user!.id,
        question: "TVET compulsory courses",
        horizonYears: 0,
        lang: "settings",
        inputHash: "institution-policy",
        content: JSON.stringify({ courseIds: required.map((c) => c.id) }),
        sources: [],
        model: "deterministic-institution-setting",
      });
    const profiles = await tx
      .select()
      .from(profilesTable)
      .where(profileScope(req));
    let updated = 0;
    for (const p of profiles) {
      const state = await learningState(p.id, tx);
      if (state.finishedAt) continue;
      const [plan] = await tx
        .select()
        .from(plansTable)
        .where(
          and(
            eq(plansTable.profileId, p.id),
            state.stage === "active" && state.planId
              ? eq(plansTable.id, state.planId)
              : undefined,
          ),
        )
        .orderBy(desc(plansTable.id))
        .limit(1);
      if (!plan) continue;
      const selected = new Set(required.map((c) => c.id));
      const items = plan.items.map((i) => ({
        ...i,
        compulsory: selected.has(i.courseId),
      }));
      let next = Math.max(
        1,
        ...items.map(
          (i) =>
            (i.startWeek ?? 1) +
            (i.durationWeeks ?? state.durationWeeks?.[String(i.courseId)] ?? 1),
        ),
      );
      for (const c of required.filter(
        (c) => !items.some((i) => i.courseId === c.id),
      )) {
        const weeks = Math.max(
          1,
          Math.ceil(c.durationHours! / Math.max(1, p.weeklyHours)),
        );
        items.push({
          courseId: c.id,
          title: c.title,
          provider: c.provider,
          url: c.url,
          startWeek: next,
          durationWeeks: weeks,
          costMyr: c.costMyr,
          hrdcStatus: "not_claimable",
          skills: c.skills.map((s) => s.name),
          sdgCodes: c.sdgCodes,
          compulsory: true,
        });
        next += weeks;
      }
      await tx
        .update(plansTable)
        .set({
          items,
          totalCostMyr: items.reduce((n, c) => n + c.costMyr, 0),
          totalWeeks: Math.max(
            0,
            ...items.map(
              (c) => (c.startWeek ?? 1) + (c.durationWeeks ?? 1) - 1,
            ),
          ),
        })
        .where(eq(plansTable.id, plan.id));
      updated++;
    }
    return { courseIds: required.map((c) => c.id), updated };
  });
}
