import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import app from "../app";
import { db, pool, profilesTable, plansTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { saveLearningState } from "./learning-journey";

let server: Server, base: string;
const tokens = [
  randomUUID().replaceAll("-", ""),
  randomUUID().replaceAll("-", ""),
];
before(async () => {
  server = app.listen(0);
  await new Promise<void>((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
});
after(async () => {
  for (const token of tokens)
    await db.delete(profilesTable).where(eq(profilesTable.guestToken, token));
  await new Promise<void>((r) => server.close(() => r()));
  await pool.end();
});
const read = (path: string, token = tokens[0]) =>
  fetch(base + path, { headers: { "x-guest-token": token } });
const create = async (token = tokens[0], key = randomUUID()) => {
  const res = await fetch(base + "/profiles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-guest-token": token,
      "x-idempotency-key": key,
    },
    body: JSON.stringify({
      name: "Workspace test",
      segment: "worker",
      weeklyHours: 3,
      budgetMyr: 0,
    }),
  });
  assert.ok(res.ok);
  return (await res.json()) as { id: number };
};
test("new guest intake replaces the old one, concurrent retries stay idempotent and other devices stay isolated", async () => {
  const old = await create(),
    other = await create(tokens[1]),
    key = randomUUID();
  const [a, b] = await Promise.all([
    create(tokens[0], key),
    create(tokens[0], key),
  ]);
  assert.equal(a.id, b.id);
  assert.notEqual(a.id, old.id);
  assert.equal((await read(`/profiles/${old.id}`)).status, 404);
  assert.equal(
    (await db.select().from(profilesTable).where(eq(profilesTable.id, old.id)))
      .length,
    0,
  );
  assert.equal((await read(`/profiles/${other.id}`, tokens[1])).status, 200);
  assert.equal(
    ((await read("/profiles").then((r) => r.json())) as unknown[]).length,
    1,
  );
});
test("legacy guest lists keep only the newest intake and cascade obsolete learning records", async () => {
  const [old] = await db
    .insert(profilesTable)
    .values({
      guestToken: tokens[0],
      name: "Legacy old",
      segment: "worker",
      weeklyHours: 3,
      budgetMyr: 0,
    })
    .returning();
  const [latest] = await db
    .insert(profilesTable)
    .values({
      guestToken: tokens[0],
      name: "Legacy latest",
      segment: "worker",
      weeklyHours: 3,
      budgetMyr: 0,
    })
    .returning();
  await saveLearningState(old.id, { stage: "intake", completed: {} });
  const rows = (await read("/profiles").then((r) => r.json())) as {
    id: number;
  }[];
  assert.deepEqual(
    rows.map((r: { id: number }) => r.id),
    [latest.id],
  );
  assert.equal(
    (await db.select().from(profilesTable).where(eq(profilesTable.id, old.id)))
      .length,
    0,
  );
});
test("certificate metadata requires completion and ownership and preserves long multilingual names", async () => {
  const p = await create();
  assert.equal(
    (await read(`/profiles/${p.id}/journey/certificate`)).status,
    409,
  );
  const name = "Nurul Aina binti Abdullah — 陈美玲 学习成果";
  await db
    .update(profilesTable)
    .set({ name })
    .where(eq(profilesTable.id, p.id));
  const [plan] = await db
    .insert(plansTable)
    .values({
      profileId: p.id,
      roleId: 1,
      roleTitle: "Data Analyst",
      totalWeeks: 1,
      totalCostMyr: 0,
      uncoveredSkills: [],
      items: [
        {
          courseId: -999,
          title: "Test course",
          provider: "Test",
          url: "https://example.com/course",
          startWeek: 1,
          durationWeeks: 1,
          costMyr: 0,
          hrdcStatus: "not_claimable",
          skills: [],
          sdgCodes: [],
        },
      ],
    })
    .returning();
  await saveLearningState(p.id, {
    stage: "active",
    planId: plan.id,
    finishedAt: new Date().toISOString(),
    completed: { "-999": new Date().toISOString() },
  });
  const result = await read(`/profiles/${p.id}/journey/certificate`);
  assert.equal(result.status, 200);
  assert.match(result.headers.get("content-type")!, /application\/json/);
  const certificate = (await result.json()) as {
    name: string;
    courseCount: number;
    roleTitleZh: string;
  };
  assert.equal(certificate.name, name);
  assert.equal(certificate.courseCount, 1);
  assert.equal(certificate.roleTitleZh, "数据分析师");
  assert.equal(
    (await read(`/profiles/${p.id}/journey/certificate`, tokens[1])).status,
    404,
  );
});
