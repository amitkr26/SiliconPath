import type { ScrapeResult, SourceConfig } from "../types";
import type { ScrapeQueue } from "./queue";
import { DeadLetterQueue } from "./dlq";
import { RetryHandler } from "./retry";
import { RateLimiter } from "./rate-limiter";
import { WorkerPool } from "./worker";
import { Scheduler } from "./scheduler";
import { EngineHealth } from "./health";
import { IncrementalCrawler } from "./incremental";

export interface EngineStatus {
  running: boolean;
  queueDepth: number;
  dlqDepth: number;
  workers: { active: number; idle: number; total: number };
  health: {
    healthy: number;
    degraded: number;
    unhealthy: number;
    unknown: number;
    total: number;
  };
}

export class ScrapeEngine {
  private running = false;
  private readonly queue: ScrapeQueue;
  private readonly dlq: DeadLetterQueue;
  private readonly retry: RetryHandler;
  private readonly rateLimiter: RateLimiter;
  private readonly workers: WorkerPool;
  private readonly scheduler: Scheduler;
  private readonly health: EngineHealth;
  private readonly incremental: IncrementalCrawler;
  private readonly processSource: (
    sourceId: string,
  ) => Promise<ScrapeResult>;

  constructor(opts: {
    queue: ScrapeQueue;
    dlq: DeadLetterQueue;
    retry: RetryHandler;
    rateLimiter: RateLimiter;
    workers: WorkerPool;
    scheduler: Scheduler;
    health: EngineHealth;
    incremental: IncrementalCrawler;
    processSource: (sourceId: string) => Promise<ScrapeResult>;
  }) {
    this.queue = opts.queue;
    this.dlq = opts.dlq;
    this.retry = opts.retry;
    this.rateLimiter = opts.rateLimiter;
    this.workers = opts.workers;
    this.scheduler = opts.scheduler;
    this.health = opts.health;
    this.incremental = opts.incremental;
    this.processSource = opts.processSource;
  }

  start(): void {
    this.running = true;
    this.workers.start();
  }

  stop(): void {
    this.running = false;
    this.workers.stop();
  }

  async scrapeSource(sourceId: string): Promise<ScrapeResult> {
    const start = Date.now();
    let attempts = 0;
    const maxAttempts = 3;
    let lastError: string | null = null;

    while (attempts < maxAttempts) {
      try {
        const result = await this.processSource(sourceId);
        this.health.recordSuccess(sourceId, Date.now() - start);
        this.incremental.updateLastCrawl(sourceId);
        this.scheduler.markRun(sourceId);
        return result;
      } catch (err) {
        attempts++;
        lastError = err instanceof Error ? err.message : String(err);

        if (!this.retry.shouldRetry(attempts, maxAttempts)) break;

        const delay = this.retry.getDelay(attempts - 1, 1_000, 30_000, 2);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    this.health.recordFailure(sourceId, lastError ?? "unknown error");

    return {
      jobId: "",
      sourceId,
      sourceName: "",
      success: false,
      count: 0,
      errors: lastError ? [lastError] : ["unknown error"],
      durationMs: Date.now() - start,
      items: [],
      timestamp: new Date().toISOString(),
    };
  }

  getStatus(): EngineStatus {
    return {
      running: this.running,
      queueDepth: this.queue.getDepth(),
      dlqDepth: this.dlq.getDepth(),
      workers: this.workers.getStatus(),
      health: this.health.getAggregateHealth(),
    };
  }
}

export { ScrapeQueue } from "./queue";
export { DeadLetterQueue } from "./dlq";
export { RetryHandler } from "./retry";
export { RateLimiter } from "./rate-limiter";
export { WorkerPool } from "./worker";
export { Scheduler } from "./scheduler";
export { EngineHealth } from "./health";
export { IncrementalCrawler } from "./incremental";
