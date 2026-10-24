import { test } from "node:test";
import assert from "node:assert/strict";
import { agentRoutes } from "./agent-routing";
test("hybrid routing assigns CV to Gemini and text analysis to RunPod without claiming missing credentials", () => {
  const keys = [
    "AI_AGENT_ROUTING",
    "GEMINI_API_KEY",
    "RUNPOD_API_KEY",
    "RUNPOD_LLM_ENDPOINT_ID",
    "RUNPOD_ENABLE_GENERATION",
  ];
  const saved = keys.map((key) => process.env[key]);
  try {
    process.env.AI_AGENT_ROUTING = "hybrid";
    for (const key of keys.slice(1)) delete process.env[key];
    process.env.RUNPOD_ENABLE_GENERATION = "true";
    const routes = agentRoutes();
    assert.equal(routes.length, 8);
    assert.equal(new Set(routes.map((r) => r.agent)).size, 8);
    assert.equal(
      routes.find((r) => r.agent === "company_advisor")?.tier,
      "main",
    );
    assert.equal(routes.find((r) => r.agent === "cv")?.provider, "gemini");
    assert.equal(routes.find((r) => r.agent === "planner")?.provider, "runpod");
    assert.equal(routes.find((r) => r.agent === "sdg")?.tier, "light");
    assert.ok(routes.every((r) => !r.configured));
  } finally {
    keys.forEach((key, i) => {
      if (saved[i] === undefined) delete process.env[key];
      else process.env[key] = saved[i];
    });
  }
});
test("testing routes every agent to Gemini even when RunPod credentials exist", () => {
  const saved = process.env.RUNPOD_ENABLE_GENERATION;
  delete process.env.RUNPOD_ENABLE_GENERATION;
  try {
    assert.ok(
      agentRoutes().every(
        (route) => route.provider === "gemini" && route.runpodPlaceholder,
      ),
    );
  } finally {
    if (saved === undefined) delete process.env.RUNPOD_ENABLE_GENERATION;
    else process.env.RUNPOD_ENABLE_GENERATION = saved;
  }
});
