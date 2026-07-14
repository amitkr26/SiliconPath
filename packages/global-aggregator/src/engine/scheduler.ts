import type { SchedulingConfig } from "../types";

export class Scheduler {
  private readonly schedules = new Map<string, SchedulingConfig>();
  private readonly lastRuns = new Map<string, number>();

  addJob(sourceId: string, config: SchedulingConfig): void {
    this.schedules.set(sourceId, config);
  }

  removeJob(sourceId: string): void {
    this.schedules.delete(sourceId);
    this.lastRuns.delete(sourceId);
  }

  getSchedule(): Map<string, SchedulingConfig> {
    return new Map(this.schedules);
  }

  getNextRun(sourceId: string): Date | null {
    const config = this.schedules.get(sourceId);
    if (!config) return null;

    const lastRun = this.lastRuns.get(sourceId) ?? 0;
    const intervalMs = this.parseInterval(config.interval);
    const nextMs = lastRun + intervalMs;

    if (nextMs <= Date.now()) {
      return new Date();
    }
    return new Date(nextMs);
  }

  markRun(sourceId: string): void {
    this.lastRuns.set(sourceId, Date.now());
  }

  private parseInterval(interval: string): number {
    const match = interval.match(/^(\d+)\s*(s|m|h|d)$/);
    if (!match) return 3_600_000;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "s":
        return value * 1_000;
      case "m":
        return value * 60_000;
      case "h":
        return value * 3_600_000;
      case "d":
        return value * 86_400_000;
      default:
        return 3_600_000;
    }
  }
}
