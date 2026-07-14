import type { SearchAnalytics, SearchQuery } from "../types";

interface QueryRecord {
  query: string;
  timestamp: number;
  resultsCount: number;
  searchTimeMs: number;
  filters: { filter: string; value: string }[];
  userId?: string;
  sessionId?: string;
}

interface ClickRecord {
  opportunityId: string;
  organization: string;
  title: string;
  timestamp: number;
  query: string;
}

export class SearchAnalyticsEngine {
  private queryLog: QueryRecord[] = [];
  private clickLog: ClickRecord[] = [];
  private maxLogSize = 10000;

  recordSearch(query: SearchQuery, resultsCount: number, searchTimeMs: number): void {
    const filters: { filter: string; value: string }[] = [];
    if (query.types?.length) filters.push({ filter: "type", value: query.types.join(",") });
    if (query.categories?.length) filters.push({ filter: "category", value: query.categories.join(",") });
    if (query.countries?.length) filters.push({ filter: "country", value: query.countries.join(",") });
    if (query.cities?.length) filters.push({ filter: "city", value: query.cities.join(",") });
    if (query.organizations?.length) filters.push({ filter: "organization", value: query.organizations.join(",") });
    if (query.skills?.length) filters.push({ filter: "skill", value: query.skills.join(",") });
    if (query.workMode) filters.push({ filter: "workMode", value: query.workMode });
    if (query.educationLevel) filters.push({ filter: "educationLevel", value: query.educationLevel });
    if (query.experienceLevel) filters.push({ filter: "experienceLevel", value: query.experienceLevel });

    this.queryLog.push({
      query: query.q,
      timestamp: Date.now(),
      resultsCount,
      searchTimeMs,
      filters,
      userId: query.userId,
      sessionId: query.sessionId,
    });

    if (this.queryLog.length > this.maxLogSize) {
      this.queryLog.splice(0, this.queryLog.length - this.maxLogSize);
    }
  }

  recordClick(opportunityId: string, organization: string, title: string, query: string): void {
    this.clickLog.push({ opportunityId, organization, title, timestamp: Date.now(), query });
    if (this.clickLog.length > this.maxLogSize) {
      this.clickLog.splice(0, this.clickLog.length - this.maxLogSize);
    }
  }

  getAnalytics(): SearchAnalytics {
    const totalSearches = this.queryLog.length;
    const uniqueQueries = new Set(this.queryLog.map((r) => r.query.toLowerCase().trim())).size;
    const failed = this.queryLog.filter((r) => r.resultsCount === 0);
    const avgTime = totalSearches > 0
      ? Math.round(this.queryLog.reduce((s, r) => s + r.searchTimeMs, 0) / totalSearches)
      : 0;

    const queryCounts = new Map<string, number>();
    for (const r of this.queryLog) {
      const q = r.query.toLowerCase().trim();
      queryCounts.set(q, (queryCounts.get(q) ?? 0) + 1);
    }
    const popular = Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const zeroResultCounts = new Map<string, number>();
    for (const r of failed) {
      const q = r.query.toLowerCase().trim();
      zeroResultCounts.set(q, (zeroResultCounts.get(q) ?? 0) + 1);
    }
    const zeroResultQueries = Array.from(zeroResultCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const filterCounts = new Map<string, Map<string, number>>();
    for (const r of this.queryLog) {
      for (const f of r.filters) {
        if (!filterCounts.has(f.filter)) filterCounts.set(f.filter, new Map());
        const inner = filterCounts.get(f.filter)!;
        for (const val of f.value.split(",")) {
          inner.set(val, (inner.get(val) ?? 0) + 1);
        }
      }
    }
    const topFilters: { filter: string; value: string; count: number }[] = [];
    for (const [filter, values] of filterCounts) {
      for (const [value, count] of values) {
        topFilters.push({ filter, value, count });
      }
    }
    topFilters.sort((a, b) => b.count - a.count);
    const topFiltersTrimmed = topFilters.slice(0, 20);

    const clickCounts = new Map<string, { opportunityId: string; organization: string; title: string; count: number }>();
    for (const c of this.clickLog) {
      const key = c.opportunityId;
      const existing = clickCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        clickCounts.set(key, { opportunityId: c.opportunityId, organization: c.organization, title: c.title, count: 1 });
      }
    }
    const topClicks = Array.from(clickCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      totalSearches,
      uniqueQueries,
      failedSearches: failed.length,
      averageSearchTimeMs: avgTime,
      popularQueries: popular,
      zeroResultQueries,
      topFilters: topFiltersTrimmed,
      topClicks,
    };
  }

  clear(): void {
    this.queryLog = [];
    this.clickLog = [];
  }
}
