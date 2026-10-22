import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

import { pool } from "@workspace/db";

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/healthz/db", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "connected" });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});

router.get("/healthz/ai-probe", async (_req, res) => {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (!geminiKey) {
    res.json({ error: "no_gemini_key" });
    return;
  }
  try {
    const modelsRes = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/models", {
      headers: { Authorization: `Bearer ${geminiKey}` },
      signal: AbortSignal.timeout(10000),
    });
    const modelsJson = await modelsRes.json();
    res.json({ status: "ok", models: modelsJson });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/healthz/ai-test-model", async (req, res) => {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (!geminiKey) {
    res.json({ error: "no_gemini_key" });
    return;
  }
  const model = req.body?.model || "gemini-3.1-flash-lite";
  try {
    const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello, reply 'OK'." }] }],
        generationConfig: { maxOutputTokens: 10 },
      }),
      signal: AbortSignal.timeout(10000),
    });
    const txt = await apiRes.text();
    res.json({ model, status: apiRes.status, ok: apiRes.ok, body: txt });
  } catch (err: any) {
    res.status(500).json({ model, error: err.message });
  }
});

export default router;
