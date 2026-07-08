import Parser from "rss-parser";
import { ScrapedOpportunity, SourceConfig } from "../types.js";
import { logger } from "../../lib/logger.js";

interface ExtendedItem {
  "dc:date"?: string;
  "job-title"?: string;
  "job-description"?: string;
  "job-location"?: string;
  "company-name"?: string;
}

type FeedItem = Parser.Item & ExtendedItem;

const parser = new Parser({
  customFields: {
    item: [
      ["dc:date", "dc:date"],
      "job-title",
      "job-description",
      "job-location",
      "company-name",
    ],
  },
});

export async function scrapeRss(source: SourceConfig): Promise<ScrapedOpportunity[]> {
  const results: ScrapedOpportunity[] = [];
  logger.info(`[RSS] Starting ${source.name}`);

  try {
    const feed = await parser.parseURL(source.url);
    const items = (feed.items ?? []) as FeedItem[];

    for (const item of items) {
      const title = item.title ?? item["job-title"] ?? "";
      if (!title || title === "undefined") continue;

      let description = item.content ?? item.contentSnippet ?? "";
      if (typeof description === "string") {
        description = description.replace(/<[^>]+>/g, "").trim().slice(0, 8000);
      }

      const link = item.link ?? "";
      const pubDate = item.pubDate ?? item["dc:date"] ?? null;
      let location = item["job-location"] ?? null;
      if (location && location.startsWith("http")) location = null;

      const categories = item.categories ?? [];

      results.push({
        title,
        organization: source.name,
        category: source.category,
        location,
        stipend: null,
        deadline: pubDate ? new Date(pubDate).toISOString().slice(0, 10) : null,
        eligibility: null,
        description: description || null,
        apply_link: typeof link === "string" && link.startsWith("http") ? link : null,
        source_url: source.url,
        tags: [source.category, ...categories].filter((t): t is string => typeof t === "string"),
      });
    }
    logger.info(`[RSS] ${source.name}: ${results.length} entries`);
  } catch (e) {
    logger.error(`[RSS] ${source.name}:`, e instanceof Error ? e.message : e);
  }
  return results;
}
