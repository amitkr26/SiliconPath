import {
  buildArticleSeo,
  buildSeoTitle,
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  findRelated,
  validateArticle,
  qualityStatusFromValidation,
} from "../../src/content";

describe("seo — title/meta", () => {
  test("year only added when content mentions it", () => {
    expect(buildSeoTitle("Semiconductor Jobs in India", "Applications open for 2026 drive.")).toContain("2026");
    expect(buildSeoTitle("Semiconductor Jobs in India", "Applications open soon.")).not.toContain("2026");
  });
  test("existing year in title is not duplicated", () => {
    expect(buildSeoTitle("IIT Delhi PhD Admission 2026", "Admissions 2026 open")).toBe("IIT Delhi PhD Admission 2026");
  });
  test("meta description truncated to 160 chars", () => {
    const seo = buildArticleSeo({
      title: "Test Article",
      summary: "x".repeat(300),
      slug: "test-article",
      sourceName: "IEEE Spectrum",
    });
    expect(seo.meta_description.length).toBeLessThanOrEqual(160);
    expect(seo.meta_description).toContain("IEEE Spectrum");
  });
  test("canonical URL built from slug", () => {
    const seo = buildArticleSeo({ title: "T", slug: "vlsi-internship-2026", baseUrl: "https://example.com/" });
    expect(seo.canonical_url).toBe("https://example.com/news/vlsi-internship-2026");
  });
});

describe("seo — structured data", () => {
  test("article JSON-LD carries dates and publisher", () => {
    const ld = articleJsonLd({
      title: "TSMC Update",
      slug: "tsmc-update",
      publishedAt: "2026-08-01T00:00:00Z",
      publisherName: "BerojgarDegreeWala",
      baseUrl: "https://example.com",
    });
    expect(ld["@type"]).toBe("NewsArticle");
    expect(ld.datePublished).toBe("2026-08-01T00:00:00Z");
  });
  test("breadcrumb list positions", () => {
    const ld = breadcrumbJsonLd([{ name: "Home", url: "https://x.com" }, { name: "News", url: "https://x.com/news" }]);
    expect((ld.itemListElement as unknown[]).length).toBe(2);
  });
  test("FAQ schema only with real FAQs", () => {
    expect(faqJsonLd(null)).toBeNull();
    expect(faqJsonLd([])).toBeNull();
    const withFaq = faqJsonLd([{ question: "Q?", answer: "A." }]);
    expect(withFaq?.["@type"]).toBe("FAQPage");
  });
});

describe("linking — related content", () => {
  const source = { id: "a1", title: "VLSI Internship 2026", organization: "Tata Electronics", primaryCategory: "internships" };
  const candidates = [
    { id: "b1", title: "Tata Electronics PCB Design Internship", organization: "Tata Electronics", primaryCategory: "internships" },
    { id: "b2", title: "ISRO Scientist Recruitment", organization: "ISRO", primaryCategory: "jobs" },
    { id: "b3", title: "Tata Electronics VLSI Engineer Job", organization: "Tata Electronics", primaryCategory: "jobs" },
  ];
  test("same organization ranks first", () => {
    const related = findRelated(source, candidates, ["vlsi"], 2);
    expect(related[0].id).toBe("b1");
  });
  test("max N respected, no self match", () => {
    const related = findRelated(source, [...candidates, { id: "a1", title: "VLSI Internship 2026", organization: "Tata Electronics" }]);
    expect(related.length).toBeLessThanOrEqual(5);
    expect(related.find((r) => r.id === "a1")).toBeUndefined();
  });
});

describe("quality — pre-publish gate (Phase 11)", () => {
  const goodArticle = {
    title: "DRDO Announces JRF Positions in Microelectronics 2026",
    slug: "drdo-jrf-microelectronics-2026",
    summary: "A real summary.",
    content: "The Defense Research and Development Organization has announced Junior Research Fellow positions in microelectronics. " + "x".repeat(150),
    sourceUrl: "https://rac.gov.in/apply",
    sources: [{ url: "https://rac.gov.in/apply", title: "DRDO Notification" }],
    metaDescription: "A real meta description for the article.",
    primaryCategory: "research",
  };

  test("complete article passes", () => {
    const r = validateArticle(goodArticle);
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  test("missing title fails", () => {
    const r = validateArticle({ ...goodArticle, title: null });
    expect(r.valid).toBe(false);
  });

  test("insufficient source material fails", () => {
    const r = validateArticle({ ...goodArticle, content: "Short." });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("content"))).toBe(true);
  });

  test("no references fails", () => {
    const r = validateArticle({ ...goodArticle, sources: null });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("sources"))).toBe(true);
  });

  test("invalid source URL fails", () => {
    const r = validateArticle({ ...goodArticle, sourceUrl: "not-a-url" });
    expect(r.valid).toBe(false);
  });

  test("category outside taxonomy fails", () => {
    const r = validateArticle({ ...goodArticle, primaryCategory: "Aerospace Mogul" });
    expect(r.valid).toBe(false);
  });

  test("AI placeholder text fails", () => {
    const r = validateArticle({ ...goodArticle, content: "Lorem ipsum dolor sit amet. " + "x".repeat(150) });
    expect(r.valid).toBe(false);
  });

  test("failed validation never publishes", () => {
    expect(qualityStatusFromValidation(false)).toBe("rejected");
    expect(qualityStatusFromValidation(true)).toBe("published");
  });
});