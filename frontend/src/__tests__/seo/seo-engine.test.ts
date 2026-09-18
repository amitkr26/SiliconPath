import { buildContext, auditPage, runSiteAudit } from "@/lib/seo/engine";
import type { AuditDataset } from "@/lib/seo/data-loader";
import { categoryUrl, SITE_URL } from "@/lib/seo/registry";

const NOW = new Date("2026-09-18T00:00:00Z");

function emptyDataset(): AuditDataset {
  return { opportunities: [], organizations: [], news: [], counts: {}, quality: { totalActive: 0, missingDeadline: 0, missingStipend: 0, missingLink: 0, missingDescription: 0, pending: 0 } };
}

const STRONG_OPP = {
  slug: "drdo-jrf-vlsi-2026",
  title: "Junior Research Fellow (JRF) VLSI at DRDO 2026",
  category: "jrf",
  location: "bengaluru",
  deadline: "2027-01-01",
  verification_status: "verified",
  is_active: true,
  stipend: "Rs. 37,000 per month",
  application_url: "https://rac.gov.in",
  description: "A fully funded Junior Research Fellow position in VLSI at a premier DRDO laboratory. Candidates with a valid NET or GATE score and a masters degree in electronics are encouraged to apply before the deadline.",
  created_at: "2026-06-01T00:00:00Z",
};

describe("runSiteAudit aggregation", () => {
  it("audits the full route graph and produces per-page reports", () => {
    const result = runSiteAudit(emptyDataset(), { now: NOW });
    expect(result.reports.length).toBe(result.summary.auditedPages);
    expect(result.summary.siteUrl).toBe(SITE_URL);
    // Static hubs/resources + 13 programmatic pages (all gated here).
    expect(result.reports.some((r) => r.pageType === "hub")).toBe(true);
    expect(result.reports.some((r) => r.pageType === "resource")).toBe(true);
    for (const r of result.reports) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
      expect(r.appliedChecks + r.skippedChecks).toBe(r.totalChecks);
      expect(r.totalChecks).toBeGreaterThan(20);
    }
    expect(result.summary.averageScore).toBe(
      Math.round(result.reports.reduce((s, r) => s + r.score, 0) / result.reports.length)
    );
  });

  it("aggregates score buckets across the site", () => {
    const result = runSiteAudit(emptyDataset(), { now: NOW });
    const total = result.summary.scoreBuckets.reduce((s, b) => s + b.count, 0);
    expect(total).toBe(result.summary.auditedPages);
  });

  it("audits dynamic category data pages when supply is present", () => {
    const counts = { "cat:jrf": 3 };
    const dataset: AuditDataset = {
      ...emptyDataset(),
      counts,
      opportunities: [STRONG_OPP as any],
    };
    const result = runSiteAudit(dataset, { now: NOW });
    const cat = result.reports.find((r) => r.url === categoryUrl("jrf"));
    expect(cat).toBeDefined();
    expect(cat!.indexable).toBe(true);
    const detail = result.reports.find((r) => r.url === `${SITE_URL}/opportunities/${STRONG_OPP.slug}`);
    expect(detail).toBeDefined();
    expect(detail!.checks.some((c) => c.id === "opportunity-data.detail-completeness")).toBe(true);
  });
});

describe("auditPage scoring", () => {
  it("produces an explainable, penalty-derived score", () => {
    const ctx = buildContext(
      {
        url: "https://berojgardegreewala.vercel.app/resources/jrf-guide",
        pageType: "resource",
        title: "Complete JRF Guide 2026 — Electronics Science",
        description: "Everything about Junior Research Fellowship positions in India for electronics students: eligibility, stipend, exam pattern and application process.",
        canonical: "https://berojgardegreewala.vercel.app/resources/jrf-guide",
        contentText: "A Junior Research Fellowship (JRF) is a funded research position for NET and GATE qualified candidates. The 2026 stipend is Rs. 37,000 per month for the first two years and senior research fellowship is 42,000 per month. DRDO and ISRO advertise openings on a rolling basis and eligibility typically requires a masters degree in electronics with a valid score. The selection process normally involves a written test and an interview. If you want to know how to apply and what the age limit is, this guide walks through each step.",
        declaredSchemas: ["WebSite", "Organization"],
        lastModified: "2026-09-01T00:00:00Z",
      },
      {},
      NOW
    );
    const report = auditPage(ctx, {}, NOW);
    expect(report.score).toBeLessThanOrEqual(100);
    expect(report.summary.pass).toBeGreaterThan(0);
    // A well-formed page can be excellent without hitting 100.
    expect(report.score).toBeGreaterThanOrEqual(70);
    // Thin-content and stuffing checks fire on the deep copy only when data exists.
    expect(report.checks.find((c) => c.id === "content.keyword-stuffing")?.severity).toBe("pass");
  });

  it("does not fake-pass checks whose data was not provided (reported as not applicable)", () => {
    const ctx = buildContext(
      { url: `${SITE_URL}/contact`, pageType: "hub", title: "Contact" },
      {},
      NOW
    );
    const report = auditPage(ctx, {}, NOW);
    // No description provided -> description checks are skipped, not failed and not fake-passed.
    expect(report.checks.find((c) => c.id === "meta.description.present")).toBeUndefined();
    expect(report.checks.find((c) => c.id === "meta.description.length")).toBeUndefined();
  });

  it("a genuinely complete hub page can be excellent at a full 100 without any padding", () => {
    const ctx = buildContext(
      {
        url: `${SITE_URL}/opportunities`,
        pageType: "hub",
        title: "Semiconductor Jobs, JRF Positions & VLSI Opportunities India",
        description: "Verified semiconductor jobs, JRF positions and VLSI opportunities in India updated daily from official DRDO, ISRO and CSIR sources.",
        canonical: `${SITE_URL}/opportunities`,
        contentText:
          "Semiconductor jobs and JRF positions in India are posted here every day. What is a semiconductor research career really like, and how to find the next DRDO or ISRO vacancy? This hub answers the eligibility, stipend and timeline questions for electronics students. The 2026 JRF stipend is Rs. 37,000 per month and senior research fellowship pays Rs. 42,000 per month. Application windows for CSIR NET, RAC scientist B and private VLSI roles open on rolling schedules, so the feed below is refreshed as fresh notices arrive from authoritative institutions. Candidates preparing for interviews can also read the resources about NET versus GATE and the DRDO recruitment process. Every listing links to the official source so readers can verify the deadline and the application link before applying. This page is a discovery surface, not an application portal: it directs candidates to original announcements. The same positions are mirrored across city hubs for Bengaluru, Hyderabad, Noida, Pune, Chennai and Ahmedabad. Because availability changes as notice deadlines pass, only currently available verified openings are shown. Follow the category pages for JRF, SRF, PhD, fellowship, government and international opportunities.",
        declaredSchemas: ["WebSite", "Organization"],
        lastModified: "2026-09-01T00:00:00Z",
      },
      {},
      NOW
    );
    const report = auditPage(ctx, {}, NOW);
    const failures = report.checks.filter((c) => c.severity !== "pass");
    expect(failures).toEqual([]);
    expect(report.score).toBe(100);
  });
});