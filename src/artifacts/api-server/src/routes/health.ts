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

export default router;
