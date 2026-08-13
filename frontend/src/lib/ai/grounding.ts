// Database grounding for the AI chat assistant (QA audit P0).
// Deterministic, framework-free helpers: query intent extraction, retrieval
// against the opportunities/news tables, a strict grounded system prompt, and
// an answer URL sanitizer. No DB access in this file — the route passes in a
// supabase client, tests pass in a mock.

const STOPWORDS = new Set([
  "what", "which", "where", "when", "why", "who", "how", "are", "the", "and",
  "for", "with", "you", "can", "any", "all", "but", "not", "there", "some",
  "latest", "recent", "current", "tell", "find", "look", "show", "give",
  "about", "available", "opportunity", "opportunities", "openings", "india",
  "please", "need", "want", "know", "list", "me", "my", "our", "this", "that",
]);

export interface GroundedRecord {
  id?: string | null;
  title: string;
  organization?: string | null;
  category?: string | null;
  location?: string | null;
  deadline?: string | null;
  stipend?: string | null;
  eligibility?: string | null;
  apply_url?: string | null;
  source_url?: string | null;
  description?: string | null;
  slug?: string | null;
}

export interface GroundedNews {
  id?: string | null;
  title: string;
  summary?: string | null;
  published_at?: string | null;
  source_url?: string | null;
  slug?: string | null;
}

const OPPORTUNITY_INTENT_TERMS = [
  "jrf", "srf", "phd", "research", "internship", "intern", "job", "jobs",
  "vacancy", "fellowship", "fellowships", "admission", "stipend", "apply",
  "application", "deadline", "recruit", "postdoc", "scientist", "engineer",
  "scholarship", "trainee", "apprentice", "exam", "opportunity", "opportunities",
  "career", "careers", "hiring", "opening", "openings", "role", "roles",
];

/** Deterministic keyword extraction from a user query. */
export function extractSearchTerms(query: string): string[] {
  const tokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3)
    .filter((t) => !STOPWORDS.has(t));
  return Array.from(new Set(tokens));
}

/** Does the query look like it is asking about current opportunities? */
export function isOpportunityIntent(query: string): boolean {
  const q = query.toLowerCase();
  return OPPORTUNITY_INTENT_TERMS.some((t) => q.includes(t));
}

/**
 * Relevance filter: keep only rows where at least one query term appears in
 * the primary fields (title/category/organization), or at least two distinct
 * terms appear anywhere, or a single DISTINCTIVE term (>= 8 chars, e.g.
 * "semiconductor") appears anywhere. Prevents fuzzy description-only short
 * matches from reaching the LLM for unrelated queries (e.g. "Zulu interpreter
 * in Antarctica" must not pull "Test Development Engineer").
 */
export function filterRelevantOpportunities(
  terms: string[],
  rows: GroundedRecord[]
): GroundedRecord[] {
  return rows.filter((r) => {
    const primary = [r.title, r.category, r.organization]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const secondary = [r.description, r.eligibility]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    let primaryMatches = 0;
    let secondaryMatches = 0;
    let longestMatchedTerm = 0;
    for (const t of terms) {
      if (primary.includes(t)) {
        primaryMatches++;
        longestMatchedTerm = Math.max(longestMatchedTerm, t.length);
      } else if (secondary.includes(t)) {
        secondaryMatches++;
        longestMatchedTerm = Math.max(longestMatchedTerm, t.length);
      }
    }
    return (
      primaryMatches >= 1 ||
      primaryMatches + secondaryMatches >= 2 ||
      (terms.length <= 2 && secondaryMatches === 1 && longestMatchedTerm >= 8)
    );
  });
}

/** Should news records be pulled too (current-context questions)? */
export function wantsNewsContext(query: string): boolean {
  return /latest|news|announce|recent|update|today|this week|report/i.test(query);
}

/**
 * Retrieve matching opportunity records (and optionally news) for grounding.
 * Reuses the same tables/filters as /api/ai/search — no new search system.
 */
export async function retrieveGrounding(
  db: any,
  query: string,
  opts: { opportunityLimit?: number; newsLimit?: number } = {}
): Promise<{ opportunities: GroundedRecord[]; news: GroundedNews[] }> {
  const terms = extractSearchTerms(query);
  const opportunityLimit = opts.opportunityLimit ?? 8;
  const newsLimit = opts.newsLimit ?? 3;
  // Two-phase fetch (2026-08-13, verified in prod): a single broad
  // OR(query) ordered created_at DESC let thousands of newer weak matches
  // (terms hit in description/eligibility) push strong-but-older records
  // ("IIT Madras research associate", Aug 1) out of the top-8 window →
  // grounded:false for records that exist. Phase 1 queries only primary
  // fields (title/category/organization); phase 2 (only if phase 1 yields
  // nothing) adds description/eligibility. Relevance filtering still runs
  // after each phase.
  const FETCH_WINDOW = 50;

  let opportunities: GroundedRecord[] = [];
  let news: GroundedNews[] = [];

  if (terms.length > 0 && db) {
    try {
      const base = (fields: string[]) =>
        db
          .from("opportunities")
          .select("id,title,organization,category,location,deadline,salary_range,eligibility,apply_url,source_url,description,slug,created_at")
          .eq("is_active", true)
          .neq("verification_status", "rejected")
          .order("created_at", { ascending: false })
          .limit(FETCH_WINDOW);

      const toRecords = (rows: any[]) =>
        filterRelevantOpportunities(
          terms,
          rows.map((r: any) => ({
            ...r,
            // Live schema: salary_range (not stipend).
            stipend: r.salary_range || null,
            apply_url: r.apply_url || r.source_url || null,
          }))
        );

      const run = async (fields: string[]) => {
        const conds = terms
          .map((t) => fields.map((f) => `${f}.ilike.%${t}%`).join(","))
          .join(",");
        const { data, error } = await base(fields).or(conds);
        return !error && Array.isArray(data) ? toRecords(data) : [];
      };

      // Phase 1: primary fields only.
      let kept = await run(["title", "category", "organization"]);
      if (kept.length === 0) {
        // Phase 2: broaden to description/eligibility.
        kept = await run([
          "title", "category", "organization", "description", "eligibility",
        ]);
      }
      opportunities = kept.slice(0, opportunityLimit);
    } catch {
      // retrieval failure must never break the chat — falls back to LLM only
    }

    if (wantsNewsContext(query)) {
      try {
        let nq = db
          .from("news_articles")
          .select("id,title,summary,published_at,url,slug")
          .order("published_at", { ascending: false })
          .limit(newsLimit);
        nq = nq.or(terms.map((t) => `title.ilike.%${t}%,summary.ilike.%${t}%`).join(","));
        const { data, error } = await nq;
        if (!error && Array.isArray(data)) {
          // Live schema: news_articles.url (not source_url).
          news = data.map((r: any) => ({ ...r, source_url: r.url }));
        }
      } catch {
        // same — never block chat
      }
    }
  }

  return { opportunities, news };
}

/** All URLs a grounded answer is allowed to contain. */
export function allowedUrls(opportunities: GroundedRecord[], news: GroundedNews[]): Set<string> {
  const urls = new Set<string>();
  for (const o of opportunities) {
    if (o.apply_url) urls.add(o.apply_url.trim());
    if (o.source_url) urls.add(o.source_url.trim());
  }
  for (const n of news) {
    if (n.source_url) urls.add(n.source_url.trim());
  }
  return urls;
}

/** Strict system prompt — model may only answer from retrieved records. */
export function buildGroundedSystemPrompt(
  query: string,
  opportunities: GroundedRecord[],
  news: GroundedNews[],
  basePrompt: string
): string {
  const allowed = Array.from(allowedUrls(opportunities, news));
  const allowLine =
    allowed.length > 0
      ? `You may ONLY output these exact URLs and no others: ${allowed.join(" ")}`
      : "No URLs are available in the retrieved records. Do NOT output any URL at all.";

  const oppLines =
    opportunities.length > 0
      ? opportunities.map(
          (o, i) =>
            `${i + 1}. "${o.title}" | Org: ${o.organization || "—"} | Category: ${o.category || "—"}` +
            ` | Location: ${o.location || "—"} | Deadline: ${o.deadline || "not specified"}` +
            ` | Stipend: ${o.stipend || "—"} | Apply URL: ${o.apply_url || "—"}` +
            ` | Eligibility: ${o.eligibility || "—"}`
        ).join("\n")
      : "(no opportunity records retrieved)";

  const newsLines =
    news.length > 0
      ? news.map(
          (n, i) =>
            `${i + 1}. "${n.title}" | Published: ${n.published_at || "—"}` +
            ` | Summary: ${(n.summary || "").slice(0, 200)} | Source URL: ${n.source_url || "—"}`
        ).join("\n")
      : "(no news records retrieved)";

  return `${basePrompt}

=== GROUNDING: DATABASE RECORDS RETRIEVED FOR THIS QUESTION ===

RETRIEVED OPPORTUNITIES:
${oppLines}

RETRIEVED NEWS:
${newsLines}

=== HARD RULES — ALWAYS FOLLOW ===
1. Answer questions about current/available opportunities ONLY from the retrieved records above. You have no other source of current opportunity data.
2. Whenever RETRIEVED OPPORTUNITIES lists one or more records, they are REAL and MATCH the user's question: lead your answer by listing the most relevant ones (title, organization, category, deadline, and Apply URL per rule 6). Do NOT say "couldn't find" when records are listed above.
3. NEVER invent, fabricate, or extrapolate an opportunity, organization, deadline, stipend, or record that is not listed above.
4. NEVER invent a URL. ${allowLine}.
5. If no opportunity records were retrieved for an opportunity question, respond with exactly: "I couldn't find a matching opportunity in BerojgarDegreeWala's current database." — do not guess and do not point to generic institutional websites.
6. General explanation (what JRF means, eligibility rules, career advice) is allowed, but clearly separate it from database facts, and never present general knowledge as a current opening.
7. When you cite a retrieved opportunity, include its title, organization, category, location if present, deadline if present, and the exact Apply URL listed above.

User question: ${query}`;
}

/**
 * Deterministic final guard: strip any URL from the model answer that is not
 * in the allowed set. Guarantees no hallucinated domains even if the model
 * misbehaves. Unknown URLs are replaced with "[official website]".
 */
export function sanitizeAnswerUrls(text: string, allowed: Set<string>): string {
  if (!text) return text;
  return text.replace(/https?:\/\/[^\s)}\]<>"']+/g, (match) => {
    const clean = match.replace(/[.,;:!?]+$/, "");
    if (allowed.has(clean)) return clean;
    return "[official website]";
  });
}

export const NO_MATCH_FALLBACK =
  "I couldn't find a matching opportunity in BerojgarDegreeWala's current database. " +
  "Try asking about a specific role (JRF, internship, PhD) or organization (DRDO, ISRO, IIT, VLSI companies), " +
  "or browse /opportunities for the latest verified openings.";
