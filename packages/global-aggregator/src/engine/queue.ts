import type { QueueItem } from "../types";
import { DeadLetterQueue } from "./dlq";

export class ScrapeQueue {
  private readonly queue: QueueItem[] = [];
  private readonly processing = new Map<string, QueueItem>();
  private readonly completed = new Map<string, QueueItem>();
  private readonly failed = new Map<string, QueueItem>();
  private readonly dlq: DeadLetterQueue;

  constructor(dlq?: DeadLetterQueue) {
    this.dlq = dlq ?? new DeadLetterQueue();
  }

  enqueue(item: QueueItem): void {
    this.queue.push(item);
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  dequeue(): QueueItem | null {
    const item = this.queue.shift();
    if (!item) return null;
    item.status = "processing";
    item.updatedAt = new Date().toISOString();
    this.processing.set(item.id, item);
    return item;
  }

  peek(): QueueItem | null {
    return this.queue[0] ?? null;
  }

  ack(id: string): void {
    const item = this.processing.get(id);
    if (!item) return;
    item.status = "completed";
    item.updatedAt = new Date().toISOString();
    this.completed.set(id, item);
    this.processing.delete(id);
  }

  nack(id: string, error: string): void {
    const item = this.processing.get(id);
    if (!item) return;
    item.attempts += 1;
    item.lastError = error;
    item.updatedAt = new Date().toISOString();

    if (item.attempts >= item.maxAttempts) {
      item.status = "dlq";
      this.dlq.send(item, error);
      this.processing.delete(id);
    } else {
      item.status = "queued";
      this.processing.delete(id);
      this.enqueue(item);
    }
  }

  getDepth(): number {
    return this.queue.length;
  }

  getDLQ(): DeadLetterQueue {
    return this.dlq;
  }

  getStatus(): {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    dlq: number;
  } {
    return {
      queued: this.queue.length,
      processing: this.processing.size,
      completed: this.completed.size,
      failed: this.failed.size,
      dlq: this.dlq.getDepth(),
    };
  }
}
