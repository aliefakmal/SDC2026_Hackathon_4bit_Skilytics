import { test } from "node:test";
import assert from "node:assert/strict";
import { softwareSkills, taskSkills } from "./occupational-skills";
import { openLearnCourses } from "../data/openlearn";
import { buildPlan } from "./planner";
import { teachesSkill } from "./course-relevance";

test("software crosswalk respects both occupation and narrower app role scope", () => {
  const rows = [
    {
      "O*NET-SOC Code": "15-2051.00",
      "Workplace Example": "Python",
      "In Demand": "Y",
    },
    {
      "O*NET-SOC Code": "15-2051.00",
      "Workplace Example": "Microsoft Excel",
      "In Demand": "N",
    },
    {
      "O*NET-SOC Code": "43-6014.00",
      "Workplace Example": "Office automation",
      "In Demand": "Y",
    },
  ];
  const data = softwareSkills(rows, "15-2051.00", ["Python"]);
  assert.deepEqual(
    data.map((s) => [s.name, s.importance]),
    [["Python", 3]],
  );
  assert.deepEqual(
    softwareSkills(rows, "43-6014.00", [
      "Microsoft Excel",
      "Office Administration",
    ]),
    [],
  );
});

test("only explicit core occupational tasks contribute scoped task skills", () => {
  const rows = [
    {
      "O*NET-SOC Code": "29-1141.00",
      "Task Type": "Core",
      Task: "Coordinate patient care in the ward.",
    },
    {
      "O*NET-SOC Code": "29-1141.00",
      "Task Type": "Supplemental",
      Task: "Use Python for analysis.",
    },
  ];
  assert.deepEqual(
    taskSkills(rows, "29-1141.00", ["Patient Care", "Python"]).map(
      (s) => s.name,
    ),
    ["Patient Care"],
  );
});

test("reviewed public courses link to the provider and keep publisher durations", () => {
  const courses = openLearnCourses([
    { id: 1, name: "Medicine and Dentistry", category: "Domain" },
    { id: 2, name: "Solar PV Systems", category: "Green" },
  ]);
  assert.equal(courses.length, 2);
  assert.ok(
    courses.every(
      (c) =>
        new URL(c.url).hostname === "www.open.edu" &&
        (c.durationHours === 2 || c.durationHours === 6) &&
        c.costMyr === 0,
    ),
  );
  assert.ok(courses.some((c) => c.sdgCodes[0] === "3.c"));
  assert.ok(courses.some((c) => c.sdgCodes[0] === "7.2"));
});

test("a shared language requirement cannot send another profession to fiction writing", () => {
  const courses = openLearnCourses([
    { id: 1, name: "English Language", category: "Domain" },
  ]);
  const options = {
    courses,
    gaps: [
      {
        skillId: 1,
        name: "English Language",
        category: "Domain",
        importance: 3,
      },
    ],
    budgetMyr: 0,
    weeklyHours: 5,
    hrdcEligible: false,
  };
  assert.equal(
    buildPlan({ ...options, roleTitle: "Software Developer" }).items.length,
    0,
  );
  assert.equal(
    buildPlan({ ...options, roleTitle: "Content Writer" }).items.length,
    1,
  );
});

test("incidental business words in technical courses do not become workplace training", () => {
  assert.equal(
    teachesSkill("Manage Microsoft Fabric", {
      name: "Office Administration",
      category: "Business",
    }),
    false,
  );
  assert.equal(
    teachesSkill("Introduction to AI skills for nonprofits", {
      name: "Microsoft Excel",
      category: "Digital",
    }),
    false,
  );
  assert.equal(
    teachesSkill("Deploy and operate Security Copilot", {
      name: "Speaking",
      category: "Human",
    }),
    false,
  );
  assert.equal(
    teachesSkill("Data analysis: visualisations in Excel", {
      name: "Microsoft Excel",
      category: "Digital",
    }),
    true,
  );
});

test("industrial automation is distinct from automating a software workflow", () => {
  assert.equal(
    teachesSkill("Automate GitHub workflows", {
      name: "PLC and Industrial Automation",
      category: "Engineering",
    }),
    false,
  );
  assert.equal(
    teachesSkill("Industrial automation with PLC", {
      name: "PLC and Industrial Automation",
      category: "Engineering",
    }),
    true,
  );
  assert.equal(
    teachesSkill("Clinical data in Microsoft Fabric", {
      name: "Patient Care",
      category: "Health",
    }),
    false,
  );
});
