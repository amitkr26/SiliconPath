import { ScrapeResult, SourceConfig } from "./types.js";
import { getSourcesForBatch } from "./source-config.js";
import { scrapeWorkday } from "./adapters/workday-adapter.js";
import { scrapeGreenhouse } from "./adapters/greenhouse-adapter.js";
import { scrapeLever } from "./adapters/lever-adapter.js";
import { scrapeSmartRecruiters } from "./adapters/smartrecruiters-adapter.js";
import { scrapeSchemaJobPostings } from "./adapters/schema-jobposting-adapter.js";
import { scrapeHTML } from "./adapters/html-generic-adapter.js";
import { scrapeRSS } from "./adapters/rss-adapter.js";
import { logger } from "../lib/logger.js";
import { db1 } from "../lib/db.js";

type Adapter = (source: SourceConfig) => Promise<import("./types.js").ScrapedOpportunity[]>;

const ADAPTER_MAP: Record<string, Adapter> = {
  workday: scrapeWorkday,
  greenhouse: scrapeGreenhouse,
  lever: scrapeLever,
  smartrecruiters: scrapeSmartRecruiters,
  schema: scrapeSchemaJobPostings,
  html: scrapeHTML,
  rss: scrapeRSS,
};

export async function runOrchestrator(batch: number | "all"): Promise<ScrapeResult[]> {
  const sources = getSourcesForBatch(batch);
  logger.info(`[Orchestrator] Running ${sources.length} sources (batch=${batch})`);

  const results: ScrapeResult[] = [];

  for (const source of sources) {
    const adapter = ADAPTER_MAP[source.type];
    if (!adapter) {
      results.push({ source: source.name, success: false, count: 0, error: `No adapter for type ${source.type}` });
      continue;
    }

    try {
      const opportunities = await adapter(source);
      let dbCount = 0;

      // Write to db1.opportunities via Supabase
      if (db1 && opportunities.length > 0) {
        for (const opp of opportunities) {
          const { error } = await db1.from("opportunities").upsert(
            {
              title: opp.title,
              organization: opp.organization,
              category: opp.category,
              location: opp.location,
              stipend: opp.stipend,
              deadline: opp.deadline,
              eligibility: opp.eligibility,
              description: opp.description,
              apply_link: opp.apply_link,
              source_url: opp.source_url,
              tags: opp.tags,
              is_active: true,
            },
            { onConflict: "apply_link", ignoreDuplicates: true }
          );
          if (!error) dbCount++;
        }
      }

      results.push({ source: source.name, success: true, count: dbCount });
      logger.info(`[Orchestrator] ${source.name}: ${dbCount}/${opportunities.length} saved`);
    } catch (e) {
      logger.error(`[Orchestrator] ${source.name} failed:`, e);
      results.push({ source: source.name, success: false, count: 0, error: String(e) });
    }
  }

  return results;
}
