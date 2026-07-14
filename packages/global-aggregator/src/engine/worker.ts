import type { WorkerConfig, QueueItem } from "../types";
import type { ScrapeQueue } from "./queue";

export class WorkerPool {
  private readonly config: WorkerConfig;
  private readonly queue: ScrapeQueue;
  private readonly processFn: (item: QueueItem) => Promise<void>;
  private activeWorkers = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private stopped = false;

  constructor(
    config: WorkerConfig,
    queue: ScrapeQueue,
    processFn: (item: QueueItem) => Promise<void>,
  ) {
    this.config = config;
    this.queue = queue;
    this.processFn = processFn;
  }

  start(): void {
    this.stopped = false;
    this.timer = setInterval(() => {
      this.poll();
    }, this.config.pollIntervalMs);
    this.poll();
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getStatus(): { active: number; idle: number; total: number } {
    const idle = this.config.concurrency - this.activeWorkers;
    return {
      active: this.activeWorkers,
      idle: idle > 0 ? idle : 0,
      total: this.config.concurrency,
    };
  }

  private poll(): void {
    if (this.stopped) return;

    while (this.activeWorkers < this.config.concurrency) {
      const item = this.queue.dequeue();
      if (!item) break;

      this.activeWorkers++;
      this.processItem(item).finally(() => {
        this.activeWorkers--;
        this.poll();
      });
    }
  }

  private async processItem(item: QueueItem): Promise<void> {
    try {
      await this.processFn(item);
      this.queue.ack(item.id);
    } catch (err) {
      const error =
        err instanceof Error ? err.message : String(err);
      this.queue.nack(item.id, error);
    }
  }
}
