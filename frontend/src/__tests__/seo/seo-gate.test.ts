import { evaluateProgrammaticGate, isProgrammaticallyIndexable, PROGRAMMATIC_INDEX_THRESHOLD } from "@/lib/seo/gate";
import { countsFromAvailable } from "@/lib/seo/data-loader";
import { runSiteAudit } from "@/lib/seo/engine";
import { categoryUrl, locationUrl } from "@/lib/seo/registry";
import type { AuditDataset } from "@/lib/seo/data-loader";

const NOW = new Date("2026-09-18T00:00:00Z");

function availableRow(slug: string, category: string, location: string) {
  return {
    slug,
    title: `${category} opportunity title for SEO gate`,
    category,
    location,
    deadline: "2027-01-01",
    verification_status: "verified",
    is_active: true,
    created_at: "2026-06-01T00:00:00Z",
  };
}

function emptyDataset(): AuditDataset {
  return { opportunities: [], organizations: [], news: [], counts: {}, quality: { totalActive: 0, missingDeadline: 0, missingStipend: 0, missingLink: 0, missingDescription: 0, pending: 0 } };
}

describe("Programmatic SEO Quality Gate", () => {
  it("indexes combinations with >= 3 active verified opportunities (index,follow)", () => {
    const gate = evaluateProgrammaticGate({ category: "jrf" }, 3);
    expect(gate).toBeDefined();
    expect(gate!.indexable).toBe(true);
    expect(gate!.directive).toBe("index,follow");
    expect(gate!.threshold).toBe(PROGRAMMATIC_INDEX_THRESHOLD);
    expect(gate!.activeVerifiedCount).toBe(3);
  });

  it("fails closed with noindex,follow when 1–2 active verified opportunities exist", () => {
    const gate = evaluateProgrammaticGate({ category: "jrf" }, 2);
    expect(gate!.indexable).toBe(false);
    expect(gate!.directive).toBe("noindex,follow");
    const gate1 = evaluateProgrammaticGate({ location: "pune" }, 1);
    expect(gate1!.indexable).toBe(false);
    expect(gate1!.directive).toBe("noindex,follow");
  });

  it("omits the URL entirely when there are zero listings (no doorway pages)", () => {
    const gate = evaluateProgrammaticGate({ category: "srf" }, 0);
    expect(gate!.indexable).toBe(false);
    expect(gate!.directive).toBe("omit");
    expect(gate!.reason).toContain("0 active verified");
  });

  it("treats undefined dimensions as non-gated", () => {
    expect(evaluateProgrammaticGate(undefined, 1)).toBeUndefined();
    expect(isProgrammaticallyIndexable(undefined, 1)).toBe(true);
  });

  it("isProgrammaticallyIndexable reflects the threshold exactly", () => {
    expect(isProgrammaticallyIndexable({ category: "phd" }, 3)).toBe(true);
    expect(isProgrammaticallyIndexable({ category: "phd" }, 2)).toBe(false);
    expect(isProgrammaticallyIndexable({ location: "noida" }, 0)).toBe(false);
  });
});

describe("countsFromAvailable (gate input)", () => {
  it("counts verified active rows per category and location alias", () => {
    const rows = [
      availableRow("a1", "jrf", "bengaluru"),
      availableRow("a2", "jrf", "bengaluru"),
      availableRow("a3", "jrf", "bangalore"), // alias for bengaluru
      availableRow("b1", "government", "noida"),
      availableRow("b2", "government", "noida"),
      availableRow("b3", "government", "greater noida"), // alias for noida
    ];
    const counts = countsFromAvailable(rows as any);
    // jrf -> category 'jrf' (3), bengaluru location (3), noida location (3)
    expect(counts["cat:jrf"]).toBe(3);
    expect(counts["cat:govt-job"]).toBe(3);
    expect(counts["loc:bengaluru"]).toBe(3);
    expect(counts["loc:noida"]).toBe(3);
  });
});

describe("runSiteAudit gate enforcement", () => {
  it("flags every sub-threshold programmatic page as a gate violation", () => {
    const result = runSiteAudit(emptyDataset(), { now: NOW });
    const programmatic = result.reports.filter((r) => r.pageType === "category" || r.pageType === "location");
    expect(programmatic.length).toBe(18); // 7 categories + 6 locations + 5 role hubs
    expect(programmatic.every((r) => r.indexable === false)).toBe(true);
    expect(result.gateViolations.length).toBe(18);
    expect(result.summary.gatedPages).toBe(18);
    expect(result.summary.indexablePages).toBe(result.summary.auditedPages - 18);
    expect(result.summary.gateViolations.length).toBe(18);
    expect(result.summary.gateViolations[0].kind).toBe("sub-threshold-programmatic-page");
    expect(result.summary.gateViolations[0].threshold).toBe(PROGRAMMATIC_INDEX_THRESHOLD);
  });

  it("indexes programmatic pages backed by sufficient verified supply", () => {
    const counts: Record<string, number> = {};
    for (const cat of ["jrf", "srf", "phd", "govt-job", "fellowship", "private", "international"]) {
      counts["cat:" + cat] = 3;
    }
    for (const city of ["bengaluru", "hyderabad", "noida", "pune", "chennai", "ahmedabad"]) {
      counts["loc:" + city] = 3;
    }
    for (const role of ["physical-design", "rtl-design", "design-verification", "dft", "embedded-systems"]) {
      counts["role:" + role] = 3;
    }
    const result = runSiteAudit({ ...emptyDataset(), counts }, { now: NOW });
    expect(result.reports.filter((r) => r.pageType === "category" || r.pageType === "location").every((r) => r.indexable)).toBe(true);
    expect(result.gateViolations.length).toBe(0);
    expect(result.summary.gatedPages).toBe(0);
  });

  it("emits robots noindex on gated pages and index on passable pages", () => {
    const counts: Record<string, number> = {};
    for (const cat of ["jrf", "srf", "phd", "govt-job", "fellowship", "private", "international"]) counts["cat:" + cat] = 3;
    for (const city of ["bengaluru", "hyderabad", "noida", "pune", "chennai", "ahmedabad"]) counts["loc:" + city] = 3;
    const yes = runSiteAudit({ ...emptyDataset(), counts: { ...counts, "cat:govt-job": 2 } }, { now: NOW });
    const gated = yes.reports.find((r) => r.url === categoryUrl("govt-job"))!;
    const open = yes.reports.find((r) => r.url === categoryUrl("jrf"))!;
    expect(open.indexable).toBe(true);
    expect(gated.indexable).toBe(false);
    expect(gated.gate!.directive).toBe("noindex,follow");
  });
});