import Parser from "rss-parser";
import type { ScrapedOpportunity } from "./types";
import { isElectronicsNews } from "./news-filter";
import { autoTagArticle } from "./news-filter";
import { isRelevantToPlatform } from "./relevance";

export interface NewsSourceConfig {
  name: string;
  url: string;
  tags: string[];
  type?: "news" | "opportunity";
  relevance_tier?: number;
  keyword_filter?: boolean;
}

export const NEWS_SOURCES: NewsSourceConfig[] = [
  // ── TIER 1: Pure Semiconductor & Electronics ──
  {
    name: "IEEE Spectrum",
    url: "https://spectrum.ieee.org/feeds/feed.rss",
    tags: ["IEEE", "electronics", "engineering"],
    relevance_tier: 1,
  },
  {
    name: "Semiconductor Engineering",
    url: "https://semiengineering.com/feed/",
    tags: ["semiconductor", "chip design", "EDA"],
    relevance_tier: 1,
  },
  {
    name: "EE Times",
    url: "https://www.eetimes.com/feed/",
    tags: ["electronics", "semiconductor", "industry"],
    relevance_tier: 1,
  },
  {
    name: "Electronics Weekly",
    url: "https://www.electronicsweekly.com/feed/",
    tags: ["electronics", "components", "UK"],
    relevance_tier: 1,
  },
  {
    name: "SemiWiki",
    url: "https://semiwiki.com/feed/",
    tags: ["semiconductor", "EDA", "IP"],
    relevance_tier: 1,
  },
  {
    name: "Electronics For You",
    url: "https://www.electronicsforu.com/feed",
    tags: ["electronics", "India", "DIY"],
    relevance_tier: 1,
  },
  // ── TIER 2: Semiconductor Industry News ──
  {
    name: "The Register — Hardware",
    url: "https://www.theregister.com/hardware/semiconductors/headlines.atom",
    tags: ["semiconductor", "industry", "business"],
    relevance_tier: 2,
  },
  {
    name: "Power Electronics News",
    url: "https://www.powerelectronicsnews.com/feed/",
    tags: ["power", "electronics", "EV"],
    relevance_tier: 1,
  },
  // ── TIER 3: Research & Academic ──
  {
    name: "Science Daily — Electronics",
    url: "https://www.sciencedaily.com/rss/matter_energy/electronics.xml",
    tags: ["research", "academic", "electronics"],
    relevance_tier: 1,
  },
  {
    name: "Phys.org — Engineering",
    url: "https://phys.org/rss-feed/technology-news/engineering/",
    tags: ["research", "technology", "electronics"],
    relevance_tier: 1,
  },
  // ── Opportunity sources ──
  {
    name: "Scholarship Roar",
    url: "https://www.scholarshiproar.com/feed/",
    tags: ["fellowship", "PhD", "scholarship", "international"],
    type: "opportunity",
  },
];

export interface ParsedArticle {
  title: string;
  summary: string | null;
  // Canonical DB column names (news_articles): `url` and `source_name`.
  // Historical names source/source_url do not exist in the live schema and
  // made every news insert fail silently.
  source_name: string;
  url: string | null;
  published_at: string | null;
  image_url: string | null;
  tags: string[];
}

export function extractArticleImageUrl(item: any): string | null {
  // 1. RSS Enclosure
  if (item?.enclosure?.url && typeof item.enclosure.url === "string") {
    const u = item.enclosure.url.trim();
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
  }

  // 2. Media content (handles array or single object, with or without $ namespace)
  const media = item?.mediaContent || item?.["media:content"];
  if (Array.isArray(media) && media.length > 0) {
    for (const m of media) {
      const u = m?.$?.url || m?.url;
      if (u && typeof u === "string" && (u.startsWith("http://") || u.startsWith("https://"))) {
        return u.trim();
      }
    }
  } else if (media) {
    const u = media?.$?.url || media?.url;
    if (u && typeof u === "string" && (u.startsWith("http://") || u.startsWith("https://"))) {
      return u.trim();
    }
  }

  // 3. Media thumbnail
  const thumb = item?.mediaThumbnail || item?.["media:thumbnail"];
  if (thumb) {
    const u = thumb?.$?.url || thumb?.url;
    if (u && typeof u === "string" && (u.startsWith("http://") || u.startsWith("https://"))) {
      return u.trim();
    }
  }

  // 4. HTML img tag in content or content:encoded
  const html = item?.contentEncoded || item?.["content:encoded"] || item?.content || "";
  if (typeof html === "string" && html.length > 0) {
    const match = html.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

async function fetchRSSFeed(
  source: string,
  feedUrl: string,
  defaultTags: string[],
  relevanceTier?: number,
  keywordFilter?: boolean,
): Promise<ParsedArticle[]> {
  try {
    const parser = new Parser({
      timeout: 8000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
      customFields: {
        item: [
          ["media:content", "mediaContent", { keepArray: true }],
          ["media:thumbnail", "mediaThumbnail"],
          ["enclosure", "enclosure"],
          ["content:encoded", "contentEncoded"],
        ],
      },
    });
    const feed = await parser.parseURL(feedUrl);
    const results: ParsedArticle[] = [];
    for (const item of feed.items) {
      const title = item.title || "Untitled";
      const summary = item.contentSnippet?.substring(0, 400) || null;

      if (!isElectronicsNews(title, summary, relevanceTier || 1)) continue;

      const autoTags = autoTagArticle(title, summary || "");
      const mergedTags = Array.from(new Set([...defaultTags, ...autoTags]));

      const imageUrl = extractArticleImageUrl(item);

      results.push({
        title,
        summary,
        source_name: source,
        url: item.link || null,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        image_url: imageUrl,
        tags: mergedTags,
      });
    }
    return results;
  } catch (error) {
    console.warn(`Note: Could not parse RSS feed ${feedUrl} (${source})`);
    return [];
  }
}

export async function fetchAllNews(): Promise<ParsedArticle[]> {
  const sources = NEWS_SOURCES.filter((s) => s.type !== "opportunity");
  // Parallel fetch: worst case is the slowest feed (~6s), not the sum.
  // Sequential code pushed the nightly cron past serverless time limits,
  // so the DB never got new items even when a source published.
  const settled = await Promise.allSettled(
    sources.map((source) =>
      fetchRSSFeed(
        source.name,
        source.url,
        source.tags,
        source.relevance_tier,
        source.keyword_filter,
      )
    )
  );
  return settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

export async function fetchOpportunitiesFromRSS(): Promise<ScrapedOpportunity[]> {
  const results: ScrapedOpportunity[] = [];
  for (const source of NEWS_SOURCES) {
    if (source.type !== "opportunity") continue;
    try {
      const parser = new Parser({
        timeout: 6000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      const feed = await parser.parseURL(source.url);
      for (const item of feed.items) {
        const description = item.contentSnippet || item.content || "";
        if (!isRelevantToPlatform(item.title || "Academic Opportunity", description, source.name, source.tags)) continue;
        results.push({
          title: item.title || "Academic Opportunity",
          organization: source.name,
          category: "fellowship",
          location: "International",
          stipend: null,
          deadline: null,
          eligibility: null,
          description,
          apply_link: item.link || "",
          source_url: item.link || "",
          tags: source.tags,
        });
      }
    } catch {
      // ignore
    }
  }
  return results;
}
