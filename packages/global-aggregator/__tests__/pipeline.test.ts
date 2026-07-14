import { Deduplicator, Canonicalizer, LanguageDetector, SalaryParser, CountryDetector } from "../src/pipeline";
import type { NormalizedOpportunity } from "../src/types";

const makeOpp = (overrides: Partial<NormalizedOpportunity> = {}): NormalizedOpportunity => ({
  id: "opp-1",
  title: "Test",
  organization: "Test Corp",
  sourceId: "src1",
  sourceUrl: "https://example.com/job",
  canonicalUrl: "https://example.com/job",
  applyLink: "https://example.com/apply",
  location: "Bangalore, India",
  country: "",
  city: "",
  state: "",
  description: "A test opportunity for pipeline stages with sufficient length.",
  requirements: "None",
  responsibilities: "",
  deadline: null,
  postedDate: null,
  salaryMin: null,
  salaryMax: null,
  salaryCurrency: "USD",
  eligibility: [],
  type: "job",
  workMode: "unknown",
  department: "",
  employmentType: "",
  educationLevel: "any",
  experienceLevel: "any",
  categories: [],
  skills: [],
  domains: [],
  tags: [],
  language: "",
  timezone: "",
  isRemote: false,
  isGovernment: false,
  isActive: true,
  verificationStatus: "pending",
  hash: "hash1",
  scrapedAt: new Date().toISOString(),
  ...overrides,
});

describe("Deduplicator", () => {
  it("detects duplicates by content", () => {
    const d = new Deduplicator(168);
    const opp = makeOpp();
    expect(d.isDuplicate(opp)).toBe(false);
    d.markSeen(opp);
    expect(d.isDuplicate(opp)).toBe(true);
  });

  it("returns stats", () => {
    const d = new Deduplicator(168);
    d.markSeen(makeOpp({ sourceUrl: "https://example.com/a" }));
    expect(d.getStats().totalSeen).toBe(1);
    expect(d.getStats().duplicatesFound).toBe(0);
  });

  it("clears state", () => {
    const d = new Deduplicator(168);
    d.markSeen(makeOpp());
    expect(d.getStats().totalSeen).toBe(1);
    d.clear();
    expect(d.getStats().totalSeen).toBe(0);
  });
});

describe("Canonicalizer", () => {
  it("normalizes URLs by removing query params", () => {
    const c = new Canonicalizer({ enabled: true });
    expect(c.canonicalize("https://example.com/job?utm_source=test&ref=123")).toBe("https://example.com/job");
  });

  it("strips trailing slashes", () => {
    const c = new Canonicalizer({ enabled: true });
    expect(c.canonicalize("https://example.com/job/")).toBe("https://example.com/job");
  });
});

describe("LanguageDetector", () => {
  it("detects english", () => {
    const ld = new LanguageDetector({ enabled: true, fallback: "en" });
    expect(ld.detect("Hello world, this is a test")).toBe("en");
  });

  it("returns fallback for empty input", () => {
    const ld = new LanguageDetector({ enabled: true, fallback: "en" });
    expect(ld.detect("")).toBe("en");
  });
});

describe("SalaryParser", () => {
  it("parses numeric salary range", () => {
    const sp = new SalaryParser();
    const result = sp.parse("$100,000 - $150,000");
    expect(result.min).toBe(100000);
    expect(result.max).toBe(150000);
  });

  it("returns min/max null for unparseable", () => {
    const sp = new SalaryParser();
    const result = sp.parse("competitive");
    expect(result.min).toBeNull();
    expect(result.max).toBeNull();
  });

  it("parses single value salary", () => {
    const sp = new SalaryParser();
    const result = sp.parse("$120,000");
    expect(result.min).toBe(120000);
    expect(result.max).toBe(120000);
  });

  it("returns null for empty input", () => {
    const sp = new SalaryParser();
    expect(sp.parse(null).min).toBeNull();
    expect(sp.parse("").min).toBeNull();
  });
});

describe("CountryDetector", () => {
  it("detects country from location string", () => {
    const cd = new CountryDetector();
    expect(cd.detect("Bangalore, Karnataka, India")).toBe("IN");
    expect(cd.detect("New York, NY, USA")).toBe("US");
    expect(cd.detect("London, UK")).toBe("GB");
    expect(cd.detect("Tokyo, Japan")).toBe("JP");
  });

  it("returns empty string for unknown location", () => {
    const cd = new CountryDetector();
    expect(cd.detect("")).toBe("");
  });
});
