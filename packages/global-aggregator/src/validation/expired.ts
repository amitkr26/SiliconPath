import type { NormalizedOpportunity } from "../types";

export class ExpiredDetector {
  isExpired(deadline: string | null): boolean {
    if (!deadline) return false;

    const date = new Date(deadline);
    if (Number.isNaN(date.getTime())) return false;

    return date.getTime() < Date.now();
  }

  filterExpired(items: NormalizedOpportunity[]): NormalizedOpportunity[] {
    return items.filter((item) => !this.isExpired(item.deadline));
  }
}
