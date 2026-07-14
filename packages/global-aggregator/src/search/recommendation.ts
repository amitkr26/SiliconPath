import type { NormalizedOpportunity, ClassificationLabel, RecommendationContext } from "../types";
import { FullTextIndex } from "./fulltext";

const SIMILARITY_FIELD_WEIGHTS = {
  title: 4,
  skills: 3,
  organization: 2,
  categories: 2,
  description: 1,
  tags: 1,
};

export class RecommendationEngine {
  private items = new Map<string, NormalizedOpportunity>();
  private alreadyRecommended = new Set<string>();

  indexItems(opportunities: NormalizedOpportunity[]): void {
    for (const item of opportunities) {
      const id = item.id ?? item.hash;
      this.items.set(id, item);
    }
  }

  getSimilar(opportunityId: string, limit = 10): NormalizedOpportunity[] {
    const source = this.items.get(opportunityId);
    if (!source) return [];

    const scored = Array.from(this.items.values())
      .filter((item) => (item.id ?? item.hash) !== opportunityId)
      .map((item) => ({
        item,
        score: this.computeSimilarity(source, item),
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    this.alreadyRecommended.add(opportunityId);
    for (const s of scored) {
      this.alreadyRecommended.add(s.item.id ?? s.item.hash);
    }

    return scored.map((s) => s.item);
  }

  getRecommended(context: RecommendationContext): NormalizedOpportunity[] {
    const limit = context.limit ?? 10;
    const candidates = Array.from(this.items.values())
      .filter((item) => {
        const id = item.id ?? item.hash;
        return !this.alreadyRecommended.has(id)
          && !(context.viewedIds ?? []).includes(id)
          && !(context.savedIds ?? []).includes(id)
          && !(context.appliedIds ?? []).includes(id);
      });

    const scored = candidates.map((item) => ({
      item,
      score: this.computeRelevanceScore(item, context),
    }));

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.item);
  }

  getBySkills(skills: string[], limit = 10): NormalizedOpportunity[] {
    const skillSet = new Set(skills.map((s) => s.toLowerCase()));
    const scored = Array.from(this.items.values())
      .map((item) => {
        const itemSkills = item.skills.map((s) => s.toLowerCase());
        const matchCount = itemSkills.filter((s) => skillSet.has(s)).length;
        return { item, score: matchCount > 0 ? matchCount / Math.max(skillSet.size, 1) : 0 };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return scored.map((s) => s.item);
  }

  getByCategories(categories: ClassificationLabel[], limit = 10): NormalizedOpportunity[] {
    const catSet = new Set(categories);
    const scored = Array.from(this.items.values())
      .map((item) => {
        const matchCount = item.categories.filter((c) => catSet.has(c)).length;
        return { item, score: matchCount > 0 ? matchCount / Math.max(catSet.size, 1) : 0 };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return scored.map((s) => s.item);
  }

  getBySearchHistory(searchTerms: string[], limit = 10): NormalizedOpportunity[] {
    const index = new FullTextIndex();
    index.index(Array.from(this.items.values()));
    const scored = new Map<string, { item: NormalizedOpportunity; score: number }>();
    for (const term of searchTerms) {
      const results = index.search(term);
      for (const [id, score] of results) {
        const existing = scored.get(id);
        if (existing) {
          existing.score += score;
        } else {
          const item = this.items.get(id);
          if (item) scored.set(id, { item, score });
        }
      }
    }
    return Array.from(scored.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.item);
  }

  getNew(limit = 10): NormalizedOpportunity[] {
    return Array.from(this.items.values())
      .filter((item) => item.scrapedAt !== null)
      .sort((a, b) => {
        if (!a.scrapedAt) return 1;
        if (!b.scrapedAt) return -1;
        return b.scrapedAt.localeCompare(a.scrapedAt);
      })
      .slice(0, limit);
  }

  resetAlreadyRecommended(): void {
    this.alreadyRecommended.clear();
  }

  removeItem(id: string): void {
    this.items.delete(id);
  }

  private computeSimilarity(a: NormalizedOpportunity, b: NormalizedOpportunity): number {
    let score = 0;
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();
    const aTokens = new Set(aTitle.split(/\s+/));
    const bTokens = new Set(bTitle.split(/\s+/));

    const sharedTitle = new Set([...aTokens].filter((t) => bTokens.has(t)));
    score += (sharedTitle.size / Math.max(aTokens.size + bTokens.size - sharedTitle.size, 1)) * SIMILARITY_FIELD_WEIGHTS.title;

    const aSkills = new Set(a.skills.map((s) => s.toLowerCase()));
    const bSkills = new Set(b.skills.map((s) => s.toLowerCase()));
    const sharedSkills = new Set([...aSkills].filter((s) => bSkills.has(s)));
    score += (sharedSkills.size / Math.max(Math.min(aSkills.size, bSkills.size), 1)) * SIMILARITY_FIELD_WEIGHTS.skills;

    if (a.organization.toLowerCase() === b.organization.toLowerCase()) {
      score += SIMILARITY_FIELD_WEIGHTS.organization;
    }

    const aCats = new Set(a.categories);
    const bCats = new Set(b.categories);
    const sharedCats = new Set([...aCats].filter((c) => bCats.has(c)));
    score += (sharedCats.size / Math.max(Math.min(aCats.size, bCats.size), 1)) * SIMILARITY_FIELD_WEIGHTS.categories;

    if (a.type === b.type) score += 0.5;
    if (a.country === b.country && a.country) score += 0.3;
    if (a.workMode === b.workMode && a.workMode !== "unknown") score += 0.2;
    if (a.educationLevel === b.educationLevel && a.educationLevel !== "any") score += 0.2;
    if (a.experienceLevel === b.experienceLevel && a.experienceLevel !== "any") score += 0.2;

    return score;
  }

  private computeRelevanceScore(item: NormalizedOpportunity, context: RecommendationContext): number {
    let score = 0;

    if (context.skills && context.skills.length > 0) {
      const itemSkills = new Set(item.skills.map((s) => s.toLowerCase()));
      const matchCount = context.skills.filter((s) => itemSkills.has(s.toLowerCase())).length;
      score += (matchCount / context.skills.length) * 5;
    }

    if (context.resumeSkills && context.resumeSkills.length > 0) {
      const itemSkills = new Set(item.skills.map((s) => s.toLowerCase()));
      const matchCount = context.resumeSkills.filter((s) => itemSkills.has(s.toLowerCase())).length;
      score += (matchCount / context.resumeSkills.length) * 8;
    }

    if (context.interests && context.interests.length > 0) {
      const itemCats = new Set(item.categories);
      const matchCount = context.interests.filter((c) => itemCats.has(c)).length;
      score += (matchCount / context.interests.length) * 4;
    }

    if (context.categories && context.categories.length > 0) {
      const itemCats = new Set(item.categories);
      const matchCount = context.categories.filter((c) => itemCats.has(c)).length;
      score += (matchCount / context.categories.length) * 3;
    }

    if (context.countries && context.countries.length > 0) {
      if (context.countries.includes(item.country)) score += 2;
    }

    if (context.searchHistory && context.searchHistory.length > 0) {
      const text = `${item.title} ${item.description} ${item.skills.join(" ")}`.toLowerCase();
      for (const term of context.searchHistory) {
        if (text.includes(term.toLowerCase())) score += 0.5;
      }
    }

    return score;
  }
}
