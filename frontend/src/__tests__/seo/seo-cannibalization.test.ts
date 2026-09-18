import { tokenizeForCluster, jaccardSimilarity, findCannibalizationClusters } from "@/lib/seo/cannibalization";

describe("tokenizeForCluster", () => {
  it("lowercases, strips punctuation and removes stopwords", () => {
    const tokens = tokenizeForCluster("JRF vs SRF vs Research Associate: What's the Difference?");
    expect(tokens).toContain("jrf");
    expect(tokens).toContain("srf");
    expect(tokens).toContain("difference");
    // Stopwords: vs, india, 2026, jobs, career, guide...
    expect(tokens).not.toContain("vs");
    expect(tokens).not.toContain("the");
  });

  it("drops whitespace-only titles", () => {
    expect(tokenizeForCluster("   ")).toEqual([]);
  });
});

describe("jaccardSimilarity", () => {
  it("returns 1 for identical token sets", () => {
    expect(jaccardSimilarity(["jrf", "electronics"], ["jrf", "electronics"])).toBe(1);
  });

  it("returns 0 for disjoint token sets", () => {
    expect(jaccardSimilarity(["jrf"], ["vlsi"])).toBe(0);
  });
});

describe("findCannibalizationClusters (advisory)", () => {
  it("clusters near-duplicate titles across separate URLs", () => {
    const pages = [
      { url: "/opportunities/vlsi-1", title: "Junior Research Fellowship Electronics Guide", tokens: tokenizeForCluster("Junior Research Fellowship Electronics Guide") },
      { url: "/opportunities/vlsi-2", title: "Junior Research Fellowship Electronics Tips", tokens: tokenizeForCluster("Junior Research Fellowship Electronics Tips") },
    ];
    const clusters = findCannibalizationClusters(pages);
    expect(clusters.length).toBe(1);
    expect(clusters[0].count).toBe(2);
    expect(clusters[0].urls).toContain("/opportunities/vlsi-1");
    expect(clusters[0].urls).toContain("/opportunities/vlsi-2");
  });

  it("leaves dissimilar pages alone", () => {
    const pages = [
      { url: "/resources/phd-guide", title: "PhD in Electronics India 2026 — Admission Guide", tokens: tokenizeForCluster("PhD in Electronics India 2026 — Admission Guide") },
      { url: "/news/isro-update", title: "ISRO launches new satellite", tokens: tokenizeForCluster("ISRO launches new satellite") },
    ];
    expect(findCannibalizationClusters(pages)).toEqual([]);
  });

  it("sorts clusters by descending size", () => {
    const a = { url: "/a", title: "VLSI Jobs Semiconductor Careers India", tokens: tokenizeForCluster("VLSI Jobs Semiconductor Careers India") };
    const b = { url: "/b", title: "VLSI Jobs Semiconductor Roles India", tokens: tokenizeForCluster("VLSI Jobs Semiconductor Roles India") };
    const c = { url: "/c", title: "VLSI Jobs Semiconductor Roles India", tokens: tokenizeForCluster("VLSI Jobs Semiconductor Roles India") };
    const d = { url: "/d", title: "JRF Recruitment Electronics Government", tokens: tokenizeForCluster("JRF Recruitment Electronics Government") };
    const e = { url: "/e", title: "JRF Recruitment Electronics Positions", tokens: tokenizeForCluster("JRF Recruitment Electronics Positions") };
    const clusters = findCannibalizationClusters([a, b, c, d, e]);
    expect(clusters.length).toBe(2);
    expect(clusters[0].count).toBeGreaterThanOrEqual(clusters[1].count);
  });
});