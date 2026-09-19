// Internal linking (Phase 9 of CONTENT_UPGRADE_PLAN.md).
// Related items are scored by (1) organization match, (2) primary category
// match, (3) keyword overlap. Read-time top-N — no hundreds of links.

export interface LinkableItem {
  id: string;
  title: string;
  organization?: string | null;
  primaryCategory?: string | null;
  keywords?: string[];
}

export function scoreRelated(
  source: LinkableItem,
  candidate: LinkableItem,
  sourceKeywords: string[] = []
): number {
  let score = 0;
  const srcOrg = (source.organization || "").toLowerCase();
  const candOrg = (candidate.organization || "").toLowerCase();
  if (srcOrg && candOrg && srcOrg === candOrg) score += 5;
  const srcCat = (source.primaryCategory || "").toLowerCase();
  const candCat = (candidate.primaryCategory || "").toLowerCase();
  if (srcCat && candCat && srcCat === candCat) score += 2;
  const candText = `${candidate.title} ${(candidate.keywords || []).join(" ")}`.toLowerCase();
  for (const kw of sourceKeywords) {
    if (kw.length > 3 && candText.includes(kw.toLowerCase())) score += 1;
  }
  return score;
}

/** Pick top-N related items with score > 0 — meaningfully related only. */
export function findRelated(
  source: LinkableItem,
  candidates: LinkableItem[],
  sourceKeywords: string[] = [],
  max: number = 5
): LinkableItem[] {
  return candidates
    .filter((c) => c.id !== source.id)
    .map((c) => ({ item: c, score: scoreRelated(source, c, sourceKeywords) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((r) => r.item);
}