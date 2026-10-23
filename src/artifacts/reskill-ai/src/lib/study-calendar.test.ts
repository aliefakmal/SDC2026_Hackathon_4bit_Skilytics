import { test } from "node:test";
import assert from "node:assert/strict";
import { monthCells, coursesOnDay } from "./study-calendar";
test("Monday-first calendar covers leap days and month boundaries", () => {
  const cells = monthCells("2028-02");
  assert.equal(cells[0], null);
  assert.equal(cells[1], "2028-02-01");
  assert.ok(cells.includes("2028-02-29"));
  assert.equal(cells.length % 7, 0);
  assert.deepEqual(monthCells("bad"), []);
});
test("calendar marks overlapping courses through their inclusive deadline", () => {
  const base = { title: "Demo", provider: "Test" };
  const a = {
    ...base,
    courseId: 1,
    startDate: "2026-12-29",
    deadline: "2027-01-04",
  };
  const b = {
    ...base,
    courseId: 2,
    startDate: "2027-01-04",
    deadline: "2027-01-06",
  };
  const undated = { ...base, courseId: 3, startDate: null, deadline: null };
  assert.deepEqual(
    coursesOnDay([a, b, undated], "2027-01-04").map((c) => c.courseId),
    [1, 2],
  );
  assert.deepEqual(
    coursesOnDay([a, b], "2027-01-05").map((c) => c.courseId),
    [2],
  );
  assert.equal(coursesOnDay([a, b], "2026-12-28").length, 0);
});
