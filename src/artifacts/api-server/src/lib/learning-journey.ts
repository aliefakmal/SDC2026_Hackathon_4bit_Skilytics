import {
  db,
  learningJourneysTable,
  type LearningState,
  type PlanItemStored,
} from "@workspace/db";
import { eq } from "drizzle-orm";

type StateDb = Pick<typeof db, "select" | "insert">;
export async function learningState(id: number, executor: StateDb = db): Promise<LearningState> {
  const [row] = await executor
    .select()
    .from(learningJourneysTable)
    .where(eq(learningJourneysTable.profileId, id));
  return row?.state ?? { stage: "intake", completed: {} };
}
export async function saveLearningState(id: number, state: LearningState, executor:StateDb = db) {
  await executor
    .insert(learningJourneysTable)
    .values({ profileId: id, state })
    .onConflictDoUpdate({
      target: learningJourneysTable.profileId,
      set: { state, updatedAt: new Date() },
    });
  return state;
}
export function datedCourses(
  items: PlanItemStored[],
  start: string,
  estimates: Record<string, number> = {},
) {
  let next = Math.max(
    1,
    ...items.map((i) => (i.startWeek ?? 1) + (i.durationWeeks ?? 0)),
  );
  const dateAt = (days: number) => {
    const d = new Date(`${start}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };
  return items.map((item) => {
    const weeks = item.durationWeeks ?? estimates[String(item.courseId)];
    const week = item.startWeek ?? next;
    if (weeks && item.startWeek == null) next += weeks;
    return {
      ...item,
      startDate: weeks ? dateAt((week - 1) * 7) : null,
      deadline: weeks ? dateAt((week - 1 + weeks) * 7 - 1) : null,
      estimated: item.durationWeeks == null,
    };
  });
}
export function allComplete(
  items: { courseId: number }[],
  completed: Record<string, string>,
) {
  return (
    items.length > 0 && items.every((i) => !!completed[String(i.courseId)])
  );
}
