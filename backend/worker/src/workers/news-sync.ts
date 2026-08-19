import Parser from "rss-parser";
import type { SupabaseClient } from "@supabase/supabase-js";

// ── RSS sources (same 12 feeds as backend/server/src/services/news-sync.ts) ──

interface NewsSource {
  name: string;
  url: string;
  tags: string[];
  relevance_tier: number;
}

const NEWS_SOURCES: NewsSource[] = [
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

// ── Relevance filtering ──

const ELECTRONICS_KEYWORDS = [
  "chip", "semiconductor", "transistor", "electronics", "circuit", "processor", "fab", "wafer",
  "vlsi", "soc", "asic", "fpga", "eda", "memory", "sensor", "gpu", "cpu", "silicon", "foundry",
  "hardware", "pcb", "embedded", "iot", "microcontroller", "photonic", "optoelectronic", "power electronics",
  "5g", "6g", "display", "oled", "battery", "ev", "automotive", "quantum", "nano",
];

export function isElectronicsNews(title: string, summary: string | null, tier: number): boolean {
  const hay = `${title} ${summary ?? ""}`.toLowerCase();
  const hits = ELECTRONICS_KEYWORDS.filter((k) => hay.includes(k)).length;
  if (tier === 1) return hits >= 1;
  return hits >= 2;
}

export function autoTag(title: string, summary: string): string[] {
  const hay = `${title} ${summary}`.toLowerCase();
  return ELECTRONICS_KEYWORDS.filter((k) => hay.includes(k)).slice(0, 5);
}

// ── RSS fetching ──

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || `rss-${Date.now()}`;
}

interface ParsedArticle {
  title: string;
  summary: string | null;
  source_name: string;
  url: string | null;
  slug: string;
  published_at: string | null;
  tags: string[];
}

async function fetchFeed(source: NewsSource): Promise<ParsedArticle[]> {
  try {
    const parser = new Parser({
      timeout: 6000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    const feed = await parser.parseURL(source.url);
    const out: ParsedArticle[] = [];
    for (const item of feed.items) {
      const title = item.title || "Untitled";
      const summary = item.contentSnippet?.substring(0, 400) || null;
      if (!isElectronicsNews(title, summary, source.relevance_tier)) continue;
      out.push({
        title,
        summary,
        source_name: source.name,
        url: item.link || null,
        slug: slugify(title),
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        tags: Array.from(new Set([...source.tags, ...autoTag(title, summary || "")])),
      });
    }
    return out;
  } catch {
    console.warn(`[news-sync] Failed to fetch ${source.name}: ${source.url}`);
    return [];
  }
}

async function fetchAllNews(): Promise<ParsedArticle[]> {
  const settled = await Promise.allSettled(NEWS_SOURCES.map((s) => fetchFeed(s)));
  return settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

// ── DB upsert ──

interface SyncResult {
  fetched: number;
  inserted: number;
  updated: number;
  errors: number;
}

export async function runNewsSync(supabase: SupabaseClient): Promise<SyncResult> {
  const articles = await fetchAllNews();
  const result: SyncResult = { fetched: articles.length, inserted: 0, updated: 0, errors: 0 };

  if (articles.length === 0) {
    console.log("[news-sync] No articles fetched");
    return result;
  }

  for (const article of articles) {
    try {
      const { error } = await supabase
        .from("news_articles")
        .upsert(
          {
            title: article.title,
            slug: article.slug,
            summary: article.summary,
            source_name: article.source_name,
            url: article.url,
            published_at: article.published_at,
            tags: article.tags,
            // Mark as worker-synced (vs frontend-synced)
            metadata: { synced_by: "worker", synced_at: new Date().toISOString() },
          },
          { onConflict: "slug", ignoreDuplicates: false }
        );
      if (error) {
        console.warn(`[news-sync] Upsert error for "${article.title}": ${error.message}`);
        result.errors++;
      } else {
        result.inserted++;
      }
    } catch (err) {
      console.warn(`[news-sync] Unexpected error: ${err}`);
      result.errors++;
    }
  }

  console.log(`[news-sync] Done: ${result.fetched} fetched, ${result.inserted} upserted, ${result.errors} errors`);
  return result;
}
