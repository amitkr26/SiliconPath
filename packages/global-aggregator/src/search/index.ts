import type {
  NormalizedOpportunity,
  SearchQuery,
  SearchResult,
  SearchFacets,
} from "../types";
import { FullTextIndex } from "./fulltext";
import { FacetedSearch } from "./faceted";
import { SuggestionEngine } from "./suggestions";
import { Autocomplete } from "./autocomplete";

export class SearchEngine {
  private readonly fullTextIndex: FullTextIndex;
  private readonly facetedSearch: FacetedSearch;
  private readonly suggestionEngine: SuggestionEngine;
  private readonly autocomplete: Autocomplete;
  private readonly items = new Map<string, NormalizedOpportunity>();

  constructor(
    fullTextIndex?: FullTextIndex,
    facetedSearch?: FacetedSearch,
    suggestionEngine?: SuggestionEngine,
    autocomplete?: Autocomplete,
  ) {
    this.fullTextIndex = fullTextIndex ?? new FullTextIndex();
    this.facetedSearch = facetedSearch ?? new FacetedSearch();
    this.suggestionEngine = suggestionEngine ?? new SuggestionEngine();
    this.autocomplete = autocomplete ?? new Autocomplete(this.suggestionEngine);
  }

  search(query: SearchQuery): SearchResult {
    let candidates: NormalizedOpportunity[];

    if (query.q.trim()) {
      const scores = this.fullTextIndex.search(query.q);
      const sorted = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
      candidates = sorted
        .map(([id]) => this.items.get(id))
        .filter((item): item is NormalizedOpportunity => item !== undefined);
    } else {
      candidates = Array.from(this.items.values());
    }

    const filtered = this.applyFilters(candidates, query);
    const sorted = this.applySorting(filtered, query);

    const total = sorted.length;
    const start = query.page * query.pageSize;
    const paged = sorted.slice(start, start + query.pageSize);

    const facets = this.facetedSearch.getFacets(filtered);

    const suggestions = query.q.trim()
      ? this.autocomplete.complete(query.q)
      : [];

    return {
      items: paged,
      total,
      page: query.page,
      pageSize: query.pageSize,
      facets,
      suggestions,
    };
  }

  indexItems(items: NormalizedOpportunity[]): void {
    this.items.clear();
    for (const item of items) {
      const id = item.id ?? item.hash;
      this.items.set(id, item);
    }
    this.fullTextIndex.index(items);
  }

  addItem(item: NormalizedOpportunity): void {
    const id = item.id ?? item.hash;
    this.items.set(id, item);
    this.fullTextIndex.add(item);
  }

  removeItem(id: string): void {
    this.items.delete(id);
    this.fullTextIndex.remove(id);
  }

  private applyFilters(
    items: NormalizedOpportunity[],
    query: SearchQuery,
  ): NormalizedOpportunity[] {
    return items.filter((item) => {
      if (query.types && query.types.length > 0) {
        if (!query.types.includes(item.type)) return false;
      }

      if (query.categories && query.categories.length > 0) {
        if (!query.categories.some((c) => item.categories.includes(c))) return false;
      }

      if (query.countries && query.countries.length > 0) {
        if (!query.countries.includes(item.country)) return false;
      }

      if (query.skills && query.skills.length > 0) {
        const itemSkillsLower = item.skills.map((s) => s.toLowerCase());
        if (!query.skills.some((s) => itemSkillsLower.includes(s.toLowerCase()))) return false;
      }

      if (query.educationLevel && query.educationLevel !== "any") {
        if (item.educationLevel !== "any" && item.educationLevel !== query.educationLevel) return false;
      }

      if (query.experienceLevel && query.experienceLevel !== "any") {
        if (item.experienceLevel !== "any" && item.experienceLevel !== query.experienceLevel) return false;
      }

      if (query.workMode && query.workMode !== "unknown") {
        if (item.workMode !== "unknown" && item.workMode !== query.workMode) return false;
      }

      if (query.isRemote !== undefined) {
        if (query.isRemote && !item.isRemote) return false;
        if (!query.isRemote && item.isRemote) return false;
      }

      if (query.isGovernment !== undefined) {
        if (query.isGovernment !== item.isGovernment) return false;
      }

      if (query.salaryMin !== undefined && item.salaryMax !== null) {
        if (item.salaryMax < query.salaryMin) return false;
      }

      if (query.salaryMax !== undefined && item.salaryMin !== null) {
        if (item.salaryMin > query.salaryMax) return false;
      }

      if (query.deadlineBefore && item.deadline) {
        if (item.deadline > query.deadlineBefore) return false;
      }

      if (query.deadlineAfter && item.deadline) {
        if (item.deadline < query.deadlineAfter) return false;
      }

      if (query.postedAfter && item.postedDate) {
        if (item.postedDate < query.postedAfter) return false;
      }

      return true;
    });
  }

  private applySorting(
    items: NormalizedOpportunity[],
    query: SearchQuery,
  ): NormalizedOpportunity[] {
    const sortBy = query.sortBy ?? "relevance";
    const sortOrder = query.sortOrder ?? "desc";
    const multiplier = sortOrder === "asc" ? 1 : -1;

    const scores = query.q.trim()
      ? this.fullTextIndex.search(query.q)
      : new Map<string, number>();

    const sorted = [...items];

    sorted.sort((a, b) => {
      switch (sortBy) {
        case "relevance": {
          const aId = a.id ?? a.hash;
          const bId = b.id ?? b.hash;
          const aScore = scores.get(aId) ?? 0;
          const bScore = scores.get(bId) ?? 0;
          return (bScore - aScore) * multiplier;
        }
        case "date": {
          const aDate = a.postedDate ?? "";
          const bDate = b.postedDate ?? "";
          return aDate.localeCompare(bDate) * multiplier;
        }
        case "deadline": {
          const aDl = a.deadline ?? "9999";
          const bDl = b.deadline ?? "9999";
          return aDl.localeCompare(bDl) * multiplier;
        }
        case "salary": {
          const aSal = a.salaryMax ?? a.salaryMin ?? 0;
          const bSal = b.salaryMax ?? b.salaryMin ?? 0;
          return (aSal - bSal) * multiplier;
        }
        default:
          return 0;
      }
    });

    return sorted;
  }
}
