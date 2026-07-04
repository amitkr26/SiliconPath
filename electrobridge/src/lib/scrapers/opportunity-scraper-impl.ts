import type { ScrapedOpportunity, ScrapeResult } from "./types";
import { supabaseAdmin } from "@/lib/supabase";
import { scrapeISRO } from "./isro-scraper";
import { scrapeDRDO } from "./drdo-scraper";
import { scrapeCSIR } from "./csir-scraper";
import { scrapeIndiaPSU } from "./india-psu-scraper";
import { scrapeIndiaAcademic } from "./india-academic-scraper";
import { scrapeGlobalSemiconductor } from "./global-semiconductor-scraper";
import { scrapeInternationalAcademic } from "./international-academic-scraper";
import { scrapeFellowships } from "./fellowship-scraper";

export interface ScrapedSource {
  id: string;
  name: string;
  source_type: string;
  url: string;
  adapter: string;
  category: string;
  is_active: boolean;
  priority: number;
}

async function getTraditionalScrapeSources(): Promise<ScrapedSource[]> {
  if (!supabaseAdmin?.from) {
    console.error("Supabase admin not configured");
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("scrape_sources")
    .select("*")
    .eq("is_active", true)
    .eq("source_type", "traditional")
    .order("priority", { ascending: true });

  if (error) {
    console.error("Failed to fetch traditional scrape sources:", error);
    return [];
  }

  return data || [];
}

async function executeScrape(source: ScrapedSource): Promise<{ opportunities: ScrapedOpportunity[]; results: ScrapeResult[] }> {
  const allResults: ScrapeResult[] = [];
  const allOpportunities: ScrapedOpportunity[] = [];

  try {
    const { supabaseAdmin } = require("@/lib/supabase");
    const supabase = supabaseAdmin;

    const { data: configData, error: configError } = await supabase
      .from("app_config")
      .select("config_value")
      .eq("config_key", "greenhouse_board_token")
      .single();

    const config = {
      baseUrl: source.url,
      boardToken: configData?.config_value || undefined,
      customFields: { boardToken: configData?.config_value || undefined },
    };

    const adapterMap: Record<string, () => Promise<any>> = {
      greenhouse: () => import("./greenhouse-adapter").then(m => m.greenhouseAdapter),
      lever: () => import("./lever-adapter").then(m => m.leverAdapter),
      workday: () => import("./workday-adapter").then(m => m.workdayAdapter),
      smartrecruiters: () => import("./smartrecruiters-adapter").then(m => m.smartRecruitersAdapter),
    };

    const adapterLoader = adapterMap[source.adapter.toLowerCase()];
    if (adapterLoader) {
      const adapterModule = await adapterLoader();
      const adapter = (adapterModule as any).default || adapterModule;
      const jobs = await adapter.fetchJobs(config);

      const sourceResult: ScrapeResult = { source: source.name, success: true, count: jobs.length };
      allResults.push(sourceResult);

      const opportunities = jobs.map((job: any) => ({
        title: job.title || `Job from ${source.name}`,
        organization: source.name.replace(" Source", ""),
        location: null,
        category: "JRF",
        stipend: null,
        deadline: null,
        eligibility: null,
        description: job.description || null,
        apply_link: null,
        source_url: source.url,
        tags: ["ATS"],
      } as ScrapedOpportunity));

      allOpportunities.push(...opportunities);
      console.log(`${source.name}: ${opportunities.length} opportunities scraped`);
    } else {
      throw new Error(`Adapter not found: ${source.adapter}`);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`${source.name} scraper failed:`, msg);
    allResults.push({ source: source.name, success: false, count: 0, error: msg });
  }

  return { opportunities: allOpportunities, results: allResults };
}

export async function scrapeAllOpportunities(): Promise<{
  opportunities: ScrapedOpportunity[];
  results: ScrapeResult[];
  total: number;
  run_ids: string[];
}> {
  const runIds: string[] = [];

  const traditionalSources = [
    { name: "ISRO", scraper: scrapeISRO },
    { name: "DRDO", scraper: scrapeDRDO },
    { name: "CSIR", scraper: scrapeCSIR },
    { name: "IndiaPSU", scraper: scrapeIndiaPSU },
    { name: "IndiaAcademic", scraper: scrapeIndiaAcademic },
    { name: "GlobalSemiconductor", scraper: scrapeGlobalSemiconductor },
    { name: "InternationalAcademic", scraper: scrapeInternationalAcademic },
    { name: "Fellowships", scraper: scrapeFellowships },
  ];

  const databaseSources = await getTraditionalScrapeSources();

  const allResults: ScrapeResult[] = [];
  const allOpportunities: ScrapedOpportunity[] = [];

  // Run database-configured ATS sources
  for (const source of databaseSources) {
    const startTime = new Date().toISOString();
    const runId = crypto.randomUUID();
    runIds.push(runId);

    try {
      const { opportunities, results } = await executeScrape(source);
      allOpportunities.push(...opportunities);
      allResults.push(...results);

      await supabaseAdmin.from("scrape_runs").insert([{
        source_id: source.id,
        source_name: source.name,
        source_type: source.source_type,
        start_time: startTime,
        end_time: new Date().toISOString(),
        success: true,
        opportunities_scraped: opportunities.length,
        created_at: new Date().toISOString(),
      }]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      allResults.push({ source: source.name, success: false, count: 0, error: msg });
      await supabaseAdmin.from("scrape_runs").insert([{
        source_id: runId,
        source_name: source.name,
        source_type: source.source_type,
        start_time: startTime,
        end_time: new Date().toISOString(),
        success: false,
        opportunities_scraped: 0,
        error_message: msg,
        created_at: new Date().toISOString(),
      }]);
    }
  }

  // Use Promise.allSettled to scrape all traditional/built-in sources concurrently
  const scrapePromises = traditionalSources.map(async (source) => {
    const startTime = new Date().toISOString();
    const runId = crypto.randomUUID();
    runIds.push(runId);

    try {
      const data = await source.scraper();
      console.log(`${source.name}: ${data.length} opportunities scraped`);

      // Log success run details to supabase
      if (supabaseAdmin) {
        await supabaseAdmin.from("scrape_runs").insert([{
          source_id: runId,
          source_name: source.name,
          source_type: "traditional",
          start_time: startTime,
          end_time: new Date().toISOString(),
          success: true,
          opportunities_scraped: data.length,
          created_at: new Date().toISOString(),
        }]);
      }

      return { source: source.name, success: true, count: data.length, data };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`${source.name} scraper failed:`, msg);

      if (supabaseAdmin) {
        await supabaseAdmin.from("scrape_runs").insert([{
          source_id: runId,
          source_name: source.name,
          source_type: "traditional",
          start_time: startTime,
          end_time: new Date().toISOString(),
          success: false,
          opportunities_scraped: 0,
          error_message: msg,
          created_at: new Date().toISOString(),
        }]);
      }

      return { source: source.name, success: false, count: 0, error: msg, data: [] };
    }
  });

  const settles = await Promise.allSettled(scrapePromises);

  for (const settle of settles) {
    if (settle.status === 'fulfilled') {
      const val = settle.value;
      allResults.push({ source: val.source, success: val.success, count: val.count, error: val.error });
      allOpportunities.push(...val.data);
    }
  }

  return {
    opportunities: allOpportunities,
    results: allResults,
    total: allOpportunities.length,
    run_ids: runIds,
  };
}

export { getTraditionalScrapeSources };
