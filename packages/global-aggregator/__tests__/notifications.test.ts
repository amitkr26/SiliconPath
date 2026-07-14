import { NotificationEngine } from "../src/notifications";
import type { NormalizedOpportunity, SavedSearch } from "../src/types";

const makeOpp = (overrides: Partial<NormalizedOpportunity> = {}): NormalizedOpportunity => ({
  id: "opp-1",
  title: "Research Engineer",
  organization: "Test Corp",
  sourceId: "src1",
  sourceUrl: "https://example.com/job",
  canonicalUrl: "https://example.com/job",
  applyLink: "https://example.com/apply",
  location: "Bangalore, India",
  country: "IN",
  city: "Bangalore",
  state: "Karnataka",
  description: "A test opportunity",
  requirements: "",
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

describe("NotificationEngine", () => {
  let ne: NotificationEngine;

  beforeEach(() => {
    ne = new NotificationEngine();
  });

  it("sends instant alert with user id", async () => {
    await ne.sendInstantAlert("user-1", makeOpp());
    expect(ne.getLog()).toHaveLength(1);
    expect(ne.getLog()[0].userId).toBe("user-1");
    expect(ne.getLog()[0].type).toBe("instant");
  });

  it("sends digest with items", async () => {
    await ne.sendDigest("user-1", [makeOpp()]);
    expect(ne.getLog()).toHaveLength(1);
    expect(ne.getLog()[0].type).toBe("digest");
  });

  it("skips digest with empty items", async () => {
    await ne.sendDigest("user-1", []);
    expect(ne.getLog()).toHaveLength(0);
  });

  it("sends deadline alert", async () => {
    await ne.sendDeadlineAlert("user-1", makeOpp(), 7);
    expect(ne.getLog()).toHaveLength(1);
    expect(ne.getLog()[0].type).toBe("deadline");
    expect(ne.getLog()[0].message).toContain("7 day");
  });

  it("sends keyword alert", async () => {
    await ne.sendKeywordAlert("user-1", "semiconductor", [makeOpp()]);
    expect(ne.getLog()).toHaveLength(1);
    expect(ne.getLog()[0].type).toBe("keyword");
  });

  it("skips keyword alert with empty items", async () => {
    await ne.sendKeywordAlert("user-1", "semiconductor", []);
    expect(ne.getLog()).toHaveLength(0);
  });

  it("sends saved search alert", async () => {
    const search: SavedSearch = {
      id: "search-1",
      userId: "user-1",
      query: { q: "phd", page: 0, pageSize: 10 },
      name: "PhD positions",
      notify: true,
      frequency: "instant",
      createdAt: new Date().toISOString(),
    };
    await ne.sendSavedSearchAlert("user-1", search, [makeOpp()]);
    expect(ne.getLog()).toHaveLength(1);
    expect(ne.getLog()[0].type).toBe("saved-search");
  });

  it("clears log", async () => {
    await ne.sendInstantAlert("user-1", makeOpp());
    expect(ne.getLog()).toHaveLength(1);
    ne.clearLog();
    expect(ne.getLog()).toHaveLength(0);
  });

  it("returns config", () => {
    const config = ne.getConfig();
    expect(config.email.enabled).toBe(true);
    expect(config.digest.frequency).toBe("daily");
  });
});
