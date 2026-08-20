import Parser from "rss-parser";

// Shared news RSS ingestion for the standalone backend (Phase 6 worker).
// Port of frontend/src/lib/scrapers/rss-parser.ts — same 12 feeds, same
// relevance filter — plus the production write contract that the frontend
// /api/news/sync route uses:
//   - upsert into news_articles onConflict url (ignoreDuplicates)
//   - is_active: true, rows with a null/empty url are never written
// This replaces the old backend-only service that wrote to news_archive
// (a db2 archive table) with onConflict slug (no unique constraint there),
// which was broken against the live schema.
//
// Fetch layer is injectable so worker tests exercise retries/timeouts/5xx
// without network access.

export interface NewsSourceConfig {
  name: string;
  url: string;
  tags: string[];
  relevance_tier?: number;
}

export const NEWS_SOURCES: NewsSourceConfig[] = [
  { name: "IEEE Spectrum", url: "https://spectrum.ieee.org/feeds/feed.rss", tags: ["IEEE", "electronics", "engineering"], relevance_tier: 1 },
  { name: "Semiconductor Engineering", url: "https://semiengineering.com/feed/", tags: ["semiconductor", "chip design", "EDA"], relevance_tier: 1 },
  { name: "EE Times", url: "https://www.eetimes.com/feed/", tags: ["electronics", "semiconductor", "industry"], relevance_tier: 1 },
  { name: "Electronics Weekly", url: "https://www.electronicsweekly.com/feed/", tags: ["electronics", "components", "UK"], relevance_tier: 1 },
  { name: "Chip Design Magazine", url: "https://chipdesignmag.com/feed/", tags: ["chip design", "VLSI", "ASIC"], relevance_tier: 1 },
  { name: "SemiWiki", url: "https://semiwiki.com/feed/", tags: ["semiconductor", "EDA", "IP"], relevance_tier: 1 },
  { name: "Electronics For You", url: "https://www.electronicsforu.com/feed", tags: ["electronics", "India", "DIY"], relevance_tier: 1 },
  { name: "The Electronics Media", url: "https://theelectronicsmedia.com/feed/", tags: ["electronics", "India", "industry"], relevance_tier: 1 },
  { name: "The Register — Hardware", url: "https://www.theregister.com/hardware/semiconductors/headlines.atom", tags: ["semiconductor", "industry", "business"], relevance_tier: 2 },
  { name: "Power Electronics News", url: "https://www.powerelectronicsnews.com/feed/", tags: ["power", "electronics", "EV"], relevance_tier: 1 },
  { name: "Science Daily — Electronics", url: "https://www.sciencedaily.com/rss/computers_math/semiconductors.xml", tags: ["research", "academic", "electronics"], relevance_tier: 1 },
  { name: "Phys.org — Engineering", url: "https://phys.org/rss-feed/technology-news/engineering/", tags: ["research", "technology", "electronics"], relevance_tier: 1 },
];

export interface ParsedArticle {
  title: string;
  summary: string | null;
  source_name: string;
  url: string | null;
  published_at: string | null;
  image_url: string | null;
  tags: string[];
}

// Per-source execution result (the worker's structured output contract).
export interface NewsFeedResult {
  source: string;
  started_at: string;
  finished_at: string;
  fetched: number;    // items returned by the feed
  parsed: number;     // items passing the relevance filter
  accepted: number;   // items turned into rows after run-level dedup
  skipped: number;    // items rejected by filter or missing url
  duplicates: number; // items dropped by run-level url dedup
  failed: number;     // 1 when the feed failed after retries
  errors: string[];
  articles?: ParsedArticle[]; // internal to the run; not part of output
}

export const NEWS_FETCH_CONCURRENCY = 4; // bounded feed fetches (6L)
export const NEWS_RETRY_MAX = 2;         // 1 initial + 2 retries (6M)

const ELECTRONICS_KEYWORDS = [
  "chip", "semiconductor", "transistor", "electronics", "circuit", "processor", "fab", "wafer",
  "vlsi", "soc", "asic", "fpga", "eda", "memory", "sensor", "gpu", "cpu", "silicon", "foundry",
  "hardware", "pcb", "embedded", "iot", "microcontroller", "photonic", "optoelectronic", "power electronics",
  "5g", "6g", "display", "oled", "battery", "ev", "automotive", "quantum", "nano",
];

function isElectronicsNews(title: string, summary: string | null, tier: number): boolean {
  const hay = `${title} ${summary ?? ""}`.toLowerCase();
  const hits = ELECTRONICS_KEYWORDS.filter((k) => hay.includes(k)).length;
  if (tier === 1) return hits >= 1;
  return hits >= 2;
}

export { isElectronicsNews };

function autoTag(title: string, summary: string): string[] {
  const hay = `${title} ${summary}`.toLowerCase();
  return ELECTRONICS_KEYWORDS.filter((k) => hay.includes(k)).slice(0, 5);
}

export function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || `rss-${Date.now()}`;
}

export class FeedFetchError extends Error {
  constructor(message: string, readonly statusCode: number | null) {
    super(message);
    this.name = "FeedFetchError";
  }
}

export async function parseFeedOnce(source: NewsSourceConfig): Promise<ParsedArticle[]> {
  const parser = new Parser({
    timeout: 6000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/rss+xml, application/xml, text/xml, */*",
    },
  });
  const feed = await parser.parseURL(source.url);
  const out: ParsedArticle[] = [];
  for (const item of feed.items) {
    const title = item.title || "Untitled";
    const summary = item.contentSnippet?.substring(0, 400) || null;
    if (!isElectronicsNews(title, summary, source.relevance_tier || 1)) continue;
    out.push({
      title,
      summary,
      source_name: source.name,
      url: item.link || null,
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      image_url: null,
      tags: Array.from(new Set([...source.tags, ...autoTag(title, summary || "")])),
    });
  }
  return out;
}

const isRetryable = (status: number | null) => status === null || status >= 500 || status === 429;

export async function fetchNewsFeed(
  source: NewsSourceConfig,
  opts: { fetchFeed?: (s: NewsSourceConfig) => Promise<ParsedArticle[]>; retries?: number; backoffMs?: number } = {}
): Promise<NewsFeedResult> {
  const fetchFeed = opts.fetchFeed ?? parseFeedOnce;
  const retries = opts.retries ?? NEWS_RETRY_MAX;
  const backoffMs = opts.backoffMs ?? 1000;
  const started = new Date();
  const errors: string[] = [];

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const articles = await fetchFeed(source);
      return {
        source: source.name,
        started_at: started.toISOString(),
        finished_at: new Date().toISOString(),
        fetched: articles.length,
        parsed: articles.length,
        accepted: 0,
        skipped: 0,
        duplicates: 0,
        failed: 0,
        errors: [],
        articles,
      };
    } catch (err) {
      const status = err instanceof FeedFetchError ? err.statusCode : null;
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      if (attempt < retries && isRetryable(status)) {
        await new Promise((r) => setTimeout(r, Math.min(backoffMs * 2 ** (attempt + 1), 15000)));
        continue;
      }
      return {
        source: source.name,
        started_at: started.toISOString(),
        finished_at: new Date().toISOString(),
        fetched: 0,
        parsed: 0,
        accepted: 0,
        skipped: 0,
        duplicates: 0,
        failed: 1,
        errors,
      };
    }
  }
  // Unreachable: the loop returns in every branch.
  throw new Error("unreachable");
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function fetchAllNewsFeedResults(
  sources: NewsSourceConfig[] = NEWS_SOURCES,
  opts: { concurrency?: number; fetchFeed?: (s: NewsSourceConfig) => Promise<ParsedArticle[]>; retries?: number; backoffMs?: number } = {}
): Promise<NewsFeedResult[]> {
  const concurrency = opts.concurrency ?? NEWS_FETCH_CONCURRENCY;
  return mapWithConcurrency(sources, concurrency, (s) => fetchNewsFeed(s, { fetchFeed: opts.fetchFeed, retries: opts.retries, backoffMs: opts.backoffMs }));
}

export interface NewsArticleRow {
  slug: string;
  title: string;
  summary: string | null;
  source_name: string;
  url: string;
  published_at: string | null;
  image_url: string | null;
  tags: string[];
  is_active: boolean;
}

// Flatten per-source results into deduplicated rows for news_articles.
// Identity is the url (unique in the live schema): run-level dedup by
// normalized url + DB upsert onConflict url make the worker idempotent.
export function buildNewsArticleRows(results: NewsFeedResult[]): { rows: NewsArticleRow[]; results: NewsFeedResult[] } {
  const rows: NewsArticleRow[] = [];
  const seen = new Set<string>();
  for (const result of results) {
    let accepted = 0;
    let skipped = 0;
    let duplicates = 0;
    for (const a of result.articles ?? []) {
      const url = a.url?.trim() ?? "";
      if (!url) {
        skipped++;
        continue;
      }
      const key = url.toLowerCase();
      if (seen.has(key)) {
        duplicates++;
        continue;
      }
      seen.add(key);
      rows.push({
        slug: slugify(a.title),
        title: a.title,
        summary: a.summary,
        source_name: a.source_name,
        url,
        published_at: a.published_at,
        image_url: a.image_url,
        tags: a.tags,
        is_active: true,
      });
      accepted++;
    }
    result.accepted = accepted;
    result.skipped = skipped;
    result.duplicates = duplicates;
  }
  return { rows, results };
}

// Minimal duck-typed seam for the Supabase client (method syntax keeps it
// assignable both from the real @supabase/supabase-js client and test fakes).
export interface NewsUpsertClient {
  from(table: string): {
    upsert(rows: unknown[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }): {
      select(columns: string): PromiseLike<{ data: unknown[] | null; error: unknown }>;
    };
  };
}

// Production write contract (parity with frontend /api/news/sync):
// news_articles, onConflict url, ignoreDuplicates. Returns inserted count.
export async function upsertNewsArticles(
  client: NewsUpsertClient,
  rows: NewsArticleRow[]
): Promise<{ inserted: number; error: unknown }> {
  if (rows.length === 0) return { inserted: 0, error: null };
  const { data, error } = await client
    .from("news_articles")
    .upsert(rows, { onConflict: "url", ignoreDuplicates: true })
    .select("id");
  return { inserted: Array.isArray(data) ? data.length : 0, error };
}