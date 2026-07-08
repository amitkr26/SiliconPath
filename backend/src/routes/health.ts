import { Router } from "express";
import { checkDbHealth } from "../lib/db.js";
import { logger } from "../lib/logger.js";
import { SOURCES } from "../scrapers/orchestrator.js";

const router = Router();

interface RunRecord {
  source: string;
  status: "ok" | "error";
  count: number;
  timestamp: string;
}

const lastRuns: RunRecord[] = [];

export function recordRun(source: string, status: "ok" | "error", count: number) {
  lastRuns.push({ source, status, count, timestamp: new Date().toISOString() });
  if (lastRuns.length > 100) lastRuns.shift();
}

router.get("/health", async (_req, res) => {
  try {
    const dbHealth = await checkDbHealth();
    res.json({
      status: Object.values(dbHealth).every((s) => s === "ok") ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      databases: dbHealth,
      last_runs: lastRuns.slice(-10),
      uptime: process.uptime(),
    });
  } catch (e) {
    logger.error("[Health] Check failed:", e);
    res.status(500).json({ status: "error", error: String(e) });
  }
});

export default router;
