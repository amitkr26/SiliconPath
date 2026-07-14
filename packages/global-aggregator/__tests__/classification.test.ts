import { Classifier } from "../src/classification";
import type { NormalizedOpportunity } from "../src/types";

const makeOpp = (overrides: Partial<NormalizedOpportunity> = {}): NormalizedOpportunity => ({
  id: "opp-1",
  title: "Test Job",
  organization: "Test Corp",
  sourceId: "src1",
  sourceUrl: "https://example.com/job",
  canonicalUrl: "https://example.com/job",
  applyLink: "https://example.com/apply",
  location: "Bangalore, India",
  country: "IN",
  city: "Bangalore",
  state: "Karnataka",
  description: "A software engineering role in semiconductor design",
  requirements: "B.Tech in EE or CS",
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

describe("Classifier", () => {
  const classifier = new Classifier();

  it("classifies a PhD opportunity", async () => {
    const result = await classifier.classify(
      makeOpp({
        title: "PhD Position in Semiconductor Physics",
        description: "Doctoral research opportunity in VLSI design and fabrication",
      })
    );
    expect(result.type).toBe("phd");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("classifies an internship", async () => {
    const result = await classifier.classify(
      makeOpp({
        title: "Summer Internship 2026",
        description: "Internship for undergraduate students in engineering",
      })
    );
    expect(result.type).toBe("internship");
  });

  it("classifies a faculty position", async () => {
    const result = await classifier.classify(
      makeOpp({
        title: "Assistant Professor in Electrical Engineering",
        description: "Tenure track faculty position at the university",
      })
    );
    expect(result.type).toBe("faculty");
  });

  it("classifies a job as default", async () => {
    const result = await classifier.classify(
      makeOpp({
        title: "Software Engineer",
        description: "Develop and maintain software systems",
      })
    );
    expect(result.type).toBe("job");
  });

  it("detects skills from description", async () => {
    const result = await classifier.classify(
      makeOpp({
        title: "Hardware Engineer",
        description: "Experience with Python, Verilog, and machine learning",
        type: "industry-job",
      })
    );
    expect(result.skills.length).toBeGreaterThan(0);
    expect(result.skills.some((s) => s.toLowerCase().includes("python"))).toBe(true);
  });

  it("caches results by hash", async () => {
    const result1 = await classifier.classify(makeOpp({ title: "Cached Job", hash: "same" }));
    const result2 = await classifier.classify(makeOpp({ title: "Cached Job", hash: "same" }));
    expect(result1).toEqual(result2);
  });

  it("returns classification stats", async () => {
    await classifier.classify(makeOpp());
    const stats = classifier.getStats();
    expect(stats).toHaveProperty("totalClassified");
    expect(stats).toHaveProperty("aiClassified");
    expect(stats).toHaveProperty("ruleClassified");
    expect(stats.totalClassified).toBeGreaterThan(0);
  });
});
