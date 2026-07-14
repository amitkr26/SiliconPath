import type { NormalizedOpportunity } from "../types";
import { createHash } from "node:crypto";

interface SeenEntry {
  timestamp: number;
}

export class Deduplicator {
  private readonly seen = new Map<string, SeenEntry>();
  private totalSeen = 0;
  private duplicatesFound = 0;
  private readonly windowMs: number;

  constructor(windowHours: number = 168) {
    this.windowMs = windowHours * 3_600_000;
  }

  isDuplicate(item: NormalizedOpportunity): boolean {
    const key = this.computeHash(item);
    const entry = this.seen.get(key);
    if (!entry) return false;
    if (Date.now() - entry.timestamp > this.windowMs) {
      this.seen.delete(key);
      return false;
    }
    this.duplicatesFound++;
    return true;
  }

  markSeen(item: NormalizedOpportunity): void {
    const key = this.computeHash(item);
    this.seen.set(key, { timestamp: Date.now() });
    this.totalSeen++;
  }

  getStats(): { totalSeen: number; duplicatesFound: number } {
    return {
      totalSeen: this.totalSeen,
      duplicatesFound: this.duplicatesFound,
    };
  }

  clear(): void {
    this.seen.clear();
    this.totalSeen = 0;
    this.duplicatesFound = 0;
  }

  private computeHash(item: NormalizedOpportunity): string {
    const parts = [
      item.canonicalUrl ?? "",
      item.sourceUrl ?? "",
      item.title?.toLowerCase().trim() ?? "",
      item.organization?.toLowerCase().trim() ?? "",
    ];
    return createHash("sha256").update(parts.join("|")).digest("hex");
  }
}
