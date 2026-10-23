import { test } from "node:test";
import assert from "node:assert/strict";
import { profileSkills } from "./profile-skills";
import { buildPlan } from "./planner";
import type { CourseView } from "./catalog";

test("education and experience suggest skills without replacing confirmed evidence", () => {
  const catalogue = [
    { id: 1, name: "Programming", category: "Digital", aliases: ["python"] },
    { id: 2, name: "Mathematics", category: "Digital", aliases: [] },
  ];
  const result = profileSkills(
    {
      education: "Master of Data Science",
      experience: "Built pipelines using Python",
      skills: [{ skillId: 1, status: "self_reported", evidence: null }],
    },
    catalogue,
  );
  assert.equal(result.find((s) => s.skillId === 1)?.status, "self_reported");
  assert.equal(result.find((s) => s.skillId === 2)?.status, "inferred");
  assert.deepEqual(profileSkills({ skills: [] }, catalogue), []);
});

test("timeline respects long course hours and the training budget", () => {
  const course: CourseView = {
    id: 1,
    title: "Long course",
    provider: "Test",
    url: "https://example.invalid/course",
    costMyr: 100,
    costType: "paid",
    hrdcStatus: "not_claimable",
    durationHours: 300,
    level: "beginner",
    language: "en",
    certificate: true,
    skills: [{ id: 1, name: "Programming", category: "Digital" }],
    lastVerified: "2026-10-23",
    sdgCodes: ["4"],
  };
  const opts = {
    gaps: [
      { skillId: 1, name: "Programming", category: "Digital", importance: 3 },
    ],
    courses: [course],
    budgetMyr: 100,
    weeklyHours: 2,
    hrdcEligible: false,
  };
  const plan = buildPlan(opts);
  assert.equal(plan.items[0].durationWeeks, 150);
  assert.equal(plan.totalWeeks, 150);
  assert.equal(buildPlan({ ...opts, budgetMyr: 0 }).items.length, 0);
  assert.equal(
    buildPlan({ ...opts, weeklyHours: 10 }).items[0].durationWeeks,
    60,
  );
  assert.equal(buildPlan({ ...opts, roleTitle: "Administrative Assistant", courses: [{ ...course, title: "Monitor AI workloads on Azure" }] }).items.length, 0);
});
