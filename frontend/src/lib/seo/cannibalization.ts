/**
 * Keyword cannibalization detection.
 *
 * Flags pages that target the same normalized intent cluster. Detection is
 * purely advisory — it NEVER auto-merges, redirects, or deletes pages.
 * Every affected page receives an improvement-level check pointing at the
 * cluster so a human can consolidate intent deliberately.
 */

import type { CannibalizationCluster } from "./types";

const STOPWORDS = new Set([
  "and", "or", "the", "a", "an", "of", "to", "for", "in", "on", "with", "as", "by",
  "at", "from", "is", "are", "was", "were", "be", "been", "india", "2026", "2025",
  "vs", "pdf", "career", "guide", "berojgardegreewala", "jobs",
]);

export interface PageTokens {
  url: string;
  title: string;
  tokens: string[];
}

export function tokenizeForCluster(title: string): string[] {
  return [...new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/gi, " ")
      .split(/[\s-]+/)
      .filter(Boolean)
      .filter((t) => !STOPWORDS.has(t) && t.length > 1)
  )];
}

export function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const t of setA) if (setB.has(t)) intersection += 1;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Cluster pages by normalized-title similarity. Returns clusters of >= 2
 * pages whose Jaccard similarity is at least SIMILARITY_MIN (detects the
 * classic BDW pattern: /opportunities/vlsi, /opportunities/vlsi/jobs,
 * /opportunities/vlsi-jobs, /opportunities/vlsi-career all targeting
 * "vlsi jobs").
 */
export function findCannibalizationClusters(
  pages: PageTokens[],
  similarityThreshold = 0.6
): CannibalizationCluster[] {
  const clusters: CannibalizationCluster[] = [];
  const used = new Set<number>();

  for (let i = 0; i < pages.length; i++) {
    if (used.has(i)) continue;
    const group = [pages[i]];
    for (let j = i + 1; j < pages.length; j++) {
      if (used.has(j)) continue;
      const sim = jaccardSimilarity(pages[i].tokens, pages[j].tokens);
      if (sim >= similarityThreshold) {
        group.push(pages[j]);
        used.add(j);
      }
    }
    if (group.length >= 2) {
      used.add(i);
      clusters.push({
        key: group[0].tokens.slice(0, 4).join(" "),
        count: group.length,
        urls: group.map((p) => p.url),
        sampleTokens: pages[i].tokens.slice(0, 6),
      });
    }
  }

  return clusters.sort((a, b) => b.count - a.count);
}