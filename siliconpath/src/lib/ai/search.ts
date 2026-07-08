import { callAI, extractJson } from "./providers.js";
import { listOpportunities } from "../data/opportunities.js";
import { CATEGORIES } from "../types.js";
import type { Opportunity } from "../types.js";

/**
 * Natural-language search: an AI turns the user's phrase into structured filters,
 * which are then run through the EXISTING opportunities query (so results are real
 * DB rows, never AI-invented). If the AI is unavailable we degrade to a plain
 * keyword search — the feature never hard-fails.
 */
export interface ParsedQuery {
  category?: string;
  location?: string;
  search?: string;
}

const SYSTEM = `You convert a job-seeker's natural-language query about semiconductor/VLSI/electronics opportunities into JSON filters.
Return ONLY a JSON object with optional keys: "category", "location", "search".
Allowed category values: ${CATEGORIES.map((c) => c.value).join(", ")}.
"search" is free-text keywords (skills, org names). Omit keys you cannot infer.`;

export async function aiSearch(query: string): Promise<{ parsed: ParsedQuery; rows: Opportunity[]; degraded: boolean }> {
  let parsed: ParsedQuery = {};
  let degraded = false;

  try {
    const { text } = await callAI(query, { systemPrompt: SYSTEM, json: true });
    const obj = extractJson<ParsedQuery>(text);
    if (obj && typeof obj === "object") {
      const validCategory = CATEGORIES.some((c) => c.value === obj.category) ? obj.category : undefined;
      parsed = {
        category: validCategory,
        location: typeof obj.location === "string" ? obj.location : undefined,
        search: typeof obj.search === "string" ? obj.search : undefined,
      };
    } else {
      degraded = true;
      parsed = { search: query };
    }
  } catch {
    degraded = true;
    parsed = { search: query }; // graceful fallback to keyword search
  }

  const { rows } = await listOpportunities({ ...parsed, limit: 30 });
  return { parsed, rows, degraded };
}
