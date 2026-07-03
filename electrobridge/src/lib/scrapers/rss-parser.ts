import Parser from "rss-parser";
import type { ScrapedOpportunity } from "./types";
import { isElectronicsNews } from "./news-filter";
import { autoTagArticle } from "./news-filter";

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
    name: "Chip Design Magazine",
    url: "https://chipdesignmag.com/feed/",
    tags: ["chip design", "VLSI", "ASIC"],
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
    name: "AnandTech",
    url: "https://www.anandtech.com/rss/",
    tags: ["processor", "semiconductor", "analysis"],
    relevance_tier: 2,
  },
  {
    name: "The Register — Hardware",
    url: "https://www.theregister.com/hardware/semiconductors/headlines.atom",
    tags: ["semiconductor", "industry", "business"],
    relevance_tier: 2,
  },
  // ── TIER 3: Research & Academic ──
  {
    name: "Nature Electronics",
    url: "https://www.nature.com/natelectron.rss",
    tags: ["research", "academic", "Nature"],
    relevance_tier: 1,
  },
  {
    name: "Science Daily — Semiconductors",
    url: "https://www.sciencedaily.com/rss/matter_energy/semiconductors.xml",
    tags: ["research", "academic", "semiconductor"],
    relevance_tier: 1,
  },
  {
    name: "Science Daily — Electronics",
    url: "https://www.sciencedaily.com/rss/matter_energy/electronics.xml",
    tags: ["research", "academic", "electronics"],
    relevance_tier: 1,
  },
  {
    name: "Phys.org — Semiconductors",
    url: "https://phys.org/rss-feed/physics-news/semiconductors/",
    tags: ["research", "physics", "semiconductor"],
    relevance_tier: 1,
  },
  {
    name: "Phys.org — Electronics",
    url: "https://phys.org/rss-feed/technology-news/electronics/",
    tags: ["research", "technology", "electronics"],
    relevance_tier: 1,
  },
  // ── TIER 4: India-Specific Electronics ──
  {
    name: "India Semiconductor Mission",
    url: "https://www.semiconductors.india.gov.in/feed",
    tags: ["India", "semiconductor", "policy", "ISM"],
    relevance_tier: 1,
  },
  {
    name: "IESA News",
    url: "https://www.iesa.org.in/news/feed/",
    tags: ["India", "semiconductor", "ESDM", "IESA"],
    relevance_tier: 1,
  },
  // ── Opportunity sources ──
  {
    name: "Academic Positions",
    url: "https://academicpositions.com/feed",
    tags: ["PhD", "academic", "international", "postdoc"],
    type: "opportunity",
  },
  {
    name: "Scholarship Roar",
    url: "https://www.scholarshiproar.com/feed/",
    tags: ["fellowship", "PhD", "scholarship", "international"],
    type: "opportunity",
  },
  {
    name: "Jobs.ac.uk — Electronics",
    url: "https://www.jobs.ac.uk/feeds/rss/?q=electronics+semiconductor",
    tags: ["PhD", "research", "UK", "electronics"],
    type: "opportunity",
  },
];

export interface ParsedArticle {
  title: string;
  summary: string | null;
  source: string;
  source_url: string | null;
  published_at: string | null;
  image_url: string | null;
  tags: string[];
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
        "User-Agent": "Mozilla/5.0 (compatible; ElectroBridge/1.0)",
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

      results.push({
        title,
        summary,
        source,
        source_url: item.link || null,
        published_at: item.pubDate || item.isoDate || null,
        image_url:
          item.enclosure?.url ||
          (item["media:content"] as any)?.$.url ||
          null,
        tags: mergedTags,
      });
    }
    return results;
  } catch (error) {
    console.error(`Error fetching RSS feed ${feedUrl}:`, error);
    return [];
  }
}

export async function fetchAllNews(): Promise<ParsedArticle[]> {
  const results: ParsedArticle[] = [];
  for (const source of NEWS_SOURCES) {
    if (source.type === "opportunity") continue;
    try {
      const articles = await fetchRSSFeed(
        source.name,
        source.url,
        source.tags,
        source.relevance_tier,
        source.keyword_filter,
      );
      results.push(...articles);
    } catch {
      // per-feed error already logged
    }
  }
  return results;
}

function extractDeadlineFromDescription(description: string): string | null {
  const dateMatch = description.match(
    /(?:application\s+deadline|deadline|closing\s+date)[:\s]+(\d{1,2}\s+\w+\s+\d{4}|\d{4}-\d{2}-\d{2})/i
  );
  if (dateMatch) {
    try {
      const d = new Date(dateMatch[1]);
      if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
    } catch {
      // ignore parse errors
    }
  }
  return null;
}

function extractStipendFromDescription(description: string): string | null {
  const stipendMatch = description.match(
    /(?:stipend|salary|funding)[:\s]+([^.\n]+)/i
  );
  return stipendMatch ? stipendMatch[1].trim() : null;
}

function extractEligibilityFromDescription(description: string): string | null {
  const eligMatch = description.match(
    /(?:eligibility|requirements?|qualifications?|entry\s+requirements?)[:\s]+([^.\n]+)/i
  );
  return eligMatch ? eligMatch[1].trim() : null;
}

export async function fetchOpportunitiesFromRSS(): Promise<ScrapedOpportunity[]> {
  const results: ScrapedOpportunity[] = [];
  for (const source of NEWS_SOURCES) {
    if (source.type !== "opportunity") continue;
    try {
      const parser = new Parser({
        timeout: 8000,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ElectroBridge/1.0)",
        },
      });
      const feed = await parser.parseURL(source.url);
      for (const item of feed.items) {
        const description = item.contentSnippet || item.content || "";
        const deadline = extractDeadlineFromDescription(description);
        const stipend = extractStipendFromDescription(description);
        const eligibility = extractEligibilityFromDescription(description);

        results.push({
          title: item.title || "Untitled",
          organization: item.creator || item.publisher || source.name,
          category: "PhD",
          location: "International",
          stipend,
          deadline,
          eligibility,
          description: description.substring(0, 500),
          apply_link: item.link || "",
          source_url: item.link || "",
          tags: source.tags,
        });
      }
    } catch (error) {
      console.error(`Error fetching RSS feed ${source.url}:`, error);
    }
  }
  return results;
}
