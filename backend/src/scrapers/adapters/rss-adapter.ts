import Parser from "rss-parser";
import { ScrapedOpportunity, SourceConfig } from "../types.js";
import { logger } from "../../lib/logger.js";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "SiliconPath/1.0",
    "Accept": "application/rss+xml, application/xml, text/xml",
  },
});

export async function scrapeRSS(source: SourceConfig): Promise<ScrapedOpportunity[]> {
  const results: ScrapedOpportunity[] = [];
  logger.info(`[RSS] Starting ${source.name} at ${source.url}`);

  try {
    const feed = await parser.parseURL(source.url);

    for (const item of feed.items ?? []) {
      const title = item.title?.trim();
      if (!title || title.length < 5) continue;

      results.push({
        title,
        organization: source.name,
        category: source.category,
        location: null,
        stipend: null,
        deadline: null,
        eligibility: null,
        description: (item.contentSnippet ?? item.content ?? "").slice(0, 5000),
        apply_link: item.link ?? null,
        source_url: source.url,
        tags: [source.category, ...(item.categories ?? [])],
      });
    }

    logger.info(`[RSS] ${source.name}: parsed ${results.length} items`);
  } catch (e) {
    logger.error(`[RSS] ${source.name} error:`, e instanceof Error ? e.message : e);
  }

  return results;
}
