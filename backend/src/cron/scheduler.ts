import cron from "node-cron";
import { logger } from "../lib/logger.js";
import { runOrchestrator } from "../scrapers/orchestrator.js";
import { recordRun } from "../routes/health.js";
import { SOURCES } from "../scrapers/orchestrator.js";

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
}
