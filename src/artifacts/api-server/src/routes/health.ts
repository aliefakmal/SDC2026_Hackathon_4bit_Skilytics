import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

import { pool, activeConnectionString } from "@workspace/db";

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/healthz/db", async (_req, res) => {
  const rawUrl = activeConnectionString || process.env.DATABASE_URL || "";
  const maskedUrl = rawUrl.replace(/:([^@/]+)@/, ":****@");
  try {
    const result = await pool.query(
      "SELECT current_database() as db, count(*) as count from profiles"
    );
    res.json({
      status: "connected",
      database: result.rows[0]?.db,
      profileCount: Number(result.rows[0]?.count ?? 0),
      target: maskedUrl,
      env: process.env.NODE_ENV,
      isRender: Boolean(process.env.RENDER),
    });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      message: err.message,
      code: err.code,
      target: maskedUrl,
      env: process.env.NODE_ENV,
      isRender: Boolean(process.env.RENDER),
    });
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
  const model = req.body?.model || "gemini-2.5-flash-lite";
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
