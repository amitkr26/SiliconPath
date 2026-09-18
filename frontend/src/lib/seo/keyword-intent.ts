/**
 * Keyword intent + AEO/GEO intent classification for BDW pages.
 *
 * Maps the BDW keyword universe (6 pillars: JRF/govt research, academia/PhD,
 * fellowships, VLSI careers, private industry, international) into an intent
 * bucket, then compares against the intent a page type SHOULD satisfy.
 * Intent mismatch is an improvement/warning check — never a score bonus.
 */

import type { PageType } from "./types";

export type SearchIntent = "informational" | "transactional" | "commercial" | "navigational";

const LEXICON: Record<SearchIntent, string[]> = {
  transactional: [
    "apply", "apply now", "applications", "vacancy", "vacancies", "recruitment", "recruit",
    "positions", "position", "openings", "hiring", "jobs", "job", "stipend", "salary",
    "eligibility", "selection process", "admit card", "notice", "walk-in", "off-campus",
    "internship", "fellowship", "jrf", "srf", "scientist", "engineer", "opportunities",
  ],
  informational: [
    "what is", "what are", "how to", "how", "guide", "difference", "vs", "meaning",
    "career", "roadmap", "road map", "tips", "overview", "explained", "complete guide",
    "syllabus", "exam pattern", "age limit", "qualification", "colleges", "universities",
  ],
  commercial: [
    "best", "top", "compare", "comparison", "alternatives", "review", "ranking",
    "salary comparison", "lpa", "ctc", "highest paid",
  ],
  navigational: ["berojgardegreewala", "bdw", "login", "sign in", "sign up", "contact us", "about"],
};

const TITLE_INTENT_HINTS: Record<SearchIntent, string[]> = {
  informational: ["guide", "what", "how", "vs", "difference", "roadmap", "career"],
  transactional: ["jobs", "positions", "apply", "recruitment", "vacancy", "openings", "opportunities", "fellowships"],
  commercial: ["best", "top", "compare", "comparison", "salary"],
  navigational: ["about"],
};

export function classifyIntent(title?: string | null, description?: string | null): {
  intent: SearchIntent;
  confidence: number;
  signals: Partial<Record<SearchIntent, number>>;
} {
  const text = `${title ?? ""} ${description ?? ""}`.toLowerCase();
  const signals: Partial<Record<SearchIntent, number>> = {};
  let total = 0;

  for (const [intent, words] of Object.entries(LEXICON) as [SearchIntent, string[]][]) {
    let hits = 0;
    for (const w of words) {
      if (text.includes(w)) hits += 1;
    }
    if (hits > 0) {
      signals[intent] = hits;
      total += hits;
    }
  }

  // Title carries strong weight for commercial/informational long-tail.
  const titleLower = (title ?? "").toLowerCase();
  for (const [intent, hints] of Object.entries(TITLE_INTENT_HINTS) as [SearchIntent, string[]][]) {
    for (const h of hints) {
      if (titleLower.includes(h)) {
        signals[intent] = (signals[intent] ?? 0) + 2;
        total += 2;
      }
    }
  }

  if (total === 0) return { intent: "informational", confidence: 0, signals };
  const best = Object.entries(signals).sort((a, b) => b[1] - a[1])[0][0] as SearchIntent;
  return { intent: best, confidence: Math.min(1, signals[best]! / (total || 1)), signals };
}

export function expectedIntentForPageType(pageType: PageType): SearchIntent {
  switch (pageType) {
    case "category":
    case "location":
    case "opportunity":
    case "organization":
      return "transactional";
    case "resource":
      return "informational";
    case "news":
      return "informational";
    case "home":
    case "hub":
      return "transactional";
    default:
      return "transactional";
  }
}

/** Normalized token set used by intent + cannibalization. */
export function normalizeTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/gi, " ")
    .split(/[\s-]+/)
    .filter(Boolean);
}