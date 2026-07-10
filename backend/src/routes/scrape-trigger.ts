import { Router, Request, Response } from "express";
import { logger } from "../lib/logger.js";
import {
  runOrchestrator,
  runSingleSource,
  getSourceById,
  getActiveRuns,
  SOURCES,
} from "../scrapers/orchestrator.js";
import { recordRun } from "./health.js";
import {
  getAPIInfo,
  getActiveSourcesByCategory,
  getBatchesByCategory,
} from "../lib/api-docs.js";

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

// POST /scrape/run — run all or a specific batch
router.post("/scrape/run", async (req, res) => {
  if (!auth(req, res)) return;

  const batch = req.body?.batch ?? "all";

  try {
    logger.info(`[Scrape] Triggered batch=${batch}`);
    const results = await runOrchestrator(batch);
    for (const r of results) {
      recordRun(r.source, r.success ? "ok" : "error", r.count);
    }
    res.json({ success: true, batch, results, timestamp: new Date().toISOString() });
  } catch (e) {
    logger.error("[Scrape] Orchestrator error:", e);
    res.status(500).json({ success: false, error: String(e) });
  }
});

// POST /scrape/batch/:batchId — run a specific batch number
router.post("/scrape/batch/:batchId", async (req, res) => {
  if (!auth(req, res)) return;
  const batchId = parseInt(req.params.batchId, 10) || req.params.batchId;

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

// GET /scrape/test/:sourceId — test-run a single source (NOW REQUIRES AUTH)
router.get("/scrape/test/:sourceId", async (req, res) => {
  if (!auth(req, res)) return; // fixed: previously unauthenticated (SSRF risk)

  const { sourceId } = req.params;
  const source = getSourceById(sourceId);
  if (!source) {
    res.status(404).json({ error: `Source '${sourceId}' not found` });
    return;
  }

  const start = Date.now();
  try {
    const items = await runSingleSource(source);
    res.json({
      source: sourceId,
      source_name: source.name,
      adapter_used: source.type,
      url: source.url,
      results_count: items.length,
      results: items.slice(0, 20),
      took_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({
      source: sourceId,
      error: e instanceof Error ? e.message : String(e),
      took_ms: Date.now() - start,
    });
  }
});

// GET /scrape/status — show recent runs and source overview
router.get("/scrape/status", (_req, res) => {
  const runs = getActiveRuns();
  const recentRuns = Array.from(runs.values()).slice(-20).reverse();

  const byBatch = new Map<number, number>();
  const byCategory = new Map<string, number>();
  const byType = new Map<string, number>();

  for (const s of SOURCES) {
    if (!s.active) continue;
    byBatch.set(s.batch, (byBatch.get(s.batch) || 0) + 1);
    byCategory.set(s.category, (byCategory.get(s.category) || 0) + 1);
    byType.set(s.type, (byType.get(s.type) || 0) + 1);
  }

  res.json({
    total_sources: SOURCES.length,
    active_sources: SOURCES.filter((s) => s.active).length,
    batches: Object.fromEntries(byBatch),
    categories: Object.fromEntries(byCategory),
    types: Object.fromEntries(byType),
    recent_runs: recentRuns.map((r) => ({
      source: r.sourceId,
      name: r.sourceName,
      status: r.status,
      results: r.results,
      started: r.startedAt,
      completed: r.completedAt,
      error: r.error ?? null,
    })),
  });
});

// GET /scrape/explore — API documentation and source metadata
router.get("/scrape/explore", (_req, res) => {
  res.json({
    ...getAPIInfo(),
    categories: getActiveSourcesByCategory(),
    batches: getBatchesByCategory(),
    sample_sources: SOURCES.filter((_s, i) => i < 5).map((s) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      category: s.category,
      type: s.type,
      batch: s.batch,
    })),
  });
});

export default router;
