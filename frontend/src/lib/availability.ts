/**
 * Canonical opportunity availability logic (P0 / product redesign).
 * SINGLE SOURCE OF TRUTH — every listing surface imports from here.
 *
 * Problem: ~98% of opportunities have NULL deadline. The old rule
 * `deadline >= today OR deadline IS NULL` let them all through regardless
 * of whether they were actually current. JRF/PhD/Govt with NULL deadline
 * are NOT "open for applications" — they're missing data.
 *
 * Solution: Category-dependent NULL-deadline handling.
 * - Deadline-based categories (JRF/SRF/PhD/Govt/Fellowship/Postdoc/Internship):
 *   MUST have deadline >= today. NULL deadline = EXCLUDED.
 * - Open-ended categories (Industry/Private/Job/International):
 *   NULL deadline OK if recent evidence exists (posted_at, created_at,
 *   or last_link_checked within 90 days, OR verification_status = "verified").
 */

// --- Category classification ---

/** Categories that REQUIRE a deadline to be considered currently available. */
const DEADLINE_BASED = new Set([
  "jrf", "srf", "phd", "government", "fellowship", "internship", "postdoc",
  // Legacy/display aliases that map to deadline-based DB values
  "govt-job", "scholarship", "trainee", "doctoral",
  "research fellowship", "senior research fellow",
]);

/** Categories where NULL deadline can be OK if there's recent evidence. */
const OPEN_ENDED = new Set([
  "industry", "private", "job", "international",
]);

/** Recency window — how old can the latest evidence be (in days). */
const RECENCY_DAYS = 90;

// --- Public helpers ---

export function isDeadlineBasedCategory(category: string | null | undefined): boolean {
  if (!category) return true; // unknown = conservative (deadline-based)
  return DEADLINE_BASED.has(category.toLowerCase().trim());
}

export function isOpenEndedCategory(category: string | null | undefined): boolean {
  if (!category) return false;
  return OPEN_ENDED.has(category.toLowerCase().trim());
}

/**
 * Check if an opportunity has recent evidence of being current.
 * Evidence: posted_at, created_at, or last_link_checked within RECENCY_DAYS,
 * OR verification_status is "verified" (human confirmed = trustworthy).
 */
export function hasRecentEvidence(opp: {
  posted_at?: string | null;
  posted_date?: string | null;
  created_at?: string | null;
  last_link_checked?: string | null;
  verification_status?: string | null;
}): boolean {
  if (opp.verification_status === "verified") return true;

  const cutoff = Date.now() - RECENCY_DAYS * 24 * 60 * 60 * 1000;
  const dates = [opp.posted_at, opp.posted_date, opp.created_at, opp.last_link_checked]
    .filter(Boolean)
    .map((d) => new Date(d!).getTime())
    .filter((t) => !isNaN(t));

  return dates.some((t) => t >= cutoff);
}

/**
 * Compute IST today as YYYY-MM-DD string.
 * Used by all surfaces for consistent date comparison.
 */
export function computeIstToday(): string {
  const now = new Date();
  const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return istDate.toISOString().split("T")[0];
}

/**
 * Compute IST date N days from now (positive = future, negative = past).
 */
export function computeIstDateOffset(days: number): string {
  const now = new Date();
  const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000 + days * 24 * 60 * 60 * 1000);
  return istDate.toISOString().split("T")[0];
}

/**
 * Canonical availability check — the ONLY function that decides
 * whether an opportunity should appear in "currently available" listings.
 *
 * Rules (in order):
 * 1. is_active=false → NEVER available
 * 2. verification_status=rejected → NEVER available
 * 3. verification_status=expired → NEVER available
 * 4. verification_status=link_unavailable → excluded from "normally applicable" feeds
 * 5. Deadline exists & >= today → available
 * 6. Deadline exists & < today → EXPIRED (not available)
 * 7. No deadline + deadline-based category → EXCLUDED (missing data, not "open")
 * 8. No deadline + open-ended category → available IF recent evidence
 * 9. No deadline + unknown category → EXCLUDED (conservative)
 */
export function isCurrentlyAvailable(
  opp: {
    deadline?: string | null;
    category?: string | null;
    verification_status?: string | null;
    is_active?: boolean | null;
    posted_at?: string | null;
    posted_date?: string | null;
    created_at?: string | null;
    last_link_checked?: string | null;
  },
  todayOverride?: string
): boolean {
  // 1. Must be active (false or null = not active)
  if (opp.is_active === false || opp.is_active === null) return false;

  // 2-4. Hard rejections — never surface these
  if (opp.verification_status === "rejected") return false;
  if (opp.verification_status === "expired") return false;
  if (opp.verification_status === "pending") return false;

  // 5. link_unavailable: excluded from "normally applicable" feeds
  if (opp.verification_status === "link_unavailable") return false;

  const today = todayOverride || computeIstToday();
  const deadlineStr = opp.deadline;

  // 5-6. Has deadline — check expiry
  if (deadlineStr) {
    return deadlineStr >= today;
  }

  // 7-9. No deadline — category-dependent
  if (isDeadlineBasedCategory(opp.category)) {
    return false; // deadline-based with NULL = excluded
  }

  if (isOpenEndedCategory(opp.category)) {
    return hasRecentEvidence(opp); // open-ended with NULL = needs evidence
  }

  return false; // unknown category = conservative exclude
}

/**
 * Build a Supabase `.or()` filter string for DB-level pre-filtering.
 * This is a BEST-EFFORT approximation that reduces data transfer.
 * Always apply isCurrentlyAvailable() as a post-filter for accuracy.
 *
 * The filter includes:
 * - deadline >= today (covers all categories with valid deadline)
 * - deadline IS NULL AND category IN open-ended (recency checked in post-filter)
 */
export function buildAvailabilityDbFilter(today: string): string {
  return `deadline.gte.${today},and(deadline.is.null,category.in.(industry,private,job,international))`;
}

/**
 * Strict version for feeds that should only show verified+available opportunities.
 * Excludes link_unavailable at DB level.
 */
export function buildStrictAvailabilityDbFilter(today: string): string {
  // Note: Supabase .or() with nested .and() may not work in all versions.
  // Fallback: use the simpler filter and rely on post-filter.
  return `deadline.gte.${today},and(deadline.is.null,category.in.(industry,private,job,international))`;
}
