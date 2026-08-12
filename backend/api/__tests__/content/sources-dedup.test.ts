import {
  canonicalUrl,
  titleSimilarity,
  checkDuplicate,
  classifySourceType,
  isOfficialSource,
  isValidSourceUrl,
  verificationFromSourceType,
  buildSourceRef,
} from "../../src/content";

describe("dedup — canonical URLs", () => {
  test("strips tracking params, www, trailing slash, hash", () => {
    expect(
      canonicalUrl("https://www.rac.gov.in/apply?utm_source=news&utm_medium=email#section")
    ).toBe("https://rac.gov.in/apply");
  });
  test("index.html removal", () => {
    expect(canonicalUrl("https://isro.gov.in/careers/index.html")).toBe("https://isro.gov.in/careers");
  });
  test("normalizes case", () => {
    expect(canonicalUrl("HTTPS://ISRO.GOV.IN/Careers")).toBe("https://isro.gov.in/careers");
  });
});

describe("dedup — title similarity", () => {
  test("identical titles → 1", () => {
    expect(titleSimilarity("DRDO JRF 2026", "DRDO JRF 2026")).toBe(1);
  });
  test("near-identical → >= 0.85", () => {
    const sim = titleSimilarity("JRF Position at DRDO Electronics", "JRF Position at DRDO Electronics 2026");
    expect(sim).toBeGreaterThanOrEqual(0.85);
  });
  test("different postings → low", () => {
    expect(titleSimilarity("ISRO Scientist Recruitment", "Tata Electronics VLSI Internship")).toBeLessThan(0.5);
  });
});

describe("dedup — duplicate check", () => {
  test("same canonical URL is a duplicate", () => {
    const r = checkDuplicate({
      sourceUrl: "https://drdo.gov.in/vacancy?ref=1",
      title: "DRDO JRF",
      existingUrl: "https://www.drdo.gov.in/vacancy",
      existingTitle: "DRDO JRF",
    });
    expect(r.isDuplicateTitle).toBe(true);
  });
  test("same title different URL → duplicate", () => {
    const r = checkDuplicate({
      sourceUrl: "https://aggregator.example.com/x",
      title: "IIT Bombay PhD Admission 2026",
      existingUrl: "https://iitb.ac.in/xyz",
      existingTitle: "IIT Bombay PhD Admission 2026",
    });
    expect(r.isDuplicateTitle).toBe(true);
  });
  test("aggregator + official with different titles → not duplicate", () => {
    const r = checkDuplicate({
      sourceUrl: "https://example.com/notice",
      title: "Summer Research Internship 2026",
      existingUrl: "https://iisc.ac.in/notice-123",
      existingTitle: "IISc Summer Programme",
    });
    expect(r.isDuplicateTitle).toBe(false);
  });
});

describe("sources — classification", () => {
  test("government domains", () => {
    expect(classifySourceType("https://rac.gov.in/apply")).toBe("government");
    expect(classifySourceType("https://www.isro.gov.in/Careers.html")).toBe("government");
    expect(classifySourceType("https://drdo.gov.in/vacancies")).toBe("government");
  });
  test("university domains", () => {
    expect(classifySourceType("https://iisc.ac.in/admissions")).toBe("university");
    expect(classifySourceType("https://www.iitb.ac.in/ircc")).toBe("university");
  });
  test("ATS/company sources", () => {
    expect(classifySourceType("https://boards.greenhouse.io/intel/jobs/123")).toBe("company");
    expect(classifySourceType("https://careers.tataelectronics.com")).toBe("company");
  });
  test("reputable media", () => {
    expect(classifySourceType("https://spectrum.ieee.org/semiconductors")).toBe("reputable_media");
    expect(classifySourceType("https://semiengineering.com/feed")).toBe("reputable_media");
  });
  test("aggregators and social", () => {
    expect(classifySourceType("https://academicpositions.com/jobs")).toBe("aggregator");
    expect(classifySourceType("https://x.com/iscvacancy")).toBe("social");
  });
  test("unknown stays unknown", () => {
    expect(classifySourceType("https://some-unknown-site.example/xyz")).toBe("unknown");
    expect(classifySourceType(null)).toBe("unknown");
  });
  test("official-source verification policy", () => {
    expect(isOfficialSource("government")).toBe(true);
    expect(isOfficialSource("aggregator")).toBe(false);
    expect(verificationFromSourceType("government")).toBe("verified");
    expect(verificationFromSourceType("aggregator")).toBe("pending");
    expect(verificationFromSourceType("unknown")).toBe("pending");
  });
  test("URL validation", () => {
    expect(isValidSourceUrl("https://drdo.gov.in")).toBe(true);
    expect(isValidSourceUrl("javascript:alert(1)")).toBe(false);
    expect(isValidSourceUrl("")).toBe(false);
    expect(isValidSourceUrl(null)).toBe(false);
  });
});

describe("sources — provenance shape", () => {
  test("source ref carries full metadata", () => {
    const ref = buildSourceRef({
      title: "DRDO JRF Notification",
      url: "https://rac.gov.in/apply",
      published_at: "2026-08-01T00:00:00Z",
    });
    expect(ref.source_type).toBe("government");
    expect(ref.accessed_at).toBeTruthy();
    expect(ref.publisher).toBe("rac.gov.in");
  });
});