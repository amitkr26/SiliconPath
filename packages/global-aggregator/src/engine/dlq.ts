import type { QueueItem } from "../types";

export class DeadLetterQueue {
  private readonly items: QueueItem[] = [];

  send(item: QueueItem, error: string): void {
    item.status = "dlq";
    item.lastError = error;
    item.updatedAt = new Date().toISOString();
    this.items.push(item);
  }

  replay(id: string): QueueItem | null {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    const [item] = this.items.splice(idx, 1);
    item.status = "queued";
    item.attempts = 0;
    item.lastError = null;
    item.updatedAt = new Date().toISOString();
    return item;
  }

  replayAll(): QueueItem[] {
    const replayed = this.items.splice(0, this.items.length);
    for (const item of replayed) {
      item.status = "queued";
      item.attempts = 0;
      item.lastError = null;
      item.updatedAt = new Date().toISOString();
    }
    return replayed;
  }

  getItems(): QueueItem[] {
    return [...this.items];
  }

  getDepth(): number {
    return this.items.length;
  }

  purge(): void {
    this.items.length = 0;
  }
}
