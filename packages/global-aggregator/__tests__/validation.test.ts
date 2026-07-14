import {
  Validator,
  DeadLinkChecker,
  DuplicateDetector,
  ExpiredDetector,
  MalformedDetector,
  SpamDetector,
  BrokenHtmlDetector,
  RedirectDetector,
} from "../src/validation";
import type { NormalizedOpportunity } from "../src/types";

const makeOpp = (overrides: Partial<NormalizedOpportunity> = {}): NormalizedOpportunity => ({
  id: "opp-1",
  title: "Research Engineer at Semiconductor Lab",
  organization: "Test Corp",
  sourceId: "src1",
  sourceUrl: "https://example.com/job",
  canonicalUrl: "https://example.com/job",
  applyLink: "https://example.com/apply",
  location: "Bangalore, India",
  country: "IN",
  city: "Bangalore",
  state: "Karnataka",
  description: "A detailed test opportunity for validation with sufficient length to pass all checks.",
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
  language: "en",
  timezone: "",
  isRemote: false,
  isGovernment: false,
  isActive: true,
  verificationStatus: "pending",
  hash: "hash1",
  scrapedAt: new Date().toISOString(),
  ...overrides,
});

describe("MalformedDetector", () => {
  it("passes well-formed opportunities", () => {
    const md = new MalformedDetector();
    const errors = md.validate(makeOpp());
    expect(errors).toHaveLength(0);
  });

  it("flags missing title", () => {
    const md = new MalformedDetector();
    const errors = md.validate(makeOpp({ title: "" }));
    expect(errors.some((e) => e.field === "title")).toBe(true);
  });

  it("flags missing sourceUrl", () => {
    const md = new MalformedDetector();
    const errors = md.validate(makeOpp({ sourceUrl: "" }));
    expect(errors.some((e) => e.field === "sourceUrl")).toBe(true);
  });
});

describe("ExpiredDetector", () => {
  it("passes opportunities with no deadline", () => {
    const ed = new ExpiredDetector();
    expect(ed.isExpired(null)).toBe(false);
  });

  it("flags past deadlines", () => {
    const ed = new ExpiredDetector();
    expect(ed.isExpired("2020-01-01T00:00:00Z")).toBe(true);
  });

  it("passes future deadlines", () => {
    const ed = new ExpiredDetector();
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(ed.isExpired(future)).toBe(false);
  });
});

describe("SpamDetector", () => {
  it("passes normal opportunities", () => {
    const sd = new SpamDetector();
    const result = sd.isSpam(makeOpp());
    expect(result.spam).toBe(false);
  });

  it("flags spammy titles", () => {
    const sd = new SpamDetector();
    const opp = makeOpp({
      title: "URGENT: WORK FROM HOME - Earn Money FAST!!!",
      description: "Make money fast! Click here now! Limited time offer! Easy money guaranteed!",
    });
    const result = sd.isSpam(opp);
    expect(result.spam).toBe(true);
  });
});

describe("DuplicateDetector", () => {
  it("deduplicates by content hash", () => {
    const dd = new DuplicateDetector();
    const a = makeOpp({ id: "1", sourceUrl: "https://example.com/dup" });
    const b = makeOpp({ id: "2", sourceUrl: "https://example.com/dup" });
    const result = dd.detect([a, b]);
    expect(result).toHaveLength(1);
  });

  it("keeps unique items", () => {
    const dd = new DuplicateDetector();
    const a = makeOpp({ id: "1", sourceUrl: "https://example.com/a" });
    const b = makeOpp({ id: "2", sourceUrl: "https://example.com/b" });
    const result = dd.detect([a, b]);
    expect(result).toHaveLength(2);
  });
});

describe("DeadLinkChecker", () => {
  it("handles unreachable URLs gracefully", async () => {
    const dlc = new DeadLinkChecker();
    const result = await dlc.check("https://nonexistent-domain-xyz789.test");
    expect(result.valid).toBe(false);
  });
});

describe("BrokenHtmlDetector", () => {
  it("passes clean HTML", () => {
    const detector = new BrokenHtmlDetector();
    const result = detector.check("<div><p>Hello</p></div>");
    expect(result.broken).toBe(false);
  });

  it("detects mismatched tags", () => {
    const detector = new BrokenHtmlDetector();
    const result = detector.check("<div><p>Hello</div>");
    expect(result.broken).toBe(true);
  });
});

describe("RedirectDetector", () => {
  it("handles invalid URLs gracefully", async () => {
    const detector = new RedirectDetector();
    const result = await detector.follow("", 1);
    expect(result.finalUrl).toBe("");
  });
});

describe("Validator", () => {
  async function createValidator() {
    return new Validator(
      new DeadLinkChecker(),
      new DuplicateDetector(),
      new ExpiredDetector(),
      new MalformedDetector(),
      new BrokenHtmlDetector(),
      new RedirectDetector(),
      new SpamDetector(),
    );
  }

  it("validates opportunities through all checks", async () => {
    const v = await createValidator();
    const opp = makeOpp({ applyLink: "https://example.com" });
    const result = await v.validateAll([opp]);
    expect(result.valid).toHaveLength(1);
    expect(result.rejected).toHaveLength(0);
  });

  it("rejects opportunities with errors", async () => {
    const v = await createValidator();
    const result = await v.validateAll([makeOpp({ title: "", description: "" })]);
    expect(result.rejected).toHaveLength(1);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
