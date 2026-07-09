import cron from "node-cron";
import { logger } from "../lib/logger.js";
import { runOrchestrator } from "../scrapers/orchestrator.js";
import { recordRun } from "../routes/health.js";
import { SOURCES } from "../scrapers/orchestrator.js";
import { archiveOldNews, syncOpportunityReplica } from "../lib/maintenance.js";

interface ScheduledTask {
  name: string;
  cron: string;
  batch: number | "all";
}

const SCHEDULES: ScheduledTask[] = [
  // Daily full scrape at 6am
  { name: "daily-full", cron: "0 6 * * *", batch: "all" },

  // Batch staggered throughout the week
  { name: "batch-1", cron: "30 6 * * 1", batch: 1 },    // Mon 6:30am
  { name: "batch-2", cron: "30 6 * * 2", batch: 2 },    // Tue 6:30am
  { name: "batch-3", cron: "30 6 * * 3", batch: 3 },    // Wed 6:30am
  { name: "batch-4", cron: "30 6 * * 4", batch: 4 },    // Thu 6:30am
  { name: "batch-5", cron: "30 6 * * 5", batch: 5 },    // Fri 6:30am
  { name: "batch-6", cron: "0 7 * * 1", batch: 6 },     // Mon 7:00am
  { name: "batch-7", cron: "0 7 * * 2", batch: 7 },     // Tue 7:00am
  { name: "batch-8", cron: "0 7 * * 3", batch: 8 },     // Wed 7:00am
  { name: "batch-9", cron: "0 7 * * 4", batch: 9 },     // Thu 7:00am
  { name: "batch-10", cron: "0 7 * * 5", batch: 10 },   // Fri 7:00am
  { name: "batch-11", cron: "0 8 * * 1", batch: 11 },   // Mon 8:00am
  { name: "batch-12", cron: "0 8 * * 2", batch: 12 },   // Tue 8:00am
  { name: "batch-13", cron: "0 8 * * 3", batch: 13 },   // Wed 8:00am
  // New expanded batches
  { name: "batch-14", cron: "0 9 * * 4", batch: 14 },   // Thu 9:00am
  { name: "batch-15", cron: "0 9 * * 5", batch: 15 },   // Fri 9:00am
  { name: "batch-16", cron: "0 10 * * 1", batch: 16 },  // Mon 10:00am
  { name: "batch-17", cron: "0 10 * * 2", batch: 17 },  // Tue 10:00am
];

let started = false;

export function startScheduler() {
  if (started) return;
  started = true;

  for (const s of SCHEDULES) {
    if (!cron.validate(s.cron)) {
      logger.warn(`[Scheduler] Invalid cron for ${s.name}: ${s.cron}`);
      continue;
    }
    const schedule = s;
    cron.schedule(s.cron, async () => {
      const sourceCount = schedule.batch === "all"
        ? SOURCES.filter(sc => sc.active).length
        : SOURCES.filter(sc => sc.batch === schedule.batch && sc.active).length;
      logger.info(`[Scheduler] ${s.name}: scraping batch=${s.batch} (~${sourceCount} sources)`);
      try {
        const results = await runOrchestrator(s.batch);
        for (const r of results) {
          recordRun(r.source, r.success ? "ok" : "error", r.count);
        }
        const ok = results.filter((r) => r.success).length;
        logger.info(`[Scheduler] ${s.name}: ${ok}/${results.length} succeeded`);
      } catch (e) {
        logger.error(`[Scheduler] ${s.name} failed:`, e);
      }
    });
    logger.info(`[Scheduler] ${s.name}: ${s.cron} (batch=${s.batch})`);
  }

  // Archive old news daily at 2am
  cron.schedule("0 2 * * *", async () => {
    logger.info("[Scheduler] archive-news: starting");
    try {
      const result = await archiveOldNews();
      logger.info(`[Scheduler] archive-news: ${result.archived} archived, ${result.errors.length} errors`);
    } catch (e) {
      logger.error("[Scheduler] archive-news failed:", e);
    }
  });

  // Sync opportunity replica every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    logger.info("[Scheduler] sync-replica: starting");
    try {
      const result = await syncOpportunityReplica();
      logger.info(`[Scheduler] sync-replica: ${result.synced} synced, ${result.errors.length} errors`);
    } catch (e) {
      logger.error("[Scheduler] sync-replica failed:", e);
    }
  });

  logger.info("[Scheduler] Maintenance tasks registered: archive-news (0 2 * * *), sync-replica (0 */6 * * *)");
}
