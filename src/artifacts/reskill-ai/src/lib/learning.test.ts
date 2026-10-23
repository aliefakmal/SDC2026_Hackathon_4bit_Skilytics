import { test } from "node:test";
import assert from "node:assert/strict";
import { learningCalendarText, datedLearning } from "./learning";
import type { PlanItem } from "@workspace/api-client-react";

test("one calendar file includes every dated course with exclusive end date and reminder", () => {
  const items = [
    {
      courseId: 1,
      title: "学习技能，提升自己".repeat(12),
      provider: "Public provider",
      url: "https://example.invalid/course",
      startDate: "2026-11-01",
      deadline: "2026-11-07",
    },
    {
      courseId: 2,
      title: "SQL",
      provider: "Public provider",
      url: "https://example.invalid/sql",
      startDate: "2026-11-08",
      deadline: "2026-11-14",
    },
  ];
  const text = learningCalendarText(items, 100, "Data analyst");
  assert.equal(text.match(/BEGIN:VEVENT/g)?.length, 2);
  assert.ok(text.includes("DTEND;VALUE=DATE:20261108"));
  assert.equal(text.match(/TRIGGER:-P1D/g)?.length, 2);
  assert.ok(text.includes("https://example.invalid/course"));
  assert.ok(
    text.split("\r\n").every((line) => Buffer.byteLength(line, "utf8") <= 75),
  );
});
test("unknown durations require an explicit estimate and invalid empty start dates do not crash", () => {
  const items = [
    { courseId: 1, startWeek: 1, durationWeeks: 2 },
    { courseId: 2, startWeek: null, durationWeeks: null },
  ] as PlanItem[];
  assert.equal(datedLearning(items, "2026-11-01", {})[1].deadline, null);
  assert.equal(
    datedLearning(items, "2026-11-01", { "2": 1 })[1].startDate,
    "2026-11-15",
  );
  assert.equal(
    datedLearning(items, "2026-11-01", { "2": 1 })[1].deadline,
    "2026-11-21",
  );
  assert.equal(datedLearning(items, "", {})[0].deadline, null);
  assert.equal(datedLearning(items, "2026-11-01", {"2":1.5})[1].deadline, null);
});
