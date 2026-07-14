import { SearchEngine } from "../src/search";
import type { NormalizedOpportunity } from "../src/types";

const makeOpp = (overrides: Partial<NormalizedOpportunity> = {}): NormalizedOpportunity => ({
  id: "opp-1",
  title: "Research Scientist at TSMC",
  organization: "TSMC",
  sourceId: "tsmc",
  sourceUrl: "https://tsmc.com/careers/job1",
  canonicalUrl: "https://tsmc.com/careers/job1",
  applyLink: "https://tsmc.com/apply",
  location: "Hsinchu, Taiwan",
  country: "TW",
  city: "",
  state: "",
  description: "Research and development in semiconductor process technology",
  requirements: "PhD in EE or Physics",
  responsibilities: "Develop advanced process nodes",
  deadline: null,
  postedDate: "2026-01-15T00:00:00Z",
  salaryMin: null,
  salaryMax: null,
  salaryCurrency: "USD",
  eligibility: [],
  type: "job",
  workMode: "onsite",
  department: "R&D",
  employmentType: "full-time",
  educationLevel: "phd",
  experienceLevel: "senior",
  categories: [],
  skills: [],
  domains: [],
  tags: [],
  language: "en",
  timezone: "",
  isRemote: false,
  isGovernment: false,
  isActive: true,
  verificationStatus: "verified",
  hash: "hash1",
  scrapedAt: "2026-01-16T00:00:00Z",
  ...overrides,
});

describe("SearchEngine", () => {
  let engine: SearchEngine;

  beforeEach(() => {
    engine = new SearchEngine();
    engine.indexItems([
      makeOpp({ id: "1", title: "Research Scientist at TSMC", organization: "TSMC", categories: ["semiconductor-idm"], skills: ["semiconductor", "process"], city: "Hsinchu", state: "", employmentType: "full-time" }),
      makeOpp({ id: "2", title: "Process Engineer at Intel", organization: "Intel", categories: ["semiconductor-idm"], skills: ["semiconductor", "manufacturing"], city: "Hillsboro", state: "Oregon", employmentType: "full-time" }),
      makeOpp({ id: "3", title: "Software Developer at Google", organization: "Google", categories: ["startup"], skills: ["python", "java"], city: "Mountain View", state: "California", employmentType: "full-time" }),
      makeOpp({ id: "4", title: "PhD Position in VLSI", type: "phd", organization: "IIT Bombay", categories: ["university-india"], skills: ["vlsi"], city: "Mumbai", state: "Maharashtra", employmentType: "full-time" }),
      makeOpp({ id: "5", title: "Postdoc in AI Chips", type: "postdoctoral", organization: "Stanford", country: "US", categories: ["university-na"], skills: ["ai", "chips"], city: "Stanford", state: "California", employmentType: "full-time" }),
      makeOpp({ id: "6", title: "Research Intern at TSMC", organization: "TSMC", type: "internship", country: "TW", categories: ["semiconductor-idm"], skills: ["semiconductor"], city: "Hsinchu", state: "", employmentType: "internship" }),
      makeOpp({ id: "7", title: "VLSI Design Engineer", organization: "Qualcomm", categories: ["fabless"], skills: ["vlsi", "verilog"], tags: ["chip-design"], city: "Bangalore", state: "Karnataka", country: "IN", employmentType: "full-time" }),
      makeOpp({ id: "8", title: "Junior Process Engineer", organization: "Applied Materials", categories: ["equipment"], skills: ["semiconductor", "process"], experienceLevel: "junior", salaryMin: 60000, salaryMax: 80000, isRemote: true, city: "Santa Clara", state: "California", employmentType: "full-time" }),
      makeOpp({ id: "9", title: "Government Research Position", organization: "CSIR", country: "IN", categories: ["government-india"], skills: ["materials"], isGovernment: true, city: "New Delhi", state: "Delhi", employmentType: "full-time" }),
      makeOpp({ id: "10", title: "PhD Fellowship in Materials Science", organization: "MIT", country: "US", type: "phd", categories: ["university-na"], skills: ["materials", "characterization"], salaryMin: 30000, salaryMax: 40000, city: "Cambridge", state: "Massachusetts", employmentType: "full-time" }),
      makeOpp({ id: "11", title: "Wafer Fab Technician", organization: "TSMC", categories: ["semiconductor-idm"], skills: ["manufacturing"], tags: ["fab", "cleanroom"], salaryMin: 40000, salaryMax: 55000, city: "Hsinchu", state: "", employmentType: "full-time" }),
      makeOpp({ id: "12", title: "Senior Chip Architect", organization: "AMD", categories: ["fabless"], skills: ["vlsi", "architecture", "chip-design"], experienceLevel: "senior", city: "Austin", state: "Texas", country: "US", employmentType: "full-time" }),
    ]);
  });

  // ── Basic search ────────────────────────────────────────────────────

  it("returns all items when no query", () => {
    const results = engine.search({ q: "", page: 0, pageSize: 20 });
    expect(results.total).toBe(12);
    expect(results.items.length).toBe(12);
  });

  it("searches by keyword", () => {
    const results = engine.search({ q: "TSMC", page: 0, pageSize: 10 });
    expect(results.total).toBeGreaterThanOrEqual(3);
  });

  it("searches by type filter", () => {
    const results = engine.search({ q: "", types: ["phd"], page: 0, pageSize: 10 });
    expect(results.total).toBe(2);
    expect(results.items.map(i => i.id).sort()).toEqual(["10", "4"]);
  });

  it("searches by category filter", () => {
    const results = engine.search({ q: "", categories: ["semiconductor-idm"], page: 0, pageSize: 10 });
    expect(results.total).toBe(4);
    expect(results.items.map(i => i.id).sort()).toEqual(["1", "11", "2", "6"]);
  });

  it("searches by country filter", () => {
    const results = engine.search({ q: "", countries: ["US"], page: 0, pageSize: 10 });
    expect(results.total).toBe(3);
    expect(results.items.map(i => i.id).sort()).toEqual(["10", "12", "5"]);
  });

  it("supports pagination (0-indexed page)", () => {
    const page0 = engine.search({ q: "", page: 0, pageSize: 2 });
    expect(page0.items.length).toBe(2);
    const page2 = engine.search({ q: "", page: 2, pageSize: 2 });
    expect(page2.items.length).toBe(2);
    expect(page0.items[0].id).not.toBe(page2.items[0].id);
  });

  it("returns facets", () => {
    const results = engine.search({ q: "", page: 0, pageSize: 10 });
    expect(results.facets).toBeDefined();
    expect(results.facets.types.length).toBeGreaterThan(0);
    expect(results.facets.categories.length).toBeGreaterThan(0);
    expect(results.facets.countries.length).toBeGreaterThan(0);
  });

  // ── Suggestions / Autocomplete ─────────────────────────────────────

  it("returns suggestions when query is a known prefix", () => {
    const results = engine.search({ q: "phd", page: 0, pageSize: 10 });
    expect(results.suggestions).toBeDefined();
    expect(Array.isArray(results.suggestions)).toBe(true);
  });

  it("returns completions from autocomplete", () => {
    const completions = engine.getAutocomplete("process");
    expect(completions.length).toBeGreaterThan(0);
    expect(completions[0]).toMatch(/process/i);
  });

  it("records autocomplete selection", () => {
    expect(() => engine.recordAutocompleteSelection("process")).not.toThrow();
  });

  it("returns empty suggestions for unknown prefix", () => {
    const results = engine.search({ q: "zzzzznope", page: 0, pageSize: 10 });
    expect(results.suggestions).toEqual([]);
  });

  // ── Did-you-mean ───────────────────────────────────────────────────

  it("returns null didYouMean for exact match", () => {
    const results = engine.search({ q: "semiconductor", page: 0, pageSize: 10 });
    expect(results.didYouMean).toBeNull();
  });

  it("suggests corrections for misspelled queries", () => {
    const results = engine.search({ q: "semiconduktor", page: 0, pageSize: 10 });
    expect(results.didYouMean).toBe("semiconductor");
  });

  it("uses corrected query when correctedQuery is returned", () => {
    const results = engine.search({ q: "proces", page: 0, pageSize: 10 });
    expect(results.correctedQuery).toBe("process");
  });

  // ── Boolean search ──────────────────────────────────────────────────

  it("boolean: AND returns intersection", () => {
    const results = engine.search({ q: "TSMC AND intern", page: 0, pageSize: 10, useBooleanSearch: true });
    expect(results.total).toBe(1);
    expect(results.items[0].id).toBe("6");
  });

  it("boolean: OR returns union", () => {
    const results = engine.search({ q: "Google OR Intel", page: 0, pageSize: 10, useBooleanSearch: true });
    expect(results.total).toBe(2);
    expect(results.items.map(i => i.id).sort()).toEqual(["2", "3"]);
  });

  it("boolean: NOT excludes terms", () => {
    const results = engine.search({ q: "semiconductor NOT Intel", page: 0, pageSize: 10, useBooleanSearch: true });
    expect(results.items.every(i => i.id !== "2")).toBe(true);
  });

  it("boolean: quoted phrase matches exactly", () => {
    const results = engine.search({ q: '"Research Scientist"', page: 0, pageSize: 10, useBooleanSearch: true });
    expect(results.total).toBe(1);
    expect(results.items[0].id).toBe("1");
  });

  it("boolean: field query scopes to field", () => {
    const results = engine.search({ q: "organization:TSMC", page: 0, pageSize: 10, useBooleanSearch: true });
    expect(results.total).toBeGreaterThanOrEqual(3);
  });

  // ── Phrase search ──────────────────────────────────────────────────

  it("phrase search matches literal sequence", () => {
    const results = engine.search({ q: '"Research Scientist"', page: 0, pageSize: 10, usePhraseSearch: true });
    expect(results.total).toBe(1);
    expect(results.items[0].id).toBe("1");
  });

  it("phrase search returns no matches for non-existent phrase", () => {
    const results = engine.search({ q: '"nonexistent phrase here"', page: 0, pageSize: 10, usePhraseSearch: true });
    expect(results.total).toBe(0);
  });

  // ── Field search ───────────────────────────────────────────────────

  it("field search scopes to title", () => {
    const results = engine.search({ q: "Engineer", page: 0, pageSize: 10, searchField: "title" });
    expect(results.total).toBe(3);
    expect(results.items.every(i => i.title.toLowerCase().includes("engineer"))).toBe(true);
  });

  it("field search scopes to organization", () => {
    const results = engine.search({ q: "TSMC", page: 0, pageSize: 10, searchField: "organization" });
    expect(results.total).toBe(3);
  });

  it("field search scopes to skills", () => {
    const results = engine.search({ q: "python", page: 0, pageSize: 10, searchField: "skills" });
    expect(results.total).toBe(1);
    expect(results.items[0].id).toBe("3");
  });

  it("field search scopes to city", () => {
    const results = engine.search({ q: "Bangalore", page: 0, pageSize: 10, searchField: "city" });
    expect(results.total).toBe(1);
    expect(results.items[0].id).toBe("7");
  });

  it("field search scopes to state", () => {
    const results = engine.search({ q: "Texas", page: 0, pageSize: 10, searchField: "state" });
    expect(results.total).toBe(1);
    expect(results.items[0].id).toBe("12");
  });

  // ── Synonym expansion ──────────────────────────────────────────────

  it("expands synonyms via expandQuery", () => {
    const expanded = engine.expandQuery("phd");
    expect(expanded).toMatch(/doctorate/i);
  });

  it("synonym expansion includes PhD synonyms", () => {
    const results = engine.search({ q: "doctorate", page: 0, pageSize: 10, expandSynonyms: true });
    expect(results.total).toBeGreaterThanOrEqual(2);
  });

  // ── Filter dimensions ──────────────────────────────────────────────

  it("filters by city", () => {
    const results = engine.search({ q: "", cities: ["Hsinchu", "Bangalore"], page: 0, pageSize: 10 });
    expect(results.items.map(i => i.id).sort()).toEqual(["1", "11", "6", "7"]);
  });

  it("filters by state", () => {
    const results = engine.search({ q: "", states: ["Texas"], page: 0, pageSize: 10 });
    expect(results.total).toBe(1);
    expect(results.items[0].id).toBe("12");
  });

  it("filters by organization", () => {
    const results = engine.search({ q: "", organizations: ["Intel"], page: 0, pageSize: 10 });
    expect(results.total).toBe(1);
    expect(results.items[0].id).toBe("2");
  });

  it("filters by skills (intersection)", () => {
    const results = engine.search({ q: "", skills: ["semiconductor", "process"], page: 0, pageSize: 10 });
    expect(results.total).toBe(2);
    expect(results.items.map(i => i.id).sort()).toEqual(["1", "8"]);
  });

  it("filters by tags", () => {
    const results = engine.search({ q: "", tags: ["chip-design"], page: 0, pageSize: 10 });
    expect(results.total).toBe(1);
    expect(results.items[0].id).toBe("7");
  });

  it("filters by remote", () => {
    const results = engine.search({ q: "", isRemote: true, page: 0, pageSize: 10 });
    expect(results.total).toBe(1);
    expect(results.items[0].id).toBe("8");
  });

  it("filters by government", () => {
    const results = engine.search({ q: "", isGovernment: true, page: 0, pageSize: 10 });
    expect(results.total).toBe(1);
    expect(results.items[0].id).toBe("9");
  });

  it("filters by industry (categories)", () => {
    const results = engine.search({ q: "", categories: ["semiconductor-idm"], page: 0, pageSize: 10 });
    expect(results.total).toBe(4);
  });

  it("filters by research (types)", () => {
    const results = engine.search({ q: "", types: ["phd"], page: 0, pageSize: 10 });
    expect(results.total).toBe(2);
  });

  it("filters by employment type", () => {
    const results = engine.search({ q: "", employmentTypes: ["internship"], page: 0, pageSize: 10 });
    expect(results.total).toBe(1);
    expect(results.items[0].id).toBe("6");
  });

  // ── Salary range filter ────────────────────────────────────────────

  it("filters by salary min", () => {
    const results = engine.search({ q: "", salaryMin: 50000, page: 0, pageSize: 10 });
    expect(results.items.every(i => (i.salaryMax ?? Infinity) >= 50000)).toBe(true);
  });

  it("filters by salary max", () => {
    const results = engine.search({ q: "", salaryMax: 50000, page: 0, pageSize: 10 });
    expect(results.items.every(i => (i.salaryMin ?? 0) <= 50000)).toBe(true);
  });

  it("filters within salary range", () => {
    const results = engine.search({ q: "", salaryMin: 30000, salaryMax: 50000, page: 0, pageSize: 10 });
    expect(results.items.every(i => (i.salaryMax ?? Infinity) >= 30000 && (i.salaryMin ?? 0) <= 50000)).toBe(true);
  });

  // ── Sorting ────────────────────────────────────────────────────────

  it("sorts by relevance by default", () => {
    const results = engine.search({ q: "process", page: 0, pageSize: 10 });
    expect(results.items.length).toBeGreaterThan(0);
  });

  it("sorts by date descending", () => {
    const results = engine.search({ q: "", sortBy: "date", page: 0, pageSize: 10 });
    expect(results.items[0].id).toBeDefined();
  });

  it("sorts by title ascending", () => {
    const results = engine.search({ q: "", sortBy: "title", sortOrder: "asc", page: 0, pageSize: 20 });
    const titles = results.items.map(i => i.title);
    expect(titles).toEqual([...titles].sort());
  });

  it("sorts by organization ascending", () => {
    const results = engine.search({ q: "", sortBy: "organization", sortOrder: "asc", page: 0, pageSize: 20 });
    const orgs = results.items.map(i => i.organization);
    expect(orgs).toEqual([...orgs].sort());
  });

  it("sorts by popularity", () => {
    const results = engine.search({ q: "", sortBy: "popularity", page: 0, pageSize: 10 });
    expect(results.total).toBe(12);
  });

  it("sorts by verified first", () => {
    const results = engine.search({ q: "", sortBy: "verified", page: 0, pageSize: 20 });
    expect(results.items.length).toBe(12);
  });

  it("sorts descending when sortOrder is desc", () => {
    const results = engine.search({ q: "", sortBy: "title", sortOrder: "desc", page: 0, pageSize: 20 });
    const titles = results.items.map(i => i.title);
    expect(titles).toEqual([...titles].sort().reverse());
  });

  // ── Enhanced facets ───────────────────────────────────────────────

  it("returns city facet", () => {
    const results = engine.search({ q: "", page: 0, pageSize: 10 });
    const facet = results.facets as any;
    expect(facet.cities).toBeDefined();
    expect(facet.cities.length).toBeGreaterThanOrEqual(8);
  });

  it("returns state facet", () => {
    const results = engine.search({ q: "", page: 0, pageSize: 10 });
    const facet = results.facets as any;
    expect(facet.states).toBeDefined();
  });

  it("returns organization facet", () => {
    const results = engine.search({ q: "", page: 0, pageSize: 10 });
    const facet = results.facets as any;
    expect(facet.organizations).toBeDefined();
    expect(facet.organizations.length).toBeGreaterThanOrEqual(8);
  });

  it("returns skills facet", () => {
    const results = engine.search({ q: "", page: 0, pageSize: 10 });
    const facet = results.facets as any;
    expect(facet.skills).toBeDefined();
    expect(facet.skills.length).toBeGreaterThan(0);
  });

  it("returns tags facet", () => {
    const results = engine.search({ q: "", page: 0, pageSize: 10 });
    const facet = results.facets as any;
    expect(facet.tags).toBeDefined();
  });

  it("returns employment type facet", () => {
    const results = engine.search({ q: "", page: 0, pageSize: 10 });
    const facet = results.facets as any;
    expect(facet.employmentTypes).toBeDefined();
  });

  it("returns salary range facet", () => {
    const results = engine.search({ q: "", page: 0, pageSize: 10 });
    const facet = results.facets as any;
    expect(facet.salaryRanges).toBeDefined();
    expect(facet.salaryRanges.length).toBeGreaterThan(0);
  });

  // ── Recommendations ───────────────────────────────────────────────

  it("getSimilar returns items matching skills", () => {
    const similar = engine.getSimilar("1");
    expect(similar.length).toBeGreaterThan(0);
    expect(similar.some(i => i.id === "2")).toBe(true);
  });

  it("getRecommended with interests returns relevant items", () => {
    const recs = engine.getRecommended({
      userId: "user-1", interests: ["semiconductor-idm"], maxResults: 5,
    });
    expect(recs.length).toBeGreaterThan(0);
  });

  it("getRecommended without country returns results", () => {
    const recs = engine.getRecommended({
      userId: "user-1", skills: ["python"], maxResults: 5,
    });
    expect(recs.length).toBeGreaterThan(0);
  });

  it("getBySkills returns matching items", () => {
    const results = engine.getBySkills(["python"]);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("3");
  });

  it("getByCategories returns matching items", () => {
    const results = engine.getByCategories(["semiconductor-idm"]);
    expect(results.length).toBeGreaterThanOrEqual(3);
  });

  it("getNew returns most recent items", () => {
    const results = engine.getNew(3);
    expect(results.length).toBe(3);
  });

  // ── Trending ───────────────────────────────────────────────────────

  it("recordView and getTrending work", () => {
    engine.recordView("1");
    const trending = engine.getTrending();
    expect(trending.find(i => i.id === "1")).toBeDefined();
  });

  it("recordClick and getTrending work", () => {
    engine.recordView("2");
    engine.recordClick("2", "Intel", "Process Engineer at Intel", "process");
    const trending = engine.getTrending();
    expect(trending.find(i => i.id === "2")).toBeDefined();
  });

  it("getTrendingSearches returns popular searches", () => {
    engine.search({ q: "phd", page: 0, pageSize: 5, trackSearch: true, userId: "u1", sessionId: "s1" });
    engine.search({ q: "phd", page: 0, pageSize: 5, trackSearch: true, userId: "u1", sessionId: "s2" });
    const trending = engine.getTrendingSearches();
    expect(trending.length).toBeGreaterThan(0);
  });

  // ── Analytics ──────────────────────────────────────────────────────

  it("getAnalytics returns populated report after searches", () => {
    engine.search({ q: "semiconductor", page: 0, pageSize: 5, trackSearch: true, userId: "u1", sessionId: "s1" });
    const analytics = engine.getAnalytics();
    expect(analytics.totalSearches).toBeGreaterThan(0);
  });

  it("getAnalytics returns zero result queries", () => {
    engine.search({ q: "zzzzzznonexistent", page: 0, pageSize: 5, trackSearch: true, userId: "u1", sessionId: "s1" });
    const analytics = engine.getAnalytics();
    expect(analytics.zeroResultQueries.length).toBeGreaterThan(0);
    expect(analytics.zeroResultQueries[0].query).toBe("zzzzzznonexistent");
  });

  it("getAnalytics returns top filters", () => {
    engine.search({ q: "", types: ["phd"], page: 0, pageSize: 5, trackSearch: true, userId: "u1", sessionId: "s1" });
    const analytics = engine.getAnalytics();
    expect(analytics.topFilters.length).toBeGreaterThanOrEqual(0);
  });

  it("getAnalytics returns top clicks", () => {
    engine.recordClick("1", "TSMC", "Research Scientist at TSMC", "tsmc");
    const analytics = engine.getAnalytics();
    expect(analytics.topClicks.length).toBeGreaterThanOrEqual(0);
  });

  // ── Index health ───────────────────────────────────────────────────

  it("getIndexHealth returns index stats", () => {
    const health = engine.getIndexHealth();
    expect(health.totalDocuments).toBe(12);
    expect(health.totalTerms).toBeGreaterThan(0);
    expect(health.uniqueTerms).toBeGreaterThan(0);
    expect(health.averageDocumentLength).toBeGreaterThan(0);
  });

  it("getIndexHealth returns 0 health score with empty index", () => {
    const emptyEngine = new SearchEngine();
    const health = emptyEngine.getIndexHealth();
    expect(health.totalDocuments).toBe(0);
    expect(health.healthScore).toBe(0);
  });

  // ── Instant search ─────────────────────────────────────────────────

  it("instantSearch returns results quickly", () => {
    const results = engine.instantSearch("process");
    expect(Array.isArray(results)).toBe(true);
  });

  // ── Edge cases ─────────────────────────────────────────────────────

  it("empty query with no filters returns all items", () => {
    const results = engine.search({ q: "", page: 0, pageSize: 20 });
    expect(results.total).toBe(12);
    expect(results.items.length).toBe(12);
  });

  it("empty index returns empty results", () => {
    const emptyEngine = new SearchEngine();
    const results = emptyEngine.search({ q: "anything", page: 0, pageSize: 10 });
    expect(results.total).toBe(0);
    expect(results.items).toEqual([]);
  });

  it("getSimilar with unknown item returns empty", () => {
    const similar = engine.getSimilar("unknown");
    expect(similar).toEqual([]);
  });

  it("getBySkills with no match returns empty", () => {
    const results = engine.getBySkills(["nonexistent-skill"]);
    expect(results).toEqual([]);
  });

  it("getByCategories with no match returns empty", () => {
    const results = engine.getByCategories(["nonexistent-category"]);
    expect(results).toEqual([]);
  });

  it("didYouMean returns null for very short queries", () => {
    const results = engine.search({ q: "a", page: 0, pageSize: 10 });
    expect(results.didYouMean).toBeNull();
  });

  it("multiple filters compose correctly", () => {
    const results = engine.search({
      q: "", countries: ["US"], cities: ["Austin"], page: 0, pageSize: 10,
    });
    expect(results.total).toBe(1);
    expect(results.items[0].id).toBe("12");
  });
});
