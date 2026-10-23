import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import {
  db,
  pool,
  usersTable,
  profilesTable,
  insightsTable,
  plansTable,
  predictionsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import app from "../app";
import { issueToken } from "./auth";
import { fixedDemoAnswers } from "./demo";
import { scoreRiasec } from "./riasec-scoring";
import { hashInput } from "./agents";
import { loadSkills } from "./catalog";
import { saveLearningState } from "./learning-journey";
import { remainingGap } from "./company";
import { parseCompanyTranslation } from "../routes/enterprise";

let server: Server, base: string, pid: number, otherPid: number;
const owners: number[] = [];
let token: string, otherToken: string;
const answers = fixedDemoAnswers({
  R: 2,
  I: 4.2,
  A: 2.6,
  S: 3,
  E: 2.4,
  C: 4.6,
});
before(async () => {
  server = app.listen(0);
  await new Promise<void>((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
  for (let i = 0; i < 2; i++) {
    const [u] = await db
      .insert(usersTable)
      .values({
        email: `enterprise-${randomUUID()}@example.test`,
        name: "Enterprise test",
        role: "hr",
        organization: `QA company ${randomUUID()}`,
        passwordHash: "not-a-login-password",
      })
      .returning();
    owners.push(u.id);
    if (i === 0) token = issueToken(u.id);
    else otherToken = issueToken(u.id);
    const scored = scoreRiasec(answers);
    const [p] = await db
      .insert(profilesTable)
      .values({
        name: "Fictional QA employee",
        segment: "worker",
        currentRole: "Data Analyst",
        organization: u.organization,
        ownerUserId: u.id,
        weeklyHours: 4,
        budgetMyr: 0,
        skills: [],
        riasecAnswers: answers,
        riasecScores: scored.scores,
        riasecCode: scored.code,
        cvExtractionKey: "qa-cv",
        verified: true,
        onboardingStep: "complete",
      })
      .returning();
    if (i === 0) pid = p.id;
    else otherPid = p.id;
  }
});
after(async () => {
  for (const id of owners) {
    await db.delete(profilesTable).where(eq(profilesTable.ownerUserId, id));
    await db
      .delete(predictionsTable)
      .where(eq(predictionsTable.ownerUserId, id));
    await db.delete(usersTable).where(eq(usersTable.id, id));
  }
  await new Promise<void>((r) => server.close(() => r()));
  await pool.end();
});
function request(path: string, method = "GET", body?: unknown, auth = token) {
  return fetch(base + path, {
    method,
    headers: {
      Authorization: `Bearer ${auth}`,
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
test("fixed demo Holland answers are complete and reproducible; codes remain literal", () => {
  assert.equal(answers.length, 30);
  assert.deepEqual(
    fixedDemoAnswers({ R: 2, I: 4.2, A: 2.6, S: 3, E: 2.4, C: 4.6 }),
    answers,
  );
  assert.equal(scoreRiasec(answers).code, "CIS");
  assert.throws(() =>
    parseCompanyTranslation('{"en":"missing other translations"}'),
  );
  assert.deepEqual(remainingGap(["SQL", "Python"], ["SQL"]), ["Python"]);
});
test("company overview, employee summaries and paths stay within the employer tenant", async () => {
  assert.equal(
    (await request(`/enterprise/employees/${otherPid}/summary`, "POST", {}))
      .status,
    404,
  );
  const r = await request("/enterprise/overview");
  assert.equal(r.status, 200);
  const c = (await r.json()) as {
    members: { id: number }[];
    profileCount: number;
  };
  assert.deepEqual(
    c.members.map((m: { id: number }) => m.id),
    [pid],
  );
  assert.equal(c.profileCount, 1);
  assert.equal((await request(`/profiles/${otherPid}/journey`)).status, 404);
  assert.equal((await fetch(base + "/enterprise/overview")).status, 401);
});
test("all three saved summary translations survive concurrent revisits without generation", async () => {
  const [p] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, pid));
  const context = {
    name: p.name,
    currentRole: p.currentRole,
    education: p.education,
    experience: p.experience,
    skills: [],
    holland: p.riasecCode,
    scores: p.riasecScores,
  };
  const translations = {
    en: "Your CIS interests support careful data work.",
    ms: "Minat CIS anda menyokong kerja data yang teliti.",
    zh: "您的CIS兴趣有助于细致的数据工作，您可以继续练习数据整理。",
  };
  await db.insert(insightsTable).values({
    profileId: pid,
    agent: "employee_summary",
    lang: "all",
    inputHash: hashInput("employee-summary-v1", p.organization, p.id, context),
    content: JSON.stringify(translations),
    sources: [],
    model: "qa-cached-no-generation",
  });
  const responses = await Promise.all([
    request(`/enterprise/employees/${pid}/summary`, "POST", {}),
    request(`/enterprise/employees/${pid}/summary`, "POST", {}),
  ]);
  for (const r of responses) {
    assert.equal(r.status, 200);
    const data = (await r.json()) as { cached: boolean; translations: unknown };
    assert.equal(data.cached, true);
    assert.deepEqual(data.translations, translations);
  }
});
test("employer workflow requires intake first, freezes Holland, and reopens active progress", async () => {
  assert.equal((await request(`/profiles/${pid}/matches`)).status, 409);
  assert.equal(
    (
      await request(`/profiles/${pid}/journey`, "POST", {
        action: "confirm_intake",
      })
    ).status,
    200,
  );
  assert.equal((await request(`/profiles/${pid}/matches`)).status, 200);
  assert.equal(
    (await request(`/profiles/${pid}/riasec`, "POST", { answers })).status,
    409,
  );
  const [plan] = await db
    .insert(plansTable)
    .values({
      profileId: pid,
      roleId: 1,
      roleTitle: "QA learning direction",
      totalWeeks: 1,
      totalCostMyr: 0,
      uncoveredSkills: [],
      items: [
        {
          courseId: 100,
          title: "QA course",
          provider: "QA",
          url: "https://example.test/course",
          startWeek: 1,
          durationWeeks: 1,
          costMyr: 0,
          hrdcStatus: "not_claimable",
          skills: ["SQL"],
          sdgCodes: [],
        },
      ],
    })
    .returning();
  await saveLearningState(pid, {
    stage: "active",
    planId: plan.id,
    startDate: "2026-10-24",
    completed: {},
  });
  assert.equal(
    (
      await request(`/profiles/${pid}/journey`, "POST", {
        action: "complete_course",
        courseId: 100,
        done: true,
      })
    ).status,
    200,
  );
  const progress = (await (
    await request(`/profiles/${pid}/journey`)
  ).json()) as { stage: string; complete: boolean };
  assert.equal(progress.stage, "active");
  assert.equal(progress.complete, true);
  const company = (await (await request("/enterprise/overview")).json()) as {
    completedCourses: number;
    activeCount: number;
  };
  assert.equal(company.completedCourses, 1);
  assert.equal(company.activeCount, 1);
});

test("real public catalogue plan activates after confirming an unreviewed employer CV", async () => {
  await saveLearningState(pid, { stage: "intake", completed: {} });
  await db
    .update(profilesTable)
    .set({ verified: false, onboardingStep: "review" })
    .where(eq(profilesTable.id, pid));
  assert.equal(
    (
      await request(`/profiles/${pid}`, "PATCH", {
        verified: true,
        onboardingStep: "complete",
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request(`/profiles/${pid}/journey`, "POST", {
        action: "confirm_intake",
      })
    ).status,
    200,
  );
  const matches = (await (
    await request(`/profiles/${pid}/matches`)
  ).json()) as { role: { id: number } }[];
  const roleId = matches[0].role.id;
  assert.equal(
    (await request(`/profiles/${pid}`, "PATCH", { targetRoleId: roleId }))
      .status,
    200,
  );
  const response = await request(`/profiles/${pid}/plan`, "POST", { roleId });
  assert.equal(response.status, 201);
  const plan = (await response.json()) as {
    verificationStatus: string;
    items: { courseId: number; url: string; durationWeeks: number | null }[];
  };
  assert.equal(plan.verificationStatus, "verified");
  assert.ok(plan.items.length >= 3);
  const durations = Object.fromEntries(
    plan.items
      .filter((i) => i.durationWeeks === null)
      .map((i) => [String(i.courseId), 1]),
  );
  assert.equal(
    (
      await request(`/profiles/${pid}/journey`, "POST", {
        action: "activate",
        startDate: "2026-10-24",
        durationWeeks: durations,
      })
    ).status,
    200,
  );
  const journey = (await (
    await request(`/profiles/${pid}/journey`)
  ).json()) as { stage: string; items: { deadline: string | null }[] };
  assert.equal(journey.stage, "active");
  assert.ok(journey.items.every((i) => i.deadline));
});

// Intercept only the provider boundary: no credits, keys or external AI requests.
test("changed inputs generate once for all languages; company analyses reuse their saved result", async () => {
  const realFetch = globalThis.fetch;
  const original = {
    provider: process.env.AI_PROVIDER,
    key: process.env.GEMINI_API_KEY,
    test: process.env.AI_TEST_MODE,
  };
  let calls = 0;
  const translations = {
    en: "### Next step\nPractise SQL with a small fictional dataset and review your learning each month.",
    ms: "### Langkah seterusnya\nLatih SQL dengan data rekaan kecil dan semak pembelajaran setiap bulan.",
    zh: "### 下一步\n使用小型虚构数据集练习SQL，并每个月回顾学习进度与需要改进的技能。",
  };
  process.env.AI_PROVIDER = "gemini";
  process.env.GEMINI_API_KEY = "qa-not-a-real-key";
  delete process.env.AI_TEST_MODE;
  globalThis.fetch = (async (input, init) => {
    if (
      String(input).startsWith("https://generativelanguage.googleapis.com/")
    ) {
      calls++;
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: { parts: [{ text: JSON.stringify(translations) }] },
              finishReason: "STOP",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return realFetch(input, init);
  }) as typeof fetch;
  try {
    await db
      .update(profilesTable)
      .set({ experience: "Changed fictional SQL experience" })
      .where(eq(profilesTable.id, pid));
    const results = await Promise.all([
      request(`/enterprise/employees/${pid}/summary`, "POST", {}),
      request(`/enterprise/employees/${pid}/summary`, "POST", {}),
    ]);
    for (const r of results) {
      assert.equal(r.status, 200);
      assert.deepEqual(
        ((await r.json()) as { translations: unknown }).translations,
        translations,
      );
    }
    assert.equal(calls, 1);
    const a = await request("/enterprise/future/analysis", "POST", {
      years: 3,
    });
    assert.equal(a.status, 200);
    const b = await request("/enterprise/future/analysis", "POST", {
      years: 3,
    });
    assert.equal(b.status, 200);
    assert.equal(((await b.json()) as { cached: boolean }).cached, true);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = realFetch;
    for (const [key, value] of [
      ["AI_PROVIDER", original.provider],
      ["GEMINI_API_KEY", original.key],
      ["AI_TEST_MODE", original.test],
    ]) {
      if (value === undefined) delete process.env[key!];
      else process.env[key!] = value;
    }
  }
});
