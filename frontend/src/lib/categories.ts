// Canonical opportunity category vocabulary (QA audit P2).
// Grounded in the filter branches the platform itself uses (see
// lib/opportunities-query.ts) and the legacy DB values (jrf/srf/phd/…).
// Any category NOT in this set is rejected with a validation error — it must
// never silently become an unfiltered search.

const CANONICAL_CATEGORIES = new Set([
  "All",
  // display values used by the UI filter bar
  "Research Fellowship", "PhD Scholarship", "Full-time", "Internship", "Trainee",
  // legacy DB values
  "jrf", "srf", "phd", "fellowship", "scholarship", "job", "private",
  "govt-job", "internship", "trainee", "government", "industry",
]);

export function isCanonicalCategory(value: string): boolean {
  return CANONICAL_CATEGORIES.has(value);
}

export function canonicalCategories(): string[] {
  return Array.from(CANONICAL_CATEGORIES);
}
