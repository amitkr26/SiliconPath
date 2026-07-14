import type { NormalizedOpportunity } from "../types";

interface TrendingEntry {
  id: string;
  title: string;
  organization: string;
  score: number;
  clicks: number;
  views: number;
  lastUpdated: number;
}

interface SearchTrendEntry {
  query: string;
  count: number;
  lastSearched: number;
}

export class TrendingTracker {
  private readonly trending = new Map<string, TrendingEntry>();
  private readonly searchTrends = new Map<string, SearchTrendEntry>();
  private readonly decayHalfLife = 24 * 60 * 60 * 1000;

  recordView(opportunityId: string): void {
    const entry = this.trending.get(opportunityId);
    if (entry) {
      entry.views++;
      entry.score = this.computeScore(entry.views, entry.clicks, entry.lastUpdated);
      entry.lastUpdated = Date.now();
    }
  }

  recordClick(opportunityId: string): void {
    const entry = this.trending.get(opportunityId);
    if (entry) {
      entry.clicks++;
      entry.score = this.computeScore(entry.views, entry.clicks, entry.lastUpdated);
      entry.lastUpdated = Date.now();
    }
  }

  recordSearchQuery(query: string): void {
    const lower = query.toLowerCase().trim();
    if (!lower || lower.length < 2) return;
    const existing = this.searchTrends.get(lower);
    if (existing) {
      existing.count++;
      existing.lastSearched = Date.now();
    } else {
      this.searchTrends.set(lower, { query: lower, count: 1, lastSearched: Date.now() });
    }
  }

  indexItems(items: NormalizedOpportunity[]): void {
    for (const item of items) {
      const id = item.id ?? item.hash;
      if (!this.trending.has(id)) {
        this.trending.set(id, {
          id,
          title: item.title,
          organization: item.organization,
          score: 0,
          clicks: 0,
          views: 0,
          lastUpdated: Date.now(),
        });
      }
    }
  }

  getTrendingOpportunities(limit = 20): TrendingEntry[] {
    const now = Date.now();
    return Array.from(this.trending.values())
      .map((entry) => {
        const ageHours = (now - entry.lastUpdated) / this.decayHalfLife;
        const decayedScore = entry.score * Math.pow(0.5, ageHours);
        return { ...entry, score: decayedScore };
      })
      .filter((e) => e.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  getTrendingSearches(limit = 20): { query: string; count: number }[] {
    const now = Date.now();
    return Array.from(this.searchTrends.values())
      .map((entry) => {
        const ageHours = (now - entry.lastSearched) / this.decayHalfLife;
        const decayedCount = entry.count * Math.pow(0.5, ageHours);
        return { query: entry.query, count: Math.round(decayedCount) };
      })
      .filter((e) => e.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getPopular(limit = 20): { id: string; title: string; organization: string; score: number }[] {
    return this.getTrendingOpportunities(limit).map((e) => ({
      id: e.id,
      title: e.title,
      organization: e.organization,
      score: Math.round(e.score * 100) / 100,
    }));
  }

  reset(): void {
    this.trending.clear();
    this.searchTrends.clear();
  }

  private computeScore(views: number, clicks: number, lastUpdated: number): number {
    const now = Date.now();
    const ageHours = (now - lastUpdated) / this.decayHalfLife;
    const baseScore = views + clicks * 3;
    return baseScore * Math.pow(0.5, ageHours);
  }
}
