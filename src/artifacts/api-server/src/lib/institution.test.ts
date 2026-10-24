import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  db,
  pool,
  usersTable,
  profilesTable,
  predictionsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import app from "../app";
import { issueToken } from "./auth";
import { fixedDemoAnswers } from "./demo";
import { scoreRiasec } from "./riasec-scoring";
import { loadCourses } from "./catalog";
import {
  graduateOutcomes,
  graduateYears,
  graduateScenario,
} from "./institution";
let server: ReturnType<typeof app.listen>,
  base: string,
  token: string,
  other: string,
  hr: string,
  pid: number;
const owners: number[] = [];
before(async () => {
  server = app.listen(0);
  await new Promise<void>((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
  const answers = fixedDemoAnswers({ R: 2, I: 4.6, A: 3, S: 3, E: 2.6, C: 4 }),
    scored = scoreRiasec(answers);
  for (let i = 0; i < 3; i++) {
    const [u] = await db
      .insert(usersTable)
      .values({
        email: `tvet-${randomUUID()}@example.test`,
        name: "Disposable institution QA",
        role: i === 2 ? "hr" : "tvet",
        organization: `QA institution ${randomUUID()}`,
        passwordHash: "not-a-login-password",
      })
      .returning();
    owners.push(u.id);
    if (!i) {
      token = issueToken(u.id);
      const [p] = await db
        .insert(profilesTable)
        .values({
          name: "Fictional student QA",
          segment: "graduate",
          organization: u.organization,
          ownerUserId: u.id,
          weeklyHours: 4,
          budgetMyr: 0,
          cvExtractionKey: "qa-student-cv",
          experience: "Fictional programming practice",
          verified: true,
          onboardingStep: "complete",
          riasecAnswers: answers,
          riasecScores: scored.scores,
          riasecCode: scored.code,
          skills: [],
        })
        .returning();
      pid = p.id;
    } else if (i === 1) other = issueToken(u.id);
    else hr = issueToken(u.id);
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
const request = (path: string, method = "GET", body?: unknown, auth = token) =>
  fetch(base + path, {
    method,
    headers: {
      Authorization: `Bearer ${auth}`,
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }) as Promise<Omit<Response,"json"> & {json:()=>Promise<any>}>;
test("synthetic outcome totals and original-name distribution copies match", () => {
  assert.equal(graduateOutcomes.synthetic, true);
  assert.deepEqual(
    graduateYears().map((y) => y.year),
    [2024, 2025, 2026],
  );
  for (const r of graduateOutcomes.rows)
    assert.equal(
      r.employedWithinSixMonths +
        r.furtherStudy +
        r.seekingWork +
        r.notReported,
      r.graduates,
    );
  assert.equal(
    graduateScenario(10),
    Math.min(100, graduateYears().at(-1)!.rate + 20),
  );
  assert.deepEqual(
    readFileSync(
      new URL(
        "../../../../synthetic-data/tvet/graduate-employment-2024-2026.json",
        import.meta.url,
      ),
    ),
    readFileSync(
      new URL(
        "../../../../../synthetic%20data/graduate-employment-2024-2026.json",
        import.meta.url,
      ),
    ),
  );
  for (const f of ["demo-cv-1.pdf", "demo-cv-2.jpeg", "demo-cv-3.pdf"])
    assert.deepEqual(
      readFileSync(
        new URL("../../../../testing/demo-cv/" + f, import.meta.url),
      ),
      readFileSync(
        new URL("../../../../../synthetic%20data/" + f, import.meta.url),
      ),
    );
});
test("TVET requirements follow a scoped guarded journey and preserve progress and completed awards", async () => {
  assert.equal((await fetch(base + "/institution/compulsory")).status, 401);
  assert.equal(
    (await request("/institution/compulsory", "GET", undefined, hr)).status,
    403,
  );
  const courses = (await loadCourses()).filter(
    (c) => c.costMyr === 0 && c.durationHours !== null,
  );
  assert.ok(courses.length > 3);
  const first = courses[0];
  assert.equal(
    (await request("/institution/compulsory", "PUT", { courseIds: [first.id] }))
      .status,
    200,
  );
  assert.deepEqual(
    (
      await (
        await request("/institution/compulsory", "GET", undefined, other)
      ).json()
    ).courseIds,
    [],
  );
  assert.equal((await request(`/profiles/${pid}/matches`)).status, 409);
  assert.equal(
    (
      await request(`/profiles/${pid}/journey`, "POST", {
        action: "confirm_intake",
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request(`/profiles/${pid}/riasec`, "POST", {
        answers: fixedDemoAnswers({ R: 4, I: 2, A: 3, S: 2, E: 4, C: 2 }),
      })
    ).status,
    409,
  );
  const matches = await (await request(`/profiles/${pid}/matches`)).json(),
    roleId = matches[0].role.id;
  assert.equal(
    (await request(`/profiles/${pid}`, "PATCH", { targetRoleId: roleId }))
      .status,
    200,
  );
  const response = await request(`/profiles/${pid}/plan`, "POST", { roleId });
  assert.equal(response.status, 201);
  const plan = await response.json();
  assert.equal(
    plan.items.filter((i: any) => i.courseId === first.id).length,
    1,
  );
  assert.equal(
    plan.items.find((i: any) => i.courseId === first.id).compulsory,
    true,
  );
  assert.ok(plan.items.some((i: any) => !i.compulsory));
  const durations = Object.fromEntries(
    plan.items
      .filter((i: any) => i.durationWeeks === null)
      .map((i: any) => [String(i.courseId), 1]),
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
  await request(`/profiles/${pid}/journey`, "POST", {
    action: "complete_course",
    courseId: first.id,
    done: true,
  });
  const before = await (await request(`/profiles/${pid}/journey`)).json();
  const second = courses.find(
    (c) => !plan.items.some((i: any) => i.courseId === c.id),
  )!;
  assert.equal(
    (
      await request("/institution/compulsory", "PUT", {
        courseIds: [first.id, second.id],
      })
    ).status,
    200,
  );
  const after = await (await request(`/profiles/${pid}/journey`)).json();
  assert.ok(
    after.items.some(
      (i: any) => i.courseId === second.id && i.compulsory && i.deadline,
    ),
  );
  assert.deepEqual(after.completed, before.completed);
  assert.equal(
    after.items.find((i: any) => i.courseId === first.id).deadline,
    before.items.find((i: any) => i.courseId === first.id).deadline,
  );
  for (const i of after.items)
    assert.equal(
      (
        await request(`/profiles/${pid}/journey`, "POST", {
          action: "complete_course",
          courseId: i.courseId,
          done: true,
        })
      ).status,
      200,
    );
  assert.equal(
    (await request(`/profiles/${pid}/journey/certificate`)).status,
    200,
  );
  const third = courses.find(
    (c) => !after.items.some((i: any) => i.courseId === c.id),
  )!;
  await request("/institution/compulsory", "PUT", { courseIds: [third.id] });
  assert.equal(
    (await request(`/profiles/${pid}/journey/certificate`)).status,
    200,
  );
});
test("Grads Future and chat keep synthetic provenance, saved translations and tenant isolation", async () => {
  const real = globalThis.fetch,
    old = {
      p: process.env.AI_PROVIDER,
      k: process.env.GEMINI_API_KEY,
      t: process.env.AI_TEST_MODE,
    };
  let calls = 0;
  const prompts: string[] = [];
  const translations = {
    en: "This is synthetic graduate reference data, not measured institutional employment.",
    ms: "Ini rujukan graduan sintetik, bukan hasil pekerjaan sebenar institusi.",
    zh: "这是合成毕业生参考数据，并非该机构实测就业结果。请将真实学习进度与虚构就业示例分开。",
  };
  process.env.AI_PROVIDER = "gemini";
  process.env.GEMINI_API_KEY = "qa-not-a-key";
  delete process.env.AI_TEST_MODE;
  globalThis.fetch = (async (input, init) => {
    if (
      String(input).startsWith("https://generativelanguage.googleapis.com/")
    ) {
      calls++;
      prompts.push(String(init?.body));
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
    return real(input, init);
  }) as typeof fetch;
  try {
    const r = await request("/enterprise/future/analysis", "POST", {
      years: 2,
    });
    assert.equal(r.status, 200);
    const a = await r.json();
    assert.deepEqual(a.translations, translations);
    assert.ok(a.id > 0);
    assert.ok(prompts[0].includes("synthetic") && prompts[0].includes("2024"));
    assert.ok(!prompts[0].includes("Fictional student QA"));
    assert.equal(
      (await request("/enterprise/future/analysis?years=2")).status,
      200,
    );
    assert.equal(calls, 1);
    const body = {
      analysisId: a.id,
      years: 2,
      question: "Which courses should students practise?",
      parentId: null,
    };
    assert.equal(
      (await request("/enterprise/future/chat", "POST", body, other)).status,
      404,
    );
    const answer = await (
      await request("/enterprise/future/chat", "POST", body)
    ).json();
    assert.deepEqual(answer.translations, translations);
    assert.ok(
      answer.sources.some((s: any) => s.url.includes("synthetic-data")),
    );
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = real;
    for (const [k, v] of [
      ["AI_PROVIDER", old.p],
      ["GEMINI_API_KEY", old.k],
      ["AI_TEST_MODE", old.t],
    ]) {
      if (v === undefined) delete process.env[k!];
      else process.env[k!] = v;
    }
  }
});
