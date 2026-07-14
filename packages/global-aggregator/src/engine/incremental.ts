export class IncrementalCrawler {
  private readonly lastCrawlTimes = new Map<string, number>();

  shouldCrawl(
    sourceId: string,
    lastScrapedAt: string | null,
    interval: string,
  ): boolean {
    if (!lastScrapedAt) return true;

    const lastTs = this.lastCrawlTimes.get(sourceId);
    if (!lastTs) return true;

    const intervalMs = this.parseInterval(interval);
    const nextRunAt = lastTs + intervalMs;

    return Date.now() >= nextRunAt;
  }

  updateLastCrawl(sourceId: string): void {
    this.lastCrawlTimes.set(sourceId, Date.now());
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
