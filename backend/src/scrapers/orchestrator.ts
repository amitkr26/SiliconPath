import { ScrapeResult, SourceConfig, ScrapedOpportunity } from "./types.js";
import { getSourcesForBatch } from "./source-config.js";
import { scrapeWorkday } from "./adapters/workday-adapter.js";
import { scrapeGreenhouse } from "./adapters/greenhouse-adapter.js";
import { scrapeLever } from "./adapters/lever-adapter.js";
import { scrapeSmartRecruiters } from "./adapters/smartrecruiters-adapter.js";
import { scrapeSchemaJobPostings } from "./adapters/schema-jobposting-adapter.js";
import { scrapeHTML } from "./adapters/html-generic-adapter.js";
import { scrapeRSS } from "./adapters/rss-adapter.js";
import { validateOrganization } from "./lib/org-validation.js";
import { logger } from "../lib/logger.js";
import { db1 } from "../lib/db.js";

type Adapter = (source: SourceConfig) => Promise<ScrapedOpportunity[]>;

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
  // Fail LOUDLY: never report success while silently discarding scraped rows
  // because the primary DB was not configured.
  if (!db1) {
    throw new Error(
      "[Orchestrator] db1 (Supabase Primary) is not configured. Aborting scrape run instead of silently dropping results."
    );
  }
  const primary = db1;

  const sources = getSourcesForBatch(batch);
  logger.info(`[Orchestrator] Running ${sources.length} sources (batch=${batch})`);

  // Preload known organization names so validation can cross-reference them.
  const knownCompanies = new Set<string>();
  try {
    const { data } = await primary.from("organizations").select("name");
    for (const row of (data ?? []) as Array<{ name?: string }>) {
      if (row?.name) knownCompanies.add(String(row.name).toLowerCase());
    }
  } catch (e) {
    logger.warn(
      "[Orchestrator] Could not preload organizations for validation:",
      e instanceof Error ? e.message : e
    );
  }

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
      let sanitized = 0;

      for (const opp of opportunities) {
        const orgCheck = validateOrganization(opp.organization, {
          sourceName: source.name,
          knownCompanies,
        });
        if (!orgCheck.valid) {
          sanitized++;
          logger.warn(
            `[Orchestrator] ${source.name}: organization "${opp.organization}" rejected (${orgCheck.reason}); using "${orgCheck.value}"`
          );
        }

        const { error } = await primary.from("opportunities").upsert(
          {
            title: opp.title,
            organization: orgCheck.value,
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
        else logger.warn(`[Orchestrator] ${source.name}: upsert error:`, error.message);
      }

      results.push({ source: source.name, success: true, count: dbCount });
      logger.info(
        `[Orchestrator] ${source.name}: ${dbCount}/${opportunities.length} saved, ${sanitized} org(s) sanitized`
      );
    } catch (e) {
      logger.error(`[Orchestrator] ${source.name} failed:`, e);
      results.push({ source: source.name, success: false, count: 0, error: String(e) });
    }
  }

  return results;
}
