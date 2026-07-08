import type { ScrapeResult, SourceConfig, ScrapedOpportunity } from "./types.js";
import { getSourcesForBatch } from "./sources.js";
import { getDB } from "../lib/db/index.js";
import { validateOrganization } from "../lib/validation/organization.js";
import { scrapeHTML } from "./adapters/html.js";
import { scrapeRSS } from "./adapters/rss.js";
import { scrapeWorkday } from "./adapters/workday.js";
import { scrapeSmartRecruiters } from "./adapters/smartrecruiters.js";
import { scrapeSchemaJobPostings } from "./adapters/schema-jobposting.js";

type Adapter = (s: SourceConfig) => Promise<ScrapedOpportunity[]>;

const ADAPTERS: Record<string, Adapter> = {
  html: scrapeHTML,
  rss: scrapeRSS,
  workday: scrapeWorkday,
  smartrecruiters: scrapeSmartRecruiters,
  schema: scrapeSchemaJobPostings,
};

export async function runOrchestrator(batch: number | "all"): Promise<ScrapeResult[]> {
  // Fail loudly if core DB isn't configured (getDB throws) rather than silently
  // discarding scraped rows while reporting success.
  const core = getDB("core");
  if (core.kind !== "supabase") throw new Error("[orchestrator] core DB is not a Supabase handle");
  const client = core.client;

  const knownCompanies = new Set<string>();
  try {
    const { data } = await client.from("companies").select("name");
    for (const r of (data ?? []) as Array<{ name?: string }>) {
      if (r?.name) knownCompanies.add(String(r.name).toLowerCase());
    }
  } catch {
    /* non-fatal: validation still works without cross-reference */
  }

  const results: ScrapeResult[] = [];
  for (const source of getSourcesForBatch(batch)) {
    const adapter = ADAPTERS[source.type];
    if (!adapter) {
      results.push({ source: source.name, success: false, count: 0, error: `No adapter for ${source.type}` });
      continue;
    }
    try {
      const rows = await adapter(source);
      const isNews = source.category.includes("news");
      let count = 0;
      let sanitized = 0;

      for (const row of rows) {
        if (isNews) {
          const { error } = await client.from("news_articles").upsert(
            { title: row.title, url: row.source_url, source: source.name, summary: row.description },
            { onConflict: "url", ignoreDuplicates: true }
          );
          if (!error) count++;
          continue;
        }
        const org = validateOrganization(row.organization, { sourceName: source.name, knownCompanies });
        if (!org.valid) sanitized++;
        const { error } = await client.from("opportunities").upsert(
          {
            title: row.title,
            organization: org.value,
            category: row.category,
            location: row.location,
            stipend: row.stipend,
            deadline: row.deadline,
            eligibility: row.eligibility,
            description: row.description,
            apply_link: row.apply_link,
            source_url: row.source_url,
            source_type: "scraped",
            tags: row.tags,
            is_active: true,
          },
          { onConflict: "dedupe_key", ignoreDuplicates: true }
        );
        if (!error) count++;
      }
      results.push({ source: source.name, success: true, count, sanitized });
    } catch (e) {
      results.push({ source: source.name, success: false, count: 0, error: String(e) });
    }
  }
  return results;
}
