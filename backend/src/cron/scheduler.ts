import cron from "node-cron";
import { logger } from "../lib/logger.js";
import { runOrchestrator } from "../scrapers/orchestrator.js";
import { recordRun } from "../routes/health.js";

const SCHEDULES = [
  { name: "daily-scrape", cron: "0 6 * * *", batch: "all" },
  { name: "batch1-refresh", cron: "0 12 * * *", batch: "1" },
];

let started = false;

export function startScheduler() {
  if (started) return;
  started = true;

  for (const s of SCHEDULES) {
    if (!cron.validate(s.cron)) {
      logger.warn(`[Scheduler] Invalid cron expression for ${s.name}: ${s.cron}`);
      continue;
    }
    cron.schedule(s.cron, async () => {
      logger.info(`[Scheduler] Running ${s.name} (batch=${s.batch})`);
      try {
        const results = await runOrchestrator(s.batch as number | "all");
        for (const r of results) {
          recordRun(r.source, r.success ? "ok" : "error", r.count);
        }
      } catch (e) {
        logger.error(`[Scheduler] ${s.name} failed:`, e);
      }
    });
    logger.info(`[Scheduler] Scheduled ${s.name}: ${s.cron}`);
  }
}
