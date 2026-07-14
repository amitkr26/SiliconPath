import type { RateLimitConfig } from "../types";

interface WindowEntry {
  timestamps: number[];
}

export class RateLimiter {
  private readonly windows = new Map<string, WindowEntry>();

  tryAcquire(sourceId: string, limits: RateLimitConfig): boolean {
    const now = Date.now();
    const entry = this.getOrCreate(sourceId);
    this.prune(entry, now);

    const minuteCount = entry.timestamps.filter(
      (t) => now - t < 60_000,
    ).length;
    const hourCount = entry.timestamps.filter(
      (t) => now - t < 3_600_000,
    ).length;
    const dayCount = entry.timestamps.filter(
      (t) => now - t < 86_400_000,
    ).length;

    if (minuteCount >= limits.requestsPerMinute) return false;
    if (hourCount >= limits.requestsPerHour) return false;
    if (dayCount >= limits.requestsPerDay) return false;

    entry.timestamps.push(now);
    return true;
  }

  getWaitTime(sourceId: string, limits: RateLimitConfig): number {
    const now = Date.now();
    const entry = this.getOrCreate(sourceId);
    this.prune(entry, now);

    const minuteCount = entry.timestamps.filter(
      (t) => now - t < 60_000,
    ).length;
    const hourCount = entry.timestamps.filter(
      (t) => now - t < 3_600_000,
    ).length;
    const dayCount = entry.timestamps.filter(
      (t) => now - t < 86_400_000,
    ).length;

    if (minuteCount >= limits.requestsPerMinute) {
      const oldest = Math.min(
        ...entry.timestamps.filter((t) => now - t < 60_000),
      );
      return oldest + 60_000 - now;
    }
    if (hourCount >= limits.requestsPerHour) {
      const oldest = Math.min(
        ...entry.timestamps.filter((t) => now - t < 3_600_000),
      );
      return oldest + 3_600_000 - now;
    }
    if (dayCount >= limits.requestsPerDay) {
      const oldest = Math.min(
        ...entry.timestamps.filter((t) => now - t < 86_400_000),
      );
      return oldest + 86_400_000 - now;
    }

    return 0;
  }

  private getOrCreate(sourceId: string): WindowEntry {
    let entry = this.windows.get(sourceId);
    if (!entry) {
      entry = { timestamps: [] };
      this.windows.set(sourceId, entry);
    }
    return entry;
  }

  private prune(entry: WindowEntry, now: number): void {
    const cutoff = now - 86_400_000;
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
  }
}
