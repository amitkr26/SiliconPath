import { Router, Request, Response } from "express";
import { logger } from "../lib/logger.js";
import { runOrchestrator } from "../scrapers/orchestrator.js";
import { recordRun } from "./health.js";

const router = Router();

function auth(req: Request, res: Response): boolean {
  const secret = process.env.SCRAPER_SECRET;
  if (!secret) {
    res.status(500).json({ error: "SCRAPER_SECRET not configured" });
    return false;
  }
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token !== secret) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

router.post("/scrape/run", async (req, res) => {
  if (!auth(req, res)) return;

  const batch = req.body?.batch ?? "all";

  try {
    logger.info(`[Scrape] Triggered batch=${batch}`);
    const results = await runOrchestrator(batch);

    for (const r of results) {
      recordRun(r.source, r.success ? "ok" : "error", r.count);
    }

    res.json({
      success: true,
      batch,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    logger.error("[Scrape] Orchestrator error:", e);
    res.status(500).json({ success: false, error: String(e) });
  }
});

router.post("/scrape/batch/:batchId", async (req, res) => {
  if (!auth(req, res)) return;
  const batchId = req.params.batchId;

  try {
    logger.info(`[Scrape] Triggered batch=${batchId}`);
    const results = await runOrchestrator(batchId as number | "all");

    for (const r of results) {
      recordRun(r.source, r.success ? "ok" : "error", r.count);
    }

    res.json({ success: true, batch: batchId, results, timestamp: new Date().toISOString() });
  } catch (e) {
    logger.error(`[Scrape] Batch ${batchId} error:`, e);
    res.status(500).json({ success: false, error: String(e) });
  }
});

export default router;
