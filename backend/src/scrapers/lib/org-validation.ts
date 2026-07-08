/**
 * Structural organization-field validation, run at WRITE time.
 *
 * Background: a prior build mapped a scholarship aggregator's byline/author field
 * into `organization`, which went undetected until ~70% of the DB was affected and
 * was then "fixed" with a hardcoded blocklist (`name.includes('Sadia')`) that only
 * caught the specific bad values already seen.
 *
 * This validator is structural, not a blocklist: it accepts values that look like
 * institutions (institutional keyword, or a match against the known organizations
 * table, or the scraper's own source name) and rejects values that structurally
 * look like a scraped personal name / byline artifact. When a value is rejected it
 * falls back to the source name so we never persist a person's name as an org.
 */

const INSTITUTIONAL_KEYWORDS = [
  "institute", "institut", "university", "college", "school", "dept", "department",
  "ltd", "limited", "inc", "incorporated", "corp", "corporation", "llc", "gmbh",
  "pvt", "private", "laboratory", "laboratories", "labs", "lab", "council",
  "centre", "center", "organization", "organisation", "technologies", "technology",
  "systems", "semiconductor", "semiconductors", "electronics", "microelectronics",
  "foundation", "academy", "agency", "bureau", "commission", "ministry", "board",
  "authority", "company", "group", "holdings", "research", "foundry", "solutions",
  "design", "instruments", "devices", "materials", "networks", "micro", "chemical",
  "international", "national", "global", "industries", "labs.", "co",
];

// "Firstname Lastname" or "Firstname M. Lastname" — the classic byline shape.
const PERSON_NAME_RE = /^[A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+$/;

export interface OrgValidationResult {
  valid: boolean;
  /** The value that should actually be persisted (sanitized). */
  value: string;
  reason?: string;
}

export function validateOrganization(
  raw: string | null | undefined,
  opts: { sourceName: string; knownCompanies?: Set<string> }
): OrgValidationResult {
  const fallback = (opts.sourceName ?? "").trim();
  const value = (raw ?? "").trim();

  if (!value) {
    return { valid: false, value: fallback, reason: "empty" };
  }

  const lower = value.toLowerCase();

  // 1) Authoritative accept: matches a known organization, or the scraper's own
  //    source name (which is curated, not scraped).
  if (opts.knownCompanies && opts.knownCompanies.has(lower)) {
    return { valid: true, value };
  }
  if (fallback && (lower === fallback.toLowerCase() || fallback.toLowerCase().includes(lower))) {
    return { valid: true, value };
  }

  // 2) Structural rejects.
  if (value.length < 2 || value.length > 120) {
    return { valid: false, value: fallback, reason: "length-out-of-range" };
  }
  if (/[@]|https?:\/\//i.test(value)) {
    return { valid: false, value: fallback, reason: "contains-url-or-handle" };
  }

  const tokens = lower.split(/[^a-z]+/).filter(Boolean);
  const hasKeyword = tokens.some((t) => INSTITUTIONAL_KEYWORDS.includes(t));
  if (hasKeyword) {
    return { valid: true, value };
  }

  // Two (or "First M. Last") capitalized words and no institutional keyword is
  // the classic scraped-byline/author bug — reject the pattern, not a name list.
  if (PERSON_NAME_RE.test(value)) {
    return { valid: false, value: fallback, reason: "looks-like-person-name" };
  }

  // 3) Ambiguous but not obviously bad — keep it.
  return { valid: true, value };
}
