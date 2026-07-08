import { ScrapedOpportunity, SourceConfig } from "../types.js";
import { logger } from "../../lib/logger.js";
import * as cheerio from "cheerio";

export async function scrapeSchemaJobPostings(source: SourceConfig): Promise<ScrapedOpportunity[]> {
  const results: ScrapedOpportunity[] = [];
  logger.info(`[Schema] Starting ${source.name} at ${source.url}`);

  // Phase 2.3: extract JSON-LD JobPosting blocks
  // Checks for <script type="application/ld+json"> with @type: "JobPosting"
  try {
    const res = await fetch(source.url, {
      headers: { "User-Agent": "SiliconPath/1.0", "Accept": "text/html" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      logger.warn(`[Schema] ${source.name}: HTTP ${res.status}`);
      return results;
    }
    const html = await res.text();
    const $ = cheerio.load(html);
    const ldBlocks: unknown[] = [];

    $('script[type="application/ld+json"]').each((_, el) => {
      const raw = $(el).html();
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        ldBlocks.push(...items);
      } catch { /* skip malformed JSON */ }
    });

    const jobPostings = ldBlocks.filter(
      (b): b is Record<string, unknown> =>
        typeof b === "object" && b !== null && (b as Record<string, unknown>)["@type"] === "JobPosting"
    );

    for (const jp of jobPostings) {
      results.push({
        title: String(jp.title ?? ""),
        organization: source.name,
        category: source.category,
        location: jp.jobLocation ? String((jp.jobLocation as Record<string, unknown>)?.address ? ((jp.jobLocation as Record<string, unknown>).address as Record<string, unknown>)?.addressLocality ?? "" : jp.jobLocation ?? "") : null,
        stipend: jp.baseSalary ? String((jp.baseSalary as Record<string, unknown>)?.value ? ((jp.baseSalary as Record<string, unknown>).value as Record<string, unknown>)?.value ?? "" : "") : null,
        deadline: null,
        eligibility: null,
        description: String(jp.description ?? "").slice(0, 5000),
        apply_link: jp.url ? String(jp.url) : source.url,
        source_url: source.url,
        tags: [source.category],
      });
    }

    logger.info(`[Schema] ${source.name}: found ${results.length} JobPostings`);
  } catch (e) {
    logger.error(`[Schema] ${source.name} error:`, e instanceof Error ? e.message : e);
  }

  return results;
}
