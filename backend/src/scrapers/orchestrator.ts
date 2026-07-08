import { ScrapeResult, ScrapedOpportunity, SourceConfig } from "./types.js";
import { SOURCES } from "./source-config.js";
import { logger } from "../lib/logger.js";

const MAX_CONCURRENCY = 5;

class Semaphore {
  private running = 0;
  private queue: (() => void)[] = [];
  async acquire(): Promise<void> {
    if (this.running < MAX_CONCURRENCY) { this.running++; return; }
    return new Promise((r) => this.queue.push(r));
  }
  release(): void {
    const next = this.queue.shift();
    if (next) { next(); } else { this.running--; }
  }
  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try { return await fn(); } finally { this.release(); }
  }
}
const semaphore = new Semaphore();

async function withRetry<T>(fn: () => Promise<T>, label: string, maxRetries = 2): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const msg = e instanceof Error ? e.message : String(e);
      const isTransient = msg.includes("timeout") || msg.includes("ETIMEDOUT") || msg.includes("ECONNRESET") || msg.includes("socket") || msg.includes("fetch failed");
      if (!isTransient || attempt === maxRetries) break;
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
      logger.warn(`[Retry] ${label} attempt ${attempt + 1} failed, retrying in ${delay}ms: ${msg}`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw last;
}

import { scrapeGreenhouse } from "./adapters/greenhouse-adapter.js";
import { scrapeLever } from "./adapters/lever-adapter.js";
import { scrapeSmartRecruiters } from "./adapters/smartrecruiters-adapter.js";
import { scrapeWorkday } from "./adapters/workday-adapter.js";
import { scrapeHtml } from "./adapters/html-adapter.js";
import { scrapeRss } from "./adapters/rss-adapter.js";
import { scrapeSchema } from "./adapters/schema-adapter.js";

interface ScrapeRun {
  sourceId: string;
  sourceName: string;
  startedAt: Date;
  completedAt?: Date;
  results: number;
  errors: number;
  status: "running" | "completed" | "failed";
  error?: string;
}

const activeRuns = new Map<string, ScrapeRun>();

const ADAPTER_MAP: Record<string, (source: SourceConfig) => Promise<ScrapedOpportunity[]>> = {
  greenhouse: scrapeGreenhouse,
  lever: scrapeLever,
  smartrecruiters: scrapeSmartRecruiters,
  workday: scrapeWorkday,
  html: scrapeHtml,
  rss: scrapeRss,
  schema: scrapeSchema,
};

function detectAdapter(source: SourceConfig): string {
  const url = source.url.toLowerCase();
  if (url.includes("greenhouse.io")) return "greenhouse";
  if (url.includes("lever.co")) return "lever";
  if (url.includes("smartrecruiters")) return "smartrecruiters";
  if (url.includes("myworkdayjobs") || url.includes("wd1.myworkday") || url.includes("wd3.myworkday") || url.includes("wd5.myworkday")) return "workday";
  if (/\.xml$|rss|feed|atom/i.test(url)) return "rss";
  return source.type === "schema" ? "schema" : "html";
}

export async function runSingleSource(source: SourceConfig): Promise<ScrapedOpportunity[]> {
  const run: ScrapeRun = {
    sourceId: source.id,
    sourceName: source.name,
    startedAt: new Date(),
    results: 0,
    errors: 0,
    status: "running",
  };
  activeRuns.set(source.id, run);

  const adapterKey = detectAdapter(source);
  const scrapeFn = ADAPTER_MAP[adapterKey];

  if (!scrapeFn) {
    run.status = "failed";
    run.error = `No adapter for: ${adapterKey}`;
    activeRuns.set(source.id, run);
    return [];
  }

  try {
    const results = await withRetry(() => semaphore.run(() => scrapeFn(source)), source.name);
    run.results = results.length;
    run.status = "completed";
    run.completedAt = new Date();
    activeRuns.set(source.id, run);
    return results;
  } catch (e) {
    run.status = "failed";
    run.error = e instanceof Error ? e.message : String(e);
    run.completedAt = new Date();
    activeRuns.set(source.id, run);
    logger.error(`[Orchestrator] ${source.name}: ${run.error}`);
    return [];
  }
}

export async function runOrchestrator(batch: number | "all"): Promise<ScrapeResult[]> {
  const sources = batch === "all" ? SOURCES.filter((s) => s.active) : SOURCES.filter((s) => s.batch === batch && s.active);
  logger.info(`[Orchestrator] Running ${sources.length} sources (batch=${batch})`);

  const results: ScrapeResult[] = [];

  for (const source of sources) {
    try {
      const items = await runSingleSource(source);
      results.push({ source: source.id, success: true, count: items.length });
    } catch (e) {
      results.push({ source: source.id, success: false, count: 0, error: String(e) });
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  const ok = results.filter((r) => r.success).length;
  logger.info(`[Orchestrator] Done: ${ok}/${results.length} succeeded`);
  return results;
}

export function getActiveRuns(): Map<string, ScrapeRun> {
  return activeRuns;
}

export function getSourceById(id: string): SourceConfig | undefined {
  return SOURCES.find((s) => s.id === id);
}

export { SOURCES };
