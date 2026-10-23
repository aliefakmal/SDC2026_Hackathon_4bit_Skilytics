import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import fixtures from "../../../../testing/demo-cv/profiles.json";
import { BLS_SOURCE, parseOutlook, outlookCandidates } from "./market-outlook";
import type { RoleView } from "./catalog";
test("demo facts are versioned against the actual local fictional CVs", () => {
  for (const f of fixtures.profiles) {
    const bytes = readFileSync(
      new URL(`../../../../testing/demo-cv/${f.file}`, import.meta.url),
    );
    assert.equal(createHash("sha256").update(bytes).digest("hex"), f.sha256);
    assert.ok(f.cvText.includes(f.name));
  }
});
test("BLS reference keeps US periods and converts thousands to people", () => {
  assert.equal(BLS_SOURCE.geography, "USA");
  assert.equal(BLS_SOURCE.period, "2025–2035");
  const data = BLS_SOURCE.rows.find((r) => r.socCode === "15-2051")!;
  assert.equal(data.growthPct, 34.6);
  assert.equal(data.annualOpenings, 24800);
  assert.ok(
    BLS_SOURCE.rows.every(
      (r) => Number.isFinite(r.growthPct) && r.annualOpenings >= 0,
    ),
  );
});
test("market forecast validation rejects invented roles, unsupported demand and numeric AI forecasts", () => {
  const candidates = outlookCandidates(
    [1, 2, 3].map(
      (id) =>
        ({
          id,
          title: "Data scientist " + id,
          socCode: ["15-2051", "15-1252", "29-1141"][id - 1],
          skills: [],
          aiExposure: 0.3,
          aiUsagePctMy: 2,
          aiUsagePctGlobal: 3,
        }) as unknown as RoleView,
    ),
  );
  const reason = {
    en: "AI may help with everyday tasks.",
    ms: "AI boleh membantu tugasan harian.",
    zh: "AI 可能协助日常工作。",
  };
  const entries = candidates.map((c) => ({
    roleId: c.roleId,
    reason,
    confidence: "low",
  }));
  const data = { ai: entries, demand: entries, note: reason };
  assert.equal(parseOutlook(JSON.stringify(data), candidates).ai.length, 3);
  assert.throws(() =>
    parseOutlook(
      JSON.stringify({
        ...data,
        ai: [{ ...entries[0], roleId: 999 }, ...entries.slice(1)],
      }),
      candidates,
    ),
  );
  assert.throws(() =>
    parseOutlook(
      JSON.stringify({ ...data, ai: [entries[0], entries[0], entries[1]] }),
      candidates,
    ),
  );
  assert.throws(() =>
    parseOutlook(
      JSON.stringify({
        ...data,
        ai: entries.map((r) => ({
          ...r,
          reason: { ...reason, en: "Future adoption will be 90%" },
        })),
      }),
      candidates,
    ),
  );
  assert.throws(() =>
    parseOutlook(
      JSON.stringify(data),
      candidates.map((c) => ({ ...c, projection: null })),
    ),
  );
});
