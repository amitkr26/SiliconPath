/**
 * Pure opportunity-normalization helpers ported 1:1 from the production
 * frontend (`frontend/src/lib/scrapers/utils.ts` + the insert-time mapping in
 * `frontend/src/lib/scrapers/run-opportunity-scrape.ts`). Phase 8 replica
 * keeps these identical so dedup + category/deadline conversion stay the same
 * contract on both sides. Zero runtime imports — runs anywhere.
 */

export interface ScrapedOpportunity {
  title: string;
  organization: string;
  category: string;
  location: string | null;
  stipend: string | null;
  deadline: string | null;
  eligibility: string | null;
  description: string | null;
  apply_link: string | null;
  source_url: string;
  tags: string[];
}

export const GARBAGE_TITLE_PATTERNS = /home|contact|sitemap|about|privacy|terms|login|sign in|register|apply now|download|click here|read more|view all|payment gateway|at a glance|departments|reference designs|quick links|useful links|important links|all rights reserved|copyright|disclaimer|help|faq|search|skip to main content|breadcrumb|you are here|news & events|photo gallery|tender|archive|annual report|right to information/i;

export function cleanTitle(title: string, organization: string): string {
  let t = title.trim();

  // "invites applications from eligible doctors for the post of [X]" → "[X] — [Org]"
  const postMatch = t.match(/for the post of\s+(.+?)(?:\s+on\s+contract|\s+in\s+the|\s*$)/i);
  if (postMatch) {
    return `${postMatch[1].trim()} — ${organization}`;
  }

  // "Junior Research Fellow in [Area] at [Lab]" → "JRF — [Lab Name]"
  if (/junior research fellow/i.test(t)) {
    const labMatch = t.match(/at\s+(.+?)(?:\s+-\s+|\s*$)/i);
    const lab = labMatch ? labMatch[1].trim() : organization;
    return `JRF — ${lab}`;
  }

  // "Senior Research Fellow" → "SRF — [Org]"
  if (/senior research fellow/i.test(t)) {
    const labMatch = t.match(/at\s+(.+?)(?:\s+-\s+|\s*$)/i);
    const lab = labMatch ? labMatch[1].trim() : organization;
    return `SRF — ${lab}`;
  }

  // Remove trailing "apply by..." or "last date..." or "deadline..."
  t = t.replace(/\s*[-–]\s*(?:apply\s+by|last\s+date|deadline).*$/i, "").trim();

  // Glued employment-type suffixes from ATS sources: "...Engineer)Full-time"
  // → "...Engineer) Full-time". Only when glued (no space) so real titles
  // like "Full-time Faculty" are untouched.
  t = t.replace(/(\S)(full-?time|part-?time|full ?time|part ?time)(?=\s|$)/gi, "$1 $2");

  return t.trim();
}

export function slugify(name: string, maxLen = 80): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, maxLen)
    .replace(/-+$/, "");
}

export function normalizeUrl(urlStr: string): string {
  if (!urlStr) return "";
  try {
    const url = new URL(urlStr.trim());
    const paramsToRemove = [
      "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
      "ref", "ref_", "origin", "source", "gclid", "fbclid"
    ];
    paramsToRemove.forEach(p => url.searchParams.delete(p));
    let normalized = url.toString();
    if (normalized.endsWith("/") && url.pathname !== "/") {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    let clean = urlStr.trim();
    const qIndex = clean.indexOf("?");
    if (qIndex !== -1) {
      const base = clean.slice(0, qIndex);
      const query = clean.slice(qIndex + 1);
      const parts = query.split("&").filter(p => {
        const key = p.split("=")[0].toLowerCase();
        return !["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref", "ref_", "origin", "source"].includes(key);
      });
      return parts.length > 0 ? `${base}?${parts.join("&")}` : base;
    }
    return clean;
  }
}

/**
 * Insert-time category mapping from the production pipeline. Values must pass
 * the live CHECK constraint on `opportunities.category` (all lowercase:
 * jrf/srf/phd/postdoc/industry/government/fellowship/internship).
 */
export const CATEGORY_MAP: Record<string, string> = {
  "jrf": "jrf", "JRF": "jrf",
  "srf": "srf", "SRF": "srf",
  "phd": "phd", "PhD": "phd", "PHD": "phd",
  "postdoc": "postdoc", "PostDoc": "postdoc", "Research Associate": "postdoc",
  "fellowship": "fellowship", "Fellowship": "fellowship", "Research Fellow": "fellowship",
  "internship": "internship", "Internship": "internship",
  "government": "government", "Govt Job": "government",
  "industry": "industry", "Tech Job": "industry", "Electronics": "industry",
  "Engineering": "industry", "Private Job": "industry"
};

export function normalizeCategory(category: string | undefined): string {
  return CATEGORY_MAP[category ?? ""] ?? "government";
}

/**
 * Deadline → YYYY-MM-DD (live `deadline` column is a date). Mirrors the
 * production parser: DD.MM.YYYY / DD/MM/YYYY / YYYY-MM-DD, else null.
 */
export function toDeadlineDate(deadline: string | null | undefined): string | null {
  if (!deadline) return null;
  const dd = deadline.match(/(\d{2})[.\/](\d{2})[.\/](\d{4})/);
  if (dd) return `${dd[3]}-${dd[2]}-${dd[1]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return deadline;
  return null;
}