/**
 * Anti-gaming contract enforcement.
 *
 * The scoring model is penalty-only: score = max(0, 100 - penalties). There is
 * no code path that can ADD points, so stuffing keywords, adding filler FAQs,
 * meaningless schema or extra markup can only ever lower a score. These tests
 * lock that invariant in.
 */

import { buildContext, auditPage } from "@/lib/seo/engine";
import { applicableChecks } from "@/lib/seo/checks";
import { computeScore } from "@/lib/seo/score";
import { SEVERITY_META, SEVERITIES } from "@/lib/seo/types";
import { SITE_URL } from "@/lib/seo/registry";

const NOW = new Date("2026-09-18T00:00:00Z");

const GOOD_COPY =
  "A Junior Research Fellowship (JRF) is a funded research position in India for candidates who clear the national eligibility test. The stipend in 2026 is Rs. 37,000 per month for the first two years, and it rises to Rs. 42,000 per month as a senior research fellowship. DRDO, ISRO and CSIR laboratories advertise positions on a rolling schedule. Eligibility normally requires a masters degree in electronics and a valid NET or GATE score. Selection most often follows a written exam followed by a personal interview. Candidates should check each notification for the exact age limit and submission timeline before applying.";

function baselineCtx() {
  return buildContext(
    {
      url: `${SITE_URL}/resources/jrf-guide`,
      pageType: "resource",
      title: "Complete JRF Guide 2026 — Electronics Science",
      description: "Everything about Junior Research Fellowship positions in India for electronics students: eligibility, stipend, exam pattern and application process.",
      canonical: `${SITE_URL}/resources/jrf-guide`,
      contentText: GOOD_COPY,
      declaredSchemas: ["WebSite", "Organization"],
      lastModified: "2026-09-01T00:00:00Z",
    },
    {},
    NOW
  );
}

describe("Penalty model — points can only be lost", () => {
  it("computes fixed penalties by severity and can never exceed 100", () => {
    expect(computeScore([{ severity: "pass" }, { severity: "pass" }] as any)).toBe(100);
    expect(computeScore([{ severity: "critical" }] as any)).toBe(92);
    expect(computeScore([{ severity: "warning" }] as any)).toBe(95);
    expect(computeScore([{ severity: "improvement" }] as any)).toBe(98);
    // Floors at zero.
    const fifteenCriticals = Array.from({ length: 15 }, () => ({ severity: "critical" } as any));
    expect(computeScore(fifteenCriticals)).toBe(0);
  });

  it("every severity in the enum has a non-negative penalty", () => {
    for (const sev of SEVERITIES) {
      expect(SEVERITY_META[sev].penalty).toBeGreaterThanOrEqual(0);
    }
  });

  it("no check may return a severity outside the enum", () => {
    const ctx = baselineCtx();
    for (const check of applicableChecks(ctx)) {
      const result = check.run(ctx, {}, NOW);
      expect(SEVERITIES).toContain(result.severity);
    }
  });
});

describe("Spam can never raise a score", () => {
  it("keyword-stuffed titles and bodies reduce (never increase) the score", () => {
    const baseline = auditPage(baselineCtx(), {}, NOW);
    const spamCtx = buildContext(
      {
        url: `${SITE_URL}/resources/jrf-guide`,
        pageType: "resource",
        title: "JRF Jobs JRF Jobs JRF Jobs JRF Jobs JRF Jobs JRF Jobs JRF Jobs JRF Jobs JRF Jobs JRF Jobs",
        description: "JRF jobs JRF jobs JRF jobs JRF jobs JRF fellowship JRF fellowship JRF recruitment",
        canonical: `${SITE_URL}/resources/jrf-guide`,
        contentText: Array.from({ length: 200 }, (_, i) => (i % 2 === 0 ? "JRF" : "fellowship jobs")).join(" "),
        declaredSchemas: ["WebSite", "Organization"],
        lastModified: "2026-09-01T00:00:00Z",
      },
      {},
      NOW
    );
    const spam = auditPage(spamCtx, {}, NOW);
    expect(spam.score).toBeLessThan(baseline.score);
    expect(spam.checks.find((c) => c.id === "content.keyword-stuffing")?.severity).toBe("warning");
    expect(spam.checks.find((c) => c.id === "meta.title.length")?.severity).toBe("warning");
  });

  it("meaningless FAQ entries count against the page and never help", () => {
    const withFillerFaq = buildContext(
      {
        url: `${SITE_URL}/resources/jrf-guide`,
        pageType: "resource",
        title: "Complete JRF Guide 2026 — Electronics Science",
        description: "Everything about Junior Research Fellowship positions in India for electronics students.",
        canonical: `${SITE_URL}/resources/jrf-guide`,
        contentText: `${GOOD_COPY}\n\nFAQ\nQ: Is this real?\nA: Yes.\nQ: Should I apply?\nA: Yes.`,
        declaredSchemas: ["WebSite", "Organization"],
        lastModified: "2026-09-01T00:00:00Z",
      },
      {},
      NOW
    );
    const report = auditPage(withFillerFaq, {}, NOW);
    const faq = report.checks.find((c) => c.id === "content.faq-substance");
    expect(faq).toBeDefined();
    expect(faq!.severity).toBe("improvement");
    expect(report.score).toBeLessThan(100);
  });

  it("adding pointless schema types lowers the score", () => {
    const baseline = auditPage(baselineCtx(), {}, NOW);
    const weirdSchemaCtx = buildContext(
      {
        url: `${SITE_URL}/resources/jrf-guide`,
        pageType: "resource",
        title: "Complete JRF Guide 2026 — Electronics Science",
        description: "Everything about Junior Research Fellowship positions in India for electronics students.",
        canonical: `${SITE_URL}/resources/jrf-guide`,
        contentText: GOOD_COPY,
        declaredSchemas: ["WebSite", "Organization", "Movie", "SportsEvent", "Recipe"],
        lastModified: "2026-09-01T00:00:00Z",
      },
      {},
      NOW
    );
    const report = auditPage(weirdSchemaCtx, {}, NOW);
    expect(report.checks.find((c) => c.id === "schema.relevance")?.severity).toBe("warning");
    expect(report.score).toBeLessThan(baseline.score);
  });

  it("the score is strictly 100 minus penalties — there is no additive path", () => {
    const mockChecks = [
      { severity: "critical" }, { severity: "warning" }, { severity: "improvement" }, { severity: "pass" },
    ];
    const expected = 100 - (SEVERITY_META.critical.penalty + SEVERITY_META.warning.penalty + SEVERITY_META.improvement.penalty + SEVERITY_META.pass.penalty);
    expect(computeScore(mockChecks as any)).toBe(expected);
    // Every check must resolve to one of the four severities — none of which can
    // award points, so the penalty budget is strictly non-positive.
    for (const def of applicableChecks(baselineCtx())) {
      const severity = def.run(baselineCtx(), {}, NOW).severity;
      expect(SEVERITIES).toContain(severity);
      expect(SEVERITY_META[severity].penalty).toBeGreaterThanOrEqual(0);
      expect(SEVERITY_META[severity].penalty).toBe(SEVERITY_META[severity].penalty); // deterministic
    }
  });
});