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
  city: "Hsinchu",
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
  categories: ["semiconductor-idm"],
  skills: ["semiconductor", "process", "vlsi"],
  domains: ["semiconductor"],
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
      makeOpp({ id: "1", title: "Research Scientist at TSMC", organization: "TSMC", skills: ["semiconductor", "process"] }),
      makeOpp({ id: "2", title: "Process Engineer at Intel", organization: "Intel", skills: ["semiconductor", "manufacturing"] }),
      makeOpp({ id: "3", title: "Software Developer at Google", organization: "Google", skills: ["python", "java"] }),
      makeOpp({ id: "4", title: "PhD Position in VLSI", type: "phd", organization: "IIT Bombay" }),
      makeOpp({ id: "5", title: "Postdoc in AI Chips", type: "postdoctoral", organization: "Stanford", country: "US" }),
    ]);
  });

  it("returns all items when no query", () => {
    const results = engine.search({ q: "", page: 0, pageSize: 10 });
    expect(results.total).toBe(5);
    expect(results.items.length).toBe(5);
  });

  it("searches by keyword", () => {
    const results = engine.search({ q: "TSMC", page: 0, pageSize: 10 });
    expect(results.total).toBeGreaterThanOrEqual(1);
  });

  it("searches by type filter", () => {
    const results = engine.search({ q: "", types: ["phd"], page: 0, pageSize: 10 });
    expect(results.total).toBe(1);
    expect(results.items[0].id).toBe("4");
  });

  it("searches by category filter", () => {
    const results = engine.search({
      q: "",
      categories: ["semiconductor-idm"],
      page: 0,
      pageSize: 10,
    });
    expect(results.total).toBeGreaterThanOrEqual(2);
  });

  it("searches by country filter", () => {
    const results = engine.search({ q: "", countries: ["US"], page: 0, pageSize: 10 });
    expect(results.total).toBe(1);
    expect(results.items[0].id).toBe("5");
  });

  it("supports pagination (0-indexed page)", () => {
    const page0 = engine.search({ q: "", page: 0, pageSize: 2 });
    expect(page0.items.length).toBe(2);
    const page2 = engine.search({ q: "", page: 2, pageSize: 2 });
    expect(page2.items.length).toBe(1);
    expect(page0.items[0].id).not.toBe(page2.items[0].id);
  });

  it("returns facets", () => {
    const results = engine.search({ q: "", page: 0, pageSize: 10 });
    expect(results.facets).toBeDefined();
    expect(results.facets.types.length).toBeGreaterThan(0);
    expect(results.facets.categories.length).toBeGreaterThan(0);
  });

  it("returns suggestions when query is a known prefix", () => {
    const results = engine.search({ q: "phd", page: 0, pageSize: 10 });
    expect(results.suggestions).toBeDefined();
    expect(Array.isArray(results.suggestions)).toBe(true);
  });
});
