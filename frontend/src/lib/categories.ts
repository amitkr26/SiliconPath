// Canonical opportunity category vocabulary (QA audit P2).
// Grounded in the filter branches the platform itself uses (see
// lib/opportunities-query.ts) and the legacy DB values (jrf/srf/phd/…).
// Any category NOT in this set is rejected with a validation error — it must
// never silently become an unfiltered search.

// Category vocabulary (QA audit P2).
// The LIVE Supabase column carries a CHECK constraint that accepts exactly:
//   jrf, srf, phd, government, fellowship, internship, industry
// (verified empirically — "govt-job"/"job"/"private"/"scholarship" are
// rejected at write time). That constraint IS the canonical storage
// vocabulary; every legacy/display label is mapped onto it here so scrapers
// never fail to insert and old query params never break.

const CANONICAL_CATEGORIES = new Set([
  "All",
  // display values used by the UI filter bar
  "Research Fellowship", "PhD Scholarship", "Full-time", "Internship", "Trainee",
  // constraint-backed DB values
  "jrf", "srf", "phd", "government", "fellowship", "internship", "industry",
  // legacy accepted for backward compat (normalized before validation)
  "job", "private", "govt-job", "scholarship", "trainee",
]);

export function isCanonicalCategory(value: string): boolean {
  return CANONICAL_CATEGORIES.has(value);
}

// Legacy/display category strings -> constraint-safe storage values.
// Applied at write time (scrapers) and accepted at read time (API params).
const CATEGORY_ALIASES: Record<string, string> = {
  "government": "government",
  "govt": "government",
  "govt job": "government",
  "govt-job": "government",
  "private": "industry",
  "private job": "industry",
  "job": "industry",
  "scholarship": "fellowship",
  "trainee": "internship",
};

export function normalizeCategory(value: string | null | undefined): string {
  if (!value) return "jrf"; // scrape sink default (historical behavior)
  const key = value.trim().toLowerCase();
  return CATEGORY_ALIASES[key] || key;
}

// Backwards-compatible query-param normalization: "JRF", "Govt Job",
// "government", "govt-job" etc. all map onto the constraint vocabulary.
export function normalizeCategoryParam(value: string | null | undefined): string {
  if (!value) return "All";
  return normalizeCategory(value);
}

export function canonicalCategories(): string[] {
  return Array.from(CANONICAL_CATEGORIES);
}
