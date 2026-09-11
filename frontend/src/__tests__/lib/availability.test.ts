/**
 * Canonical availability logic tests (P0 / product redesign).
 * Covers all 11 test cases from the product redesign spec.
 */
import {
  isCurrentlyAvailable,
  isDeadlineBasedCategory,
  isOpenEndedCategory,
  hasRecentEvidence,
  computeIstToday,
  computeIstDateOffset,
  buildAvailabilityDbFilter,
} from "@/lib/availability";

// Fix "today" to a known date for deterministic tests.
// 2026-08-23 is a Saturday.
const TODAY = "2026-08-23";

// --- Category classification ---

describe("isDeadlineBasedCategory", () => {
  it("returns true for deadline-based categories", () => {
    expect(isDeadlineBasedCategory("jrf")).toBe(true);
    expect(isDeadlineBasedCategory("srf")).toBe(true);
    expect(isDeadlineBasedCategory("phd")).toBe(true);
    expect(isDeadlineBasedCategory("government")).toBe(true);
    expect(isDeadlineBasedCategory("fellowship")).toBe(true);
    expect(isDeadlineBasedCategory("internship")).toBe(true);
    expect(isDeadlineBasedCategory("postdoc")).toBe(true);
    expect(isDeadlineBasedCategory("govt-job")).toBe(true);
    expect(isDeadlineBasedCategory("scholarship")).toBe(true);
  });

  it("returns false for open-ended categories", () => {
    expect(isDeadlineBasedCategory("industry")).toBe(false);
    expect(isDeadlineBasedCategory("private")).toBe(false);
    expect(isDeadlineBasedCategory("job")).toBe(false);
    expect(isDeadlineBasedCategory("international")).toBe(false);
  });

  it("returns true for null/undefined (conservative)", () => {
    expect(isDeadlineBasedCategory(null)).toBe(true);
    expect(isDeadlineBasedCategory(undefined)).toBe(true);
    expect(isDeadlineBasedCategory("")).toBe(true);
  });
});

describe("isOpenEndedCategory", () => {
  it("returns true for open-ended categories", () => {
    expect(isOpenEndedCategory("industry")).toBe(true);
    expect(isOpenEndedCategory("private")).toBe(true);
    expect(isOpenEndedCategory("job")).toBe(true);
    expect(isOpenEndedCategory("international")).toBe(true);
  });

  it("returns false for deadline-based categories", () => {
    expect(isOpenEndedCategory("jrf")).toBe(false);
    expect(isOpenEndedCategory("phd")).toBe(false);
    expect(isOpenEndedCategory("government")).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isOpenEndedCategory(null)).toBe(false);
    expect(isOpenEndedCategory(undefined)).toBe(false);
  });
});

// --- hasRecentEvidence ---

describe("hasRecentEvidence", () => {
  it("returns true when verification_status is verified", () => {
    expect(hasRecentEvidence({ verification_status: "verified" })).toBe(true);
    expect(hasRecentEvidence({ verification_status: "verified", posted_at: "2020-01-01" })).toBe(true);
  });

  it("returns true when posted_at is within 90 days", () => {
    const recent = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(hasRecentEvidence({ posted_at: recent })).toBe(true);
  });

  it("returns true when created_at is within 90 days", () => {
    const recent = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    expect(hasRecentEvidence({ created_at: recent })).toBe(true);
  });

  it("returns true when last_link_checked is within 90 days", () => {
    const recent = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(hasRecentEvidence({ last_link_checked: recent })).toBe(true);
  });

  it("returns false when all evidence is stale (>90 days)", () => {
    const stale = "2020-01-01T00:00:00Z";
    expect(hasRecentEvidence({
      posted_at: stale,
      created_at: stale,
      last_link_checked: stale,
      verification_status: "pending",
    })).toBe(false);
  });

  it("returns false when no evidence exists", () => {
    expect(hasRecentEvidence({ verification_status: "pending" })).toBe(false);
  });
});

// --- isCurrentlyAvailable (11 test cases) ---

describe("isCurrentlyAvailable", () => {
  // Test 1: Future deadline → AVAILABLE
  it("test 1: opportunity with future deadline is available", () => {
    expect(isCurrentlyAvailable({
      category: "jrf",
      deadline: "2026-12-31",
      verification_status: "verified",
      is_active: true,
    }, TODAY)).toBe(true);
  });

  // Test 2: Today's deadline → AVAILABLE (last day to apply)
  it("test 2: opportunity with today deadline is available", () => {
    expect(isCurrentlyAvailable({
      category: "jrf",
      deadline: TODAY,
      verification_status: "verified",
      is_active: true,
    }, TODAY)).toBe(true);
  });

  // Test 3: Yesterday's deadline → EXPIRED (not available)
  it("test 3: opportunity with yesterday deadline is expired", () => {
    expect(isCurrentlyAvailable({
      category: "jrf",
      deadline: "2026-08-22",
      verification_status: "verified",
      is_active: true,
    }, TODAY)).toBe(false);
  });

  // Test 4: verification_status=rejected → NEVER available
  it("test 4: rejected opportunity is never available", () => {
    expect(isCurrentlyAvailable({
      category: "jrf",
      deadline: "2026-12-31",
      verification_status: "rejected",
      is_active: true,
    }, TODAY)).toBe(false);
  });

  // Test 5: verification_status=expired → NEVER available
  it("test 5: expired-status opportunity is never available", () => {
    expect(isCurrentlyAvailable({
      category: "jrf",
      deadline: "2026-12-31",
      verification_status: "expired",
      is_active: true,
    }, TODAY)).toBe(false);
  });

  // Test 6: Deadline-based category + NULL deadline → EXCLUDED
  it("test 6: deadline-based with NULL deadline is excluded", () => {
    expect(isCurrentlyAvailable({
      category: "jrf",
      deadline: null,
      verification_status: "verified",
      is_active: true,
    }, TODAY)).toBe(false);

    expect(isCurrentlyAvailable({
      category: "phd",
      deadline: null,
      verification_status: "verified",
      is_active: true,
    }, TODAY)).toBe(false);

    expect(isCurrentlyAvailable({
      category: "government",
      deadline: null,
      verification_status: "verified",
      is_active: true,
    }, TODAY)).toBe(false);

    expect(isCurrentlyAvailable({
      category: "fellowship",
      deadline: null,
      verification_status: "verified",
      is_active: true,
    }, TODAY)).toBe(false);

    expect(isCurrentlyAvailable({
      category: "srf",
      deadline: null,
      verification_status: "verified",
      is_active: true,
    }, TODAY)).toBe(false);

    expect(isCurrentlyAvailable({
      category: "postdoc",
      deadline: null,
      verification_status: "verified",
      is_active: true,
    }, TODAY)).toBe(false);
  });

  // Test 7: Open-ended category + NULL deadline + recent evidence → AVAILABLE
  it("test 7: open-ended with NULL deadline and recent evidence is available", () => {
    const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    expect(isCurrentlyAvailable({
      category: "industry",
      deadline: null,
      verification_status: "verified",
      is_active: true,
      posted_at: recentDate,
    }, TODAY)).toBe(true);

    expect(isCurrentlyAvailable({
      category: "private",
      deadline: null,
      verification_status: "verified",
      is_active: true,
    }, TODAY)).toBe(true);

    expect(isCurrentlyAvailable({
      category: "job",
      deadline: null,
      verification_status: "verified",
      is_active: true,
      created_at: recentDate,
    }, TODAY)).toBe(true);
  });

  // Test 8: Open-ended + NULL deadline + no recent evidence → EXCLUDED
  it("test 8: open-ended with NULL deadline and stale evidence is excluded", () => {
    expect(isCurrentlyAvailable({
      category: "industry",
      deadline: null,
      verification_status: "pending",
      is_active: true,
      posted_at: "2020-01-01T00:00:00Z",
      created_at: "2020-01-01T00:00:00Z",
    }, TODAY)).toBe(false);
  });

  // Test 9: verification_status=link_unavailable → excluded from feeds
  it("test 9: link_unavailable opportunity is excluded from feeds", () => {
    expect(isCurrentlyAvailable({
      category: "jrf",
      deadline: "2026-12-31",
      verification_status: "link_unavailable",
      is_active: true,
    }, TODAY)).toBe(false);

    expect(isCurrentlyAvailable({
      category: "industry",
      deadline: null,
      verification_status: "link_unavailable",
      is_active: true,
      posted_at: new Date().toISOString(),
    }, TODAY)).toBe(false);
  });

  // Test 10: Detail page expired banner — deadline-based with past deadline
  it("test 10: detail page shows expired for past deadline", () => {
    const opp = {
      category: "government",
      deadline: "2026-08-01",
      verification_status: "verified",
      is_active: true,
    };
    expect(isCurrentlyAvailable(opp, TODAY)).toBe(false);
  });

  // Test 11: Homepage and search consistency — same query, same result
  it("test 11: homepage and search return consistent availability", () => {
    // A JRF with future deadline should be available on both surfaces
    const jrfOpp = {
      category: "jrf",
      deadline: "2026-09-15",
      verification_status: "verified",
      is_active: true,
    };
    expect(isCurrentlyAvailable(jrfOpp, TODAY)).toBe(true);

    // A JRF with NULL deadline should be unavailable on both surfaces
    const jrfNull = {
      category: "jrf",
      deadline: null,
      verification_status: "verified",
      is_active: true,
    };
    expect(isCurrentlyAvailable(jrfNull, TODAY)).toBe(false);

    // An industry opp with NULL deadline + recent posted_at should be available on both
    const industryOpp = {
      category: "industry",
      deadline: null,
      verification_status: "verified",
      is_active: true,
      posted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    };
    expect(isCurrentlyAvailable(industryOpp, TODAY)).toBe(true);
  });
});

// --- Edge cases ---

describe("isCurrentlyAvailable edge cases", () => {
  it("is_active=false → not available", () => {
    expect(isCurrentlyAvailable({
      category: "jrf",
      deadline: "2026-12-31",
      verification_status: "verified",
      is_active: false,
    }, TODAY)).toBe(false);
  });

  it("is_active=null → not available", () => {
    expect(isCurrentlyAvailable({
      category: "jrf",
      deadline: "2026-12-31",
      verification_status: "verified",
      is_active: null,
    }, TODAY)).toBe(false);
  });

  it("unknown category + NULL deadline → excluded (conservative)", () => {
    expect(isCurrentlyAvailable({
      category: "something-unknown",
      deadline: null,
      verification_status: "verified",
      is_active: true,
    }, TODAY)).toBe(false);
  });

  it("null category + NULL deadline → excluded (conservative)", () => {
    expect(isCurrentlyAvailable({
      category: null,
      deadline: null,
      verification_status: "verified",
      is_active: true,
    }, TODAY)).toBe(false);
  });

  it("deadline string before today string (lexicographic) → expired", () => {
    expect(isCurrentlyAvailable({
      category: "jrf",
      deadline: "2025-12-31",
      verification_status: "verified",
      is_active: true,
    }, TODAY)).toBe(false);
  });

  it("deadline string equal to today → available", () => {
    expect(isCurrentlyAvailable({
      category: "government",
      deadline: TODAY,
      verification_status: "verified",
      is_active: true,
    }, TODAY)).toBe(true);
  });
});

// --- computeIstToday / computeIstDateOffset ---

describe("computeIstToday", () => {
  it("returns YYYY-MM-DD string in IST", () => {
    const result = computeIstToday();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("computeIstDateOffset", () => {
  it("returns future date with positive offset", () => {
    const result = computeIstDateOffset(7);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result > computeIstToday()).toBe(true);
  });

  it("returns past date with negative offset", () => {
    const result = computeIstDateOffset(-7);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result < computeIstToday()).toBe(true);
  });
});

// --- buildAvailabilityDbFilter ---

describe("buildAvailabilityDbFilter", () => {
  it("returns a string containing deadline.gte and deadline.is.null", () => {
    const filter = buildAvailabilityDbFilter(TODAY);
    expect(filter).toContain(`deadline.gte.${TODAY}`);
    expect(filter).toContain("deadline.is.null");
    expect(filter).toContain("category.in.");
  });
});
