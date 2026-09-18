import { classifyIntent, expectedIntentForPageType } from "@/lib/seo/keyword-intent";

describe("classifyIntent", () => {
  it("classifies programmatic/job copy as transactional", () => {
    const r = classifyIntent("JRF Positions at DRDO — 2026 Recruitment", "Apply now for junior research fellowship vacancies with stipend details.");
    expect(r.intent).toBe("transactional");
    expect(r.confidence).toBeGreaterThan(0);
  });

  it("classifies guide copy as informational", () => {
    const r = classifyIntent("How to Get a Fully-Funded PhD in VLSI", "What is the roadmap? This guide compares universities and explains the what is, how to and eligibility for funding.");
    expect(r.intent).toBe("informational");
  });

  it("classifies navigational copy for brand pages", () => {
    const r = classifyIntent("About BerojgarDegreeWala", "Contact us about the semiconductor and VLSI opportunity network.");
    expect(r.intent).toBe("navigational");
  });

  it("returns informational with zero confidence when nothing matches", () => {
    const r = classifyIntent("", "");
    expect(r.intent).toBe("informational");
    expect(r.confidence).toBe(0);
  });
});

describe("expectedIntentForPageType", () => {
  it("maps list/detail programmatic pages to transactional intent", () => {
    for (const t of ["category", "location", "opportunity", "organization", "home"] as const) {
      expect(expectedIntentForPageType(t)).toBe("transactional");
    }
  });

  it("maps guides and news to informational intent", () => {
    expect(expectedIntentForPageType("resource")).toBe("informational");
    expect(expectedIntentForPageType("news")).toBe("informational");
  });
});