// Duplicate detection (Phase 10 of CONTENT_UPGRADE_PLAN.md).
// Keys: canonical URL, normalized source URL, title similarity, content overlap.

export function canonicalUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "ref", "source"]) {
      u.searchParams.delete(key);
    }
    const host = u.hostname.replace(/^www\./, "");
    let path = u.pathname.replace(/\/+$/, "") || "/";
    path = path.replace(/\/index\.html?$/i, "") || "/";
    return `${u.protocol}//${host}${path}${u.search ? "?" + u.search : ""}`.toLowerCase();
  } catch {
    return url.toLowerCase().trim();
  }
}

export function titleTokens(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2)
    // pure year tokens ("2026") don't distinguish a posting — "JRF at DRDO 2026"
    // vs "JRF at DRDO" is the same posting family
    .filter((t) => !/^\d{4}$/.test(t))
    .filter((t) => !["the", "and", "for", "with", "from", "this", "that", "you", "are", "was", "not", "all", "any", "but", "can", "has", "had", "have", "its", "may", "per"].includes(t));
}

/** Token Jaccard similarity in [0,1]. 1 = identical token sets. */
export function titleSimilarity(a: string, b: string): number {
  const ta = titleTokens(a);
  const tb = titleTokens(b);
  if (ta.length === 0 && tb.length === 0) return 1;
  if (ta.length === 0 || tb.length === 0) return 0;
  const setA = new Set(ta);
  const setB = new Set(tb);
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter++;
  const union = new Set([...setA, ...setB]).size;
  return inter / union;
}

export interface DuplicateCheck {
  /** normalized URL for direct compare against stored source_url / url */
  normalizedUrl: string;
  /** true when titles are near-identical (>= threshold) */
  isDuplicateTitle: boolean;
}

/** Normalize + compare a scraped item against an existing row. */
export function checkDuplicate(input: {
  sourceUrl: string;
  title: string;
  existingUrl?: string | null;
  existingTitle?: string | null;
  threshold?: number;
}): DuplicateCheck {
  const threshold = input.threshold ?? 0.85;
  const normalizedUrl = canonicalUrl(input.sourceUrl);
  const sameUrl =
    !!input.existingUrl && canonicalUrl(input.existingUrl) === normalizedUrl;
  const sim =
    input.existingTitle != null && input.existingTitle !== ""
      ? titleSimilarity(input.title, input.existingTitle)
      : 0;
  return {
    normalizedUrl,
    isDuplicateTitle: sameUrl || sim >= threshold,
  };
}