import type {
  NormalizedOpportunity,
  SearchQuery,
  SearchResult,
  SearchFacets,
  RecommendationContext,
  SearchAnalytics,
  IndexHealth,
  ParsedQuery,
  ClassificationLabel,
} from "../types";
import { FullTextIndex } from "./fulltext";
import { FacetedSearch } from "./faceted";
import { SuggestionEngine } from "./suggestions";
import { Autocomplete } from "./autocomplete";
import { BooleanQueryParser } from "./boolean-parser";
import { SynonymEngine } from "./synonyms";
import { DidYouMean } from "./did-you-mean";
import { RecommendationEngine } from "./recommendation";
import { TrendingTracker } from "./trending";
import { SearchAnalyticsEngine } from "./analytics";

export class SearchEngine {
  private readonly fullTextIndex: FullTextIndex;
  private readonly facetedSearch: FacetedSearch;
  private readonly suggestionEngine: SuggestionEngine;
  private readonly autocompleteEngine: Autocomplete;
  private readonly booleanParser: BooleanQueryParser;
  private readonly synonymEngine: SynonymEngine;
  private readonly didYouMean: DidYouMean;
  private readonly recommendationEngine: RecommendationEngine;
  private readonly trendingTracker: TrendingTracker;
  private readonly analytics: SearchAnalyticsEngine;

  constructor() {
    this.fullTextIndex = new FullTextIndex();
    this.facetedSearch = new FacetedSearch();
    this.suggestionEngine = new SuggestionEngine();
    this.autocompleteEngine = new Autocomplete(this.suggestionEngine);
    this.booleanParser = new BooleanQueryParser();
    this.synonymEngine = new SynonymEngine();
    this.didYouMean = new DidYouMean();
    this.recommendationEngine = new RecommendationEngine();
    this.trendingTracker = new TrendingTracker();
    this.analytics = new SearchAnalyticsEngine();
  }

  search(query: SearchQuery): SearchResult {
    const startTime = performance.now();
    const result = this.executeSearch(query);
    const searchTimeMs = Math.round(performance.now() - startTime);

    if (query.trackSearch !== false) {
      this.analytics.recordSearch(query, result.total, searchTimeMs);
      this.trendingTracker.recordSearchQuery(query.q);
    }

    return { ...result, searchTimeMs };
  }

  private executeSearch(query: SearchQuery): SearchResult {
    let parsedQuery: ParsedQuery | undefined;
    let queryText = query.q;
    let didYouMeanSuggestion: string | null = null;
    let correctedQuery: string | null = null;

    if (query.useBooleanSearch || query.usePhraseSearch || query.useFieldSearch) {
      parsedQuery = this.booleanParser.parse(query.q);
    }

    if (query.expandSynonyms && queryText.trim()) {
      queryText = this.synonymEngine.expand(queryText);
    }

    let candidates: NormalizedOpportunity[];
    let scores: Map<string, number> | undefined;

    if (parsedQuery?.hasBoolean) {
      scores = this.fullTextIndex.searchBoolean(parsedQuery);
      const sorted = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
      candidates = sorted
        .map(([id]) => this.fullTextIndex.getItems().get(id))
        .filter((item): item is NormalizedOpportunity => item !== undefined);
    } else if (parsedQuery?.hasPhrases && !parsedQuery.hasBoolean) {
      let combinedScores = new Map<string, number>();
      for (const phrase of parsedQuery.phrases) {
        const phraseScores = this.fullTextIndex.searchPhrase(phrase);
        for (const [id, score] of phraseScores) {
          combinedScores.set(id, (combinedScores.get(id) ?? 0) + score);
        }
      }
      const textOutsidePhrases = query.q.replace(/"[^"]+"/g, "").trim();
      if (textOutsidePhrases) {
        const textScores = this.fullTextIndex.search(textOutsidePhrases);
        for (const [id, score] of textScores) {
          combinedScores.set(id, (combinedScores.get(id) ?? 0) + score);
        }
      }
      scores = combinedScores;
      const sorted = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
      candidates = sorted
        .map(([id]) => this.fullTextIndex.getItems().get(id))
        .filter((item): item is NormalizedOpportunity => item !== undefined);
    } else if (parsedQuery?.hasFields && !parsedQuery.hasBoolean) {
      let combinedScores = new Map<string, number>();
      for (const fq of parsedQuery.fieldQueries) {
        const fieldScores = this.fullTextIndex.searchField(fq.field, fq.term);
        for (const [id, score] of fieldScores) {
          combinedScores.set(id, (combinedScores.get(id) ?? 0) + score);
        }
      }
      const textOutsideFields = query.q.replace(/\w+:\S+/g, "").trim();
      if (textOutsideFields) {
        const textScores = this.fullTextIndex.search(textOutsideFields);
        for (const [id, score] of textScores) {
          combinedScores.set(id, (combinedScores.get(id) ?? 0) + score);
        }
      }
      scores = combinedScores;
      const sorted = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
      candidates = sorted
        .map(([id]) => this.fullTextIndex.getItems().get(id))
        .filter((item): item is NormalizedOpportunity => item !== undefined);
    } else if (query.searchField && queryText.trim()) {
      scores = this.fullTextIndex.searchField(query.searchField, queryText);
    } else if (queryText.trim()) {
      scores = this.fullTextIndex.search(queryText);
    }

    if (scores && scores.size > 0) {
      const sorted = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
      const minScore = sorted.length > 0 ? sorted[sorted.length - 1][1] * 0.01 : 0;
      candidates = sorted
        .filter(([, score]) => score > minScore)
        .map(([id]) => this.fullTextIndex.getItems().get(id))
        .filter((item): item is NormalizedOpportunity => item !== undefined);
    } else if (query.searchField || parsedQuery?.hasBoolean || parsedQuery?.hasPhrases || parsedQuery?.hasFields) {
      candidates = [];
    } else if (queryText.trim() && query.suggestCorrections !== false) {
      const correction = this.didYouMean.correct(query.q);
      if (correction) {
        didYouMeanSuggestion = correction;
        correctedQuery = correction;
        const correctedScores = this.fullTextIndex.search(correction);
        const correctedSorted = Array.from(correctedScores.entries()).sort((a, b) => b[1] - a[1]);
        candidates = correctedSorted
          .map(([id]) => this.fullTextIndex.getItems().get(id))
          .filter((item): item is NormalizedOpportunity => item !== undefined);
        scores = correctedScores;
      } else {
        candidates = [];
      }
    } else {
      candidates = Array.from(this.fullTextIndex.getItems().values());
    }

    const filtered = this.applyFilters(candidates, query);
    const sorted = this.applySorting(filtered, query, scores);

    const total = sorted.length;
    const start = query.page * query.pageSize;
    const paged = sorted.slice(start, start + query.pageSize);

    const facets = this.facetedSearch.getFacets(filtered);

    let suggestions: string[] = [];
    if (query.q.trim()) {
      suggestions = this.autocompleteEngine.complete(query.q);
    }

    return {
      items: paged,
      total,
      page: query.page,
      pageSize: query.pageSize,
      facets,
      suggestions,
      didYouMean: didYouMeanSuggestion,
      correctedQuery,
      parsedQuery,
      searchTimeMs: 0,
      totalResults: total,
    };
  }

  // =========================================================================
  // Index Management
  // =========================================================================

  indexItems(items: NormalizedOpportunity[]): void {
    const startTime = performance.now();
    this.fullTextIndex.index(items);
    this.recommendationEngine.indexItems(items);
    this.trendingTracker.indexItems(items);
    for (const item of items) {
      this.suggestionEngine.addTerm(item.title);
      this.suggestionEngine.addTerm(item.organization);
      for (const skill of item.skills) this.suggestionEngine.addTerm(skill);
      for (const tag of item.tags) this.suggestionEngine.addTerm(tag);
    }
    const terms = new Set<string>();
    for (const item of items) {
      for (const token of this.fullTextIndex.tokenize(item.title + " " + item.description + " " + item.skills.join(" "))) {
        terms.add(token);
      }
    }
    this.didYouMean.addTerms(Array.from(terms));
  }

  addItem(item: NormalizedOpportunity): void {
    this.fullTextIndex.add(item);
    this.recommendationEngine.indexItems([item]);
    this.trendingTracker.indexItems([item]);
    this.suggestionEngine.addTerm(item.title);
    this.suggestionEngine.addTerm(item.organization);
    for (const skill of item.skills) this.suggestionEngine.addTerm(skill);
  }

  removeItem(id: string): void {
    this.fullTextIndex.remove(id);
    this.recommendationEngine.removeItem(id);
  }

  // =========================================================================
  // Filters
  // =========================================================================

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
      if (query.cities && query.cities.length > 0) {
        if (!query.cities.includes(item.city)) return false;
      }
      if (query.states && query.states.length > 0) {
        if (!query.states.includes(item.state)) return false;
      }
      if (query.organizations && query.organizations.length > 0) {
        if (!query.organizations.includes(item.organization)) return false;
      }
      if (query.universities && query.universities.length > 0) {
        if (!query.universities.includes(item.organization)) return false;
      }
      if (query.companies && query.companies.length > 0) {
        if (!query.companies.includes(item.organization)) return false;
      }
      if (query.researchLabs && query.researchLabs.length > 0) {
        if (!query.researchLabs.includes(item.organization)) return false;
      }
      if (query.skills && query.skills.length > 0) {
        const itemSkillsLower = new Set(item.skills.map((s) => s.toLowerCase()));
        if (!query.skills.every((s) => itemSkillsLower.has(s.toLowerCase()))) return false;
      }
      if (query.tags && query.tags.length > 0) {
        const itemTagsLower = item.tags.map((t) => t.toLowerCase());
        if (!query.tags.some((t) => itemTagsLower.includes(t.toLowerCase()))) return false;
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
      if (query.employmentTypes && query.employmentTypes.length > 0) {
        if (!query.employmentTypes.includes(item.employmentType)) return false;
      }
      if (query.isRemote !== undefined) {
        if (query.isRemote && !item.isRemote) return false;
        if (!query.isRemote && item.isRemote) return false;
      }
      if (query.isGovernment !== undefined) {
        if (query.isGovernment !== item.isGovernment) return false;
      }
      if (query.isIndustry !== undefined) {
        const isIndustry = !item.isGovernment && item.categories.some((c) =>
          ["semiconductor-idm", "fabless", "equipment", "materials", "osat", "startup"].includes(c)
        );
        if (query.isIndustry !== isIndustry) return false;
      }
      if (query.isResearch !== undefined) {
        const isResearch = item.categories.some((c) =>
          c.startsWith("university") || c.startsWith("national-lab") || c === "research-lab"
        );
        if (query.isResearch !== isResearch) return false;
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
      if (query.postedBefore && item.postedDate) {
        if (item.postedDate > query.postedBefore) return false;
      }
      return true;
    });
  }

  // =========================================================================
  // Sorting
  // =========================================================================

  private applySorting(
    items: NormalizedOpportunity[],
    query: SearchQuery,
    scores?: Map<string, number>,
  ): NormalizedOpportunity[] {
    const sortBy = query.sortBy ?? "relevance";
    const sortOrder = query.sortOrder ?? "desc";
    const multiplier = sortOrder === "asc" ? 1 : -1;
    const sorted = [...items];

    sorted.sort((a, b) => {
      switch (sortBy) {
        case "relevance": {
          if (scores && scores.size > 0) {
            const aId = a.id ?? a.hash;
            const bId = b.id ?? b.hash;
            return ((scores.get(bId) ?? 0) - (scores.get(aId) ?? 0)) * multiplier;
          }
          return 0;
        }
        case "date": {
          const aDate = a.postedDate ?? a.scrapedAt ?? "";
          const bDate = b.postedDate ?? b.scrapedAt ?? "";
          return aDate.localeCompare(bDate) * multiplier;
        }
        case "deadline": {
          const aDl = a.deadline ?? "9999";
          const bDl = b.deadline ?? "9999";
          return aDl.localeCompare(bDl) * multiplier;
        }
        case "title": {
          return a.title.localeCompare(b.title) * multiplier;
        }
        case "organization": {
          return a.organization.localeCompare(b.organization) * multiplier;
        }
        case "salary": {
          const aSal = a.salaryMax ?? a.salaryMin ?? 0;
          const bSal = b.salaryMax ?? b.salaryMin ?? 0;
          return (aSal - bSal) * multiplier;
        }
        case "popularity": {
          return 0;
        }
        case "verified": {
          const aVerified = a.verificationStatus === "verified" ? 1 : 0;
          const bVerified = b.verificationStatus === "verified" ? 1 : 0;
          return (bVerified - aVerified) * multiplier;
        }
        default:
          return 0;
      }
    });

    return sorted;
  }

  // =========================================================================
  // Instant Search
  // =========================================================================

  instantSearch(query: string, limit = 5): NormalizedOpportunity[] {
    if (!query.trim()) return [];
    const scores = this.fullTextIndex.search(query);
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => this.fullTextIndex.getItems().get(id))
      .filter((item): item is NormalizedOpportunity => item !== undefined);
  }

  // =========================================================================
  // Autocomplete
  // =========================================================================

  getAutocomplete(prefix: string, limit = 10): string[] {
    return this.autocompleteEngine.complete(prefix).slice(0, limit);
  }

  recordAutocompleteSelection(term: string): void {
    this.autocompleteEngine.recordSelection(term);
  }

  // =========================================================================
  // Did-You-Mean
  // =========================================================================

  getDidYouMean(query: string): string | null {
    const terms = this.fullTextIndex.tokenize(query);
    this.didYouMean.addTerms(terms);
    return this.didYouMean.correct(query);
  }

  getSuggestions(query: string): string[] {
    const terms = this.fullTextIndex.tokenize(query);
    this.didYouMean.addTerms(terms);
    return this.didYouMean.suggest(query);
  }

  // =========================================================================
  // Synonym Expansion
  // =========================================================================

  expandQuery(query: string): string {
    return this.synonymEngine.expand(query);
  }

  // =========================================================================
  // Recommendations
  // =========================================================================

  getSimilar(opportunityId: string, limit = 10): NormalizedOpportunity[] {
    return this.recommendationEngine.getSimilar(opportunityId, limit);
  }

  getRecommended(context: RecommendationContext): NormalizedOpportunity[] {
    return this.recommendationEngine.getRecommended(context);
  }

  getBySkills(skills: string[], limit = 10): NormalizedOpportunity[] {
    return this.recommendationEngine.getBySkills(skills, limit);
  }

  getByCategories(categories: ClassificationLabel[], limit = 10): NormalizedOpportunity[] {
    return this.recommendationEngine.getByCategories(categories, limit);
  }

  getNew(limit = 10): NormalizedOpportunity[] {
    return this.recommendationEngine.getNew(limit);
  }

  // =========================================================================
  // Trending & Popular
  // =========================================================================

  getTrending(limit = 20): { id: string; title: string; organization: string; score: number }[] {
    return this.trendingTracker.getPopular(limit);
  }

  getTrendingSearches(limit = 20): { query: string; count: number }[] {
    return this.trendingTracker.getTrendingSearches(limit);
  }

  recordView(opportunityId: string): void {
    this.trendingTracker.recordView(opportunityId);
  }

  recordClick(opportunityId: string, organization: string, title: string, query: string): void {
    this.trendingTracker.recordClick(opportunityId);
    this.analytics.recordClick(opportunityId, organization, title, query);
  }

  // =========================================================================
  // Analytics
  // =========================================================================

  getAnalytics(): SearchAnalytics {
    return this.analytics.getAnalytics();
  }

  // =========================================================================
  // Index Health
  // =========================================================================

  getIndexHealth(): IndexHealth {
    const count = this.fullTextIndex.getItemCount();
    const totalTerms = this.fullTextIndex.getTotalTerms();
    const uniqueTerms = this.fullTextIndex.getUniqueTerms();
    const avgDocLength = count > 0
      ? Math.round(
          Array.from(this.fullTextIndex.getItems().keys())
            .reduce((sum, id) => sum + this.fullTextIndex.getDocLength(id), 0) / count
        )
      : 0;
    const maxHealth = 100;
    const docScore = Math.min(count * 10, 40);
    const termScore = uniqueTerms > 0 ? Math.min(uniqueTerms * 2, 30) : 0;
    const avgLenScore = avgDocLength > 0 ? Math.min(avgDocLength / 5, 30) : 0;
    const healthScore = Math.round(Math.min(docScore + termScore + avgLenScore, maxHealth));

    return {
      totalDocuments: count,
      totalTerms,
      uniqueTerms,
      averageDocumentLength: avgDocLength,
      lastIndexedAt: count > 0 ? new Date().toISOString() : null,
      indexedFields: ["title", "description", "requirements", "skills", "organization", "tags"],
      indexSizeBytes: 0,
      healthScore,
    };
  }
}
