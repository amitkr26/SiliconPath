/**
 * Structural organization-field validation, run at WRITE time — exists BEFORE the
 * first scraper write (Phase 1 requirement), not retrofitted after contamination.
 *
 * A prior build mapped a scholarship aggregator's byline/author into `organization`
 * and only "fixed" it with a hardcoded blocklist of specific names. This validator
 * is structural: it accepts institution-shaped values and rejects person-name-shaped
 * values, then falls back to the curated source name so a person's name is never
 * persisted as an organization.
 */

export const INSTITUTIONAL_KEYWORDS: readonly string[] = [
  "institute", "institut", "university", "college", "school", "dept", "department",
  "ltd", "limited", "inc", "incorporated", "corp", "corporation", "llc", "gmbh",
  "pvt", "private", "laboratory", "laboratories", "labs", "lab", "council",
  "centre", "center", "organization", "organisation", "technologies", "technology",
  "systems", "semiconductor", "semiconductors", "electronics", "microelectronics",
  "foundation", "academy", "agency", "bureau", "commission", "ministry", "board",
  "authority", "company", "group", "holdings", "research", "foundry", "solutions",
  "design", "instruments", "devices", "materials", "networks", "chemical",
  "international", "national", "global", "industries",
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
  opts: { sourceName: string; knownCompanies?: ReadonlySet<string> }
): OrgValidationResult {
  const fallback = (opts.sourceName ?? "").trim();
  const value = (raw ?? "").trim();

  if (!value) return { valid: false, value: fallback, reason: "empty" };

  const lower = value.toLowerCase();

  // Authoritative accepts.
  if (opts.knownCompanies?.has(lower)) return { valid: true, value };
  if (fallback && (lower === fallback.toLowerCase() || fallback.toLowerCase().includes(lower))) {
    return { valid: true, value };
  }

  // Structural rejects.
  if (value.length < 2 || value.length > 120) return { valid: false, value: fallback, reason: "length-out-of-range" };
  if (/[@]|https?:\/\//i.test(value)) return { valid: false, value: fallback, reason: "contains-url-or-handle" };

  const tokens = lower.split(/[^a-z]+/).filter(Boolean);
  if (tokens.some((t) => INSTITUTIONAL_KEYWORDS.includes(t))) return { valid: true, value };

  if (PERSON_NAME_RE.test(value)) return { valid: false, value: fallback, reason: "looks-like-person-name" };

  return { valid: true, value };
}
