import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/healthz/db", async (_req, res) => {
  try {
    const safeConn = process.env.DATABASE_URL
      ? process.env.DATABASE_URL.replace(/:([^:@]+)@/, ":***@")
      : "not set";
    const result = await pool.query("SELECT 1 as connected, current_database() as db_name, current_user as db_user");
    res.json({
      status: "connected",
      database: result.rows[0],
      configured_url: safeConn,
    });
  } catch (err: any) {
    const safeConn = process.env.DATABASE_URL
      ? process.env.DATABASE_URL.replace(/:([^:@]+)@/, ":***@")
      : "not set";
    res.status(500).json({
      status: "error",
      message: err?.message,
      code: err?.code,
      cause: err?.cause?.message || err?.cause || err?.detail,
      configured_url: safeConn,
    });
  }
});

export default router;

