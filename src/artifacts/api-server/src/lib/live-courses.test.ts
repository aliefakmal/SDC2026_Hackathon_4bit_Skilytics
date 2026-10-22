import { test } from "node:test";
import assert from "node:assert/strict";
import { mapLearnPaths, courseSdg, liveCourses } from "./live-courses";
import { buildPlan } from "./planner";
import { hasCurrentRiasec, scoreRiasec } from "./riasec-scoring";
import { RIASEC_QUESTIONS } from "../data/riasec";

const skills = [{ id: 1, name: "Python", category: "Digital" }, { id: 2, name: "SQL", category: "Digital" }];
const path = { uid: "learn.python", title: "Get started with Python", url: "https://learn.microsoft.com/en-us/training/paths/python/?tracking=1", duration_in_minutes: 90 };
test("provider courses retain stable IDs, exact destination and sourced duration; reject unsafe or irrelevant entries", () => {
  const courses = mapLearnPaths([path, { ...path, url: "https://evil.example/training/paths/python/" }, { ...path, title: "Introduction to art" }, { ...path, duration_in_minutes: 0 }], skills, "2026-10-23T00:00:00Z");
  assert.equal(courses.length, 1);
  assert.equal(courses[0].durationHours, 1.5);
  assert.equal(courses[0].url, "https://learn.microsoft.com/en-us/training/paths/python/");
  assert.equal(courses[0].hrdcStatus, "not_claimable");
  assert.equal(courses[0].certificate, false);
  assert.equal(mapLearnPaths([path], skills, "later")[0].id, courses[0].id);
  assert.deepEqual(courses[0].skills.map((s) => s.id), [1]);
});
test("SDGs reflect subject matter without treating every course as climate action or innovation", () => {
  assert.deepEqual(courseSdg("Learning Python"), ["4.4"]);
  assert.deepEqual(courseSdg("Cloud data productivity"), ["4.4", "8.2"]);
  assert.deepEqual(courseSdg("Climate and carbon"), ["13.3", "4.4"]);
  assert.deepEqual(courseSdg("Training accessibility"), ["4.4", "10.2"]);
  assert.deepEqual(courseSdg("Configure a cloud development environment"), ["4.4", "8.2"]);
});
test("current assessment requires all 30 translated activities and cannot reuse previous answers", () => {
  const answers = RIASEC_QUESTIONS.map((q) => ({ questionId: q.id, value: 3 }));
  assert.equal(hasCurrentRiasec(answers), true);
  for (let i=0; i<30; i++) assert.throws(() => scoreRiasec(answers.filter((_, index) => index !== i)), /riasec_incomplete/);
  assert.equal(hasCurrentRiasec(answers.map((a) => ({ ...a, questionId: a.questionId - 100 }))), false);
  assert.equal(RIASEC_QUESTIONS.filter((q) => q.textMs && q.textZh && q.text).length, 30);
});

test("unconfirmed HRD status cannot subsidise a plan", () => {
  const course = { ...mapLearnPaths([path], skills, "now")[0], costMyr: 100, costType: "paid" as const, hrdcStatus: "check_with_employer" as const };
  const options = { gaps: [{ skillId: 1, name: "Python", category: "Digital", importance: 3 }], courses: [course], budgetMyr: 0, weeklyHours: 5, hrdcEligible: true };
  assert.equal(buildPlan(options).items.length, 0);
  const verified = { ...course, hrdcStatus: "claimable_verified" as const };
  assert.equal(buildPlan({ ...options, courses: [verified] }).items.length, 1);
  assert.equal(buildPlan({ ...options, courses: [verified], hrdcEligible: false }).items.length, 0);
});

test("live refresh coalesces requests and withholds expired data on provider failure", async () => {
  const originalFetch = globalThis.fetch, originalNow = Date.now;
  let calls = 0, clock = originalNow();
  Date.now = () => clock;
  globalThis.fetch = async () => {
    calls++;
    return new Response(JSON.stringify({ learningPaths: [path] }), { status: 200 });
  };
  try {
    const [a,b] = await Promise.all([liveCourses(skills), liveCourses(skills)]);
    assert.equal(calls, 1); assert.equal(a.length, 1); assert.deepEqual(a,b);
    clock += 6 * 3600000 + 1;
    globalThis.fetch = async () => { calls++; throw new Error("offline"); };
    assert.deepEqual(await liveCourses(skills), []);
    assert.deepEqual(await liveCourses(skills), []);
    assert.equal(calls, 2);
  } finally { globalThis.fetch = originalFetch; Date.now = originalNow; }
});
