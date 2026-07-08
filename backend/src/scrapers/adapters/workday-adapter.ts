import { ScrapedOpportunity, SourceConfig } from "../types.js";
import { logger } from "../../lib/logger.js";
import * as https from "https";

interface WorkdayJob {
  jobRequisitionId: string;
  title: string;
  locations?: { descriptor: string }[];
  primaryLocation?: { descriptor: string };
  jobCategory?: string;
  jobType?: string;
  postedOn?: string;
  externalApplyUrl?: string;
  jobDescription?: string;
  businessUnit?: string;
}

interface WorkdayResponse { jobPostings: WorkdayJob[]; total?: number }

const WORKDAY_TENANTS: Record<string, { tenant: string; site: string }> = {
  "tsmc": { tenant: "tsmc", site: "EXTERNAL_TSMC_CAREERS" },
  "micron": { tenant: "micron", site: "External" },
  "texas-instruments": { tenant: "ti", site: "External" },
  "infineon": { tenant: "infineon", site: "External" },
  "nvidia": { tenant: "nvidia", site: "External" },
  "amd": { tenant: "amd", site: "External" },
  "qualcomm": { tenant: "qualcomm", site: "External" },
  "broadcom": { tenant: "broadcom", site: "External" },
  "mediatek": { tenant: "mediatek", site: "External" },
  "asml": { tenant: "asml", site: "External" },
  "applied-materials": { tenant: "appliedmaterials", site: "External" },
  "synopsys": { tenant: "synopsys", site: "External" },
  "cadence": { tenant: "cadence", site: "External" },
  "imec": { tenant: "imec", site: "External" },
  "sk-hynix": { tenant: "skhynix", site: "External" },
  "stmicroelectronics": { tenant: "stmicroelectronics", site: "External" },
  "nxp": { tenant: "nxp", site: "External" },
  "onsemi": { tenant: "onsemi", site: "External" },
  "renesas": { tenant: "renesas", site: "External" },
  "microchip": { tenant: "microchip", site: "External" },
  "analog-devices": { tenant: "analogdevices", site: "External" },
  "skyworks": { tenant: "skyworks", site: "External" },
  "qorvo": { tenant: "qorvo", site: "External" },
  "wolfspeed": { tenant: "wolfspeed", site: "External" },
  "globalfoundries": { tenant: "globalfoundries", site: "External" },
  "tower-semiconductor": { tenant: "towersemi", site: "External" },
  "nexperia": { tenant: "nexperia", site: "External" },
  "kioxia": { tenant: "kioxia", site: "External" },
  "western-digital": { tenant: "westerndigital", site: "External" },
  "marvell": { tenant: "marvell", site: "External" },
  "arm": { tenant: "arm", site: "External" },
  "cirrus-logic": { tenant: "cirrus", site: "External" },
  "synaptics": { tenant: "synaptics", site: "External" },
  "lattice-semi": { tenant: "lattice", site: "External" },
  "ambiq-micro": { tenant: "ambiq", site: "External" },
  "groq-ai": { tenant: "groq", site: "External" },
  "tenstorrent": { tenant: "tenstorrent", site: "External" },
  "credo-tech": { tenant: "credotech", site: "External" },
  "lam-research": { tenant: "lamresearch", site: "External" },
  "kla": { tenant: "kla", site: "External" },
  "teradyne": { tenant: "teradyne", site: "External" },
  "entegris": { tenant: "entegris", site: "External" },
  "apple-silicon": { tenant: "apple", site: "External" },
  "merck-ed": { tenant: "merckgroup", site: "External" },
  "corning": { tenant: "corning", site: "External" },
  "dupont-electronics": { tenant: "dupont", site: "External" },
  "3m-electronics": { tenant: "3m", site: "External" },
  "basf-electronics": { tenant: "basf", site: "External" },
  "air-products": { tenant: "airproducts", site: "External" },
  "linde-electronics": { tenant: "linde", site: "External" },
  "asm-intl": { tenant: "asm", site: "External" },
  "axcelis": { tenant: "axcelis", site: "External" },
  "onto-innovation": { tenant: "ontoinnovation", site: "External" },
  "veeco": { tenant: "veeco", site: "External" },
  "allegro-micro": { tenant: "allegromicro", site: "External" },
  "melexis": { tenant: "melexis", site: "External" },
  "bosch-sensortec": { tenant: "bosch", site: "External" },
  "semtech": { tenant: "semtech", site: "External" },
  "power-integrations": { tenant: "powerint", site: "External" },
  "littelfuse": { tenant: "littelfuse", site: "External" },
  "rambus": { tenant: "rambus", site: "External" },
  "keysight": { tenant: "keysight", site: "External" },
  "rohde-schwarz": { tenant: "rohdeschwarz", site: "External" },
  "siemens-eda": { tenant: "siemens", site: "External" },
  "ansys": { tenant: "ansys", site: "External" },
  "ni": { tenant: "ni", site: "External" },
  "cisco": { tenant: "cisco", site: "External" },
  "ciena": { tenant: "ciena", site: "External" },
  "nist": { tenant: "nist", site: "External" },
  "sandia": { tenant: "sandia", site: "External" },
  "argonne": { tenant: "anl", site: "External" },
  "ornl": { tenant: "ornl", site: "External" },
  "lbl": { tenant: "lbl", site: "External" },
  "csiro": { tenant: "csiro", site: "External" },
  "tno": { tenant: "tno", site: "External" },
};

function apiBaseUrl(tenant: string): string {
  return `https://${tenant}.wd1.myworkdayjobs.com`;
}

function buildPayload(searchText?: string): Record<string, unknown> {
  const body: Record<string, unknown> = { limit: 20, offset: 0 };
  if (searchText?.trim()) body.searchText = searchText.trim();
  return body;
}

export async function scrapeWorkday(source: SourceConfig): Promise<ScrapedOpportunity[]> {
  const results: ScrapedOpportunity[] = [];
  const config = WORKDAY_TENANTS[source.id];

  if (!config) {
    logger.warn(`[Workday] ${source.name}: no tenant config found`);
    return results;
  }

  const { tenant, site } = config;
  const baseUrl = apiBaseUrl(tenant);
  const apiUrl = `${baseUrl}/wday/cxs/${tenant}/${site}/jobs`;

  logger.info(`[Workday] Starting ${source.name} → ${apiUrl}`);

  // Try full payload first
  const tryPayload = async (stripped = false): Promise<WorkdayResponse> => {
    const body = stripped ? { limit: 20, offset: 0 } : buildPayload();
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; SiliconPath/1.0)",
        "Accept-Language": "en-US,en;q=0.9",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Workday ${res.status}: ${text.slice(0, 500)}`);
    }
    return res.json();
  };

  try {
    const data = await tryPayload(false);
    for (const job of data.jobPostings ?? []) {
      const location = job.primaryLocation?.descriptor ?? job.locations?.[0]?.descriptor ?? null;
      results.push({
        title: job.title,
        organization: source.name,
        category: source.category,
        location,
        stipend: null,
        deadline: null,
        eligibility: null,
        description: (job.jobDescription ?? "").slice(0, 8000),
        apply_link: job.externalApplyUrl ?? null,
        source_url: source.url,
        tags: [source.category, job.jobCategory ?? ""].filter(Boolean),
      });
    }
    logger.info(`[Workday] ${source.name}: ${results.length} jobs via API`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("422")) {
      logger.warn(`[Workday] ${source.name}: 422, retrying with stripped payload`);
      try {
        const data = await tryPayload(true);
        for (const job of data.jobPostings ?? []) {
          const location = job.primaryLocation?.descriptor ?? job.locations?.[0]?.descriptor ?? null;
          results.push({
            title: job.title,
            organization: source.name,
            category: source.category,
            location,
            stipend: null,
            deadline: null,
            eligibility: null,
            description: (job.jobDescription ?? "").slice(0, 8000),
            apply_link: job.externalApplyUrl ?? null,
            source_url: source.url,
            tags: [source.category, job.jobCategory ?? ""].filter(Boolean),
          });
        }
        logger.info(`[Workday] ${source.name}: ${results.length} jobs via stripped-API`);
      } catch {
        logger.warn(`[Workday] ${source.name}: API failed, trying HTML fallback`);
        const htmlResults = await scrapeViaHtml(baseUrl, source);
        results.push(...htmlResults);
      }
    } else if (msg.includes("403") || msg.includes("401")) {
      logger.warn(`[Workday] ${source.name}: ${msg} — trying HTML fallback`);
      const htmlResults = await scrapeViaHtml(baseUrl, source);
      results.push(...htmlResults);
    } else {
      logger.warn(`[Workday] ${source.name}: ${msg}`);
    }
  }
  return results;
}

async function scrapeViaHtml(tenantBaseUrl: string, source: SourceConfig): Promise<ScrapedOpportunity[]> {
  const results: ScrapedOpportunity[] = [];
  const urlsToTry = [tenantBaseUrl, `${tenantBaseUrl}/en-US/External`, `${tenantBaseUrl}/jobs`];
  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", Accept: "text/html" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const html = await res.text();
      const { load } = await import("cheerio");
      const $ = load(html);
      $("tr, .job-listing, .position, .posting-row, li[data-job], div.job").each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 15 && /engineer|intern|scientist|vls|semiconductor|chip|design|verification|technician|manager|director|analyst|specialist/i.test(text)) {
          const linkEl = $(el).find("a").first();
          const href = linkEl.attr("href");
          const key = text.slice(0, 80);
          if ([...results.map((r) => r.title.slice(0, 80))].includes(key)) return;
          results.push({
            title: text.slice(0, 200),
            organization: source.name,
            category: source.category,
            location: null, stipend: null, deadline: null, eligibility: null,
            description: text.slice(0, 3000),
            apply_link: href ? new URL(href, url).href : null,
            source_url: url,
            tags: [source.category],
          });
        }
      });
      logger.info(`[Workday/HTML] ${source.name}: ${results.length} from HTML fallback`);
      return results;
    } catch { /* try next URL */ }
  }
  return results;
}
