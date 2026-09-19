import {
  classifyPrimaryCategory,
  classifySecondaryCategories,
  mapLegacyCategory,
  validateCategories,
  isValidPrimaryCategory,
  PRIMARY_CATEGORIES,
  SECONDARY_CATEGORIES,
} from "../../src/content";

describe("taxonomy — primary classification (deterministic)", () => {
  test("legacy DB values map onto the controlled taxonomy", () => {
    expect(mapLegacyCategory("jrf")).toBe("research");
    expect(mapLegacyCategory("JRF")).toBe("research");
    expect(mapLegacyCategory("srf")).toBe("research");
    expect(mapLegacyCategory("phd")).toBe("admissions");
    expect(mapLegacyCategory("postdoc")).toBe("fellowships");
    expect(mapLegacyCategory("fellowship")).toBe("fellowships");
    expect(mapLegacyCategory("internship")).toBe("internships");
    expect(mapLegacyCategory("government")).toBe("jobs");
    expect(mapLegacyCategory("industry")).toBe("jobs");
    expect(mapLegacyCategory("job")).toBe("jobs");
  });

  test("unknown legacy → other, never silently 'government'", () => {
    expect(mapLegacyCategory("weird-value")).toBe("other");
    expect(mapLegacyCategory(null)).toBe("other");
  });

  test("title-driven classification", () => {
    expect(classifyPrimaryCategory({ title: "Research Associate Position", category: "jrf" })).toBe("research");
    expect(classifyPrimaryCategory({ title: "VLSI Internship 2026" })).toBe("internships");
    expect(classifyPrimaryCategory({ title: "PhD Admission 2026" })).toBe("admissions");
    expect(classifyPrimaryCategory({ title: "Walk-in hackathon for students" })).toBe("hackathons");
  });
});

describe("taxonomy — secondary categories", () => {
  test("technical domain detection", () => {
    const secondaries = classifySecondaryCategories({
      title: "Physical Design Engineer (VLSI)",
      tags: ["semiconductor", "ASIC"],
    });
    expect(secondaries).toContain("vlsi");
    expect(secondaries).toContain("semiconductor");
  });

  test("no uncontrolled values escape", () => {
    const secondaries = classifySecondaryCategories({ title: "Quantum banana farmer" });
    for (const s of secondaries) {
      expect(SECONDARY_CATEGORIES).toContain(s);
    }
  });
});

describe("taxonomy — validation gate (Phase 5)", () => {
  test("valid primary passes through", () => {
    expect(validateCategories({ primaryCategory: "Jobs" }).primaryCategory).toBe("jobs");
  });

  test("invalid primary falls back to 'other'", () => {
    expect(validateCategories({ primaryCategory: "Aerospace Mogul" }).primaryCategory).toBe("other");
  });

  test("invalid secondaries are dropped", () => {
    const r = validateCategories({ primaryCategory: "jobs", secondaryCategories: ["vlsi", "quantum unicorn"] });
    expect(r.secondaryCategory).toEqual(["vlsi"]);
  });

  test("full taxonomy is controlled and non-empty", () => {
    expect(PRIMARY_CATEGORIES.length).toBe(13);
    expect(SECONDARY_CATEGORIES.length).toBeGreaterThanOrEqual(20);
    expect(isValidPrimaryCategory("jobs")).toBe(true);
    expect(isValidPrimaryCategory("JOB")).toBe(false);
  });
});