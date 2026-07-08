import * as cheerio from "cheerio";
import type { ScrapedOpportunity, SourceConfig } from "../types.js";

const USER_AGENT = "Mozilla/5.0 (compatible; SiliconPath/1.0; +https://siliconpath.vercel.app)";

/** RSS/Atom news feed adapter. News is upserted to news_articles by the caller; here
 * we return opportunity-shaped rows only for job-feed RSS. For pure news feeds the
 * orchestrator routes by category. */
export async function scrapeRSS(source: SourceConfig): Promise<ScrapedOpportunity[]> {
  const res = await fetch(source.url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/xml, text/xml" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return [];
  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });
  const out: ScrapedOpportunity[] = [];
  $("item, entry").each((_, el) => {
    const title = $(el).find("title").first().text().trim();
    const link =
      $(el).find("link").first().attr("href") ||
      $(el).find("link").first().text().trim() ||
      null;
    const desc = $(el).find("description, summary, content").first().text().trim();
    if (!title) return;
    out.push({
      title,
      organization: source.name,
      category: source.category,
      location: null,
      stipend: null,
      deadline: null,
      eligibility: null,
      description: desc.slice(0, 3000) || null,
      apply_link: link,
      source_url: link || source.url,
      tags: [source.category],
    });
  });
  return out;
}
