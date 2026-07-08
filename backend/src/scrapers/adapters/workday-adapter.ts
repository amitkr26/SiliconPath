import { ScrapedOpportunity, SourceConfig } from "../types.js";
import { logger } from "../../lib/logger.js";

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

interface WorkdayResponse {
  jobPostings: WorkdayJob[];
  total?: number;
}

function buildPayload(searchText?: string): Record<string, unknown> {
  const body: Record<string, unknown> = { limit: 20, offset: 0 };
  if (searchText && searchText.trim().length > 0) {
    body.searchText = searchText.trim();
  }
  return body;
}

async function attemptFetch(
  baseUrl: string,
  tenant: string,
  site: string,
  searchText?: string,
  retryStripped = false
): Promise<WorkdayResponse> {
  const payload = retryStripped ? { limit: 20, offset: 0 } : buildPayload(searchText);
  const url = `${baseUrl}/wday/cxs/${tenant}/${site}/jobs`;

  logger.debug(`[Workday] POST ${url}`, JSON.stringify(payload));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; SiliconPath/1.0)",
      "Accept-Language": "en-US,en;q=0.9",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Workday ${res.status}: ${text.slice(0, 500)}`);
  }

  return res.json();
}

async function scrapeViaApi(source: SourceConfig): Promise<ScrapedOpportunity[]> {
  const results: ScrapedOpportunity[] = [];
  const baseUrl = source.url.replace(/\/+$/, "");
  let tenant = "";
  let site = "External";

  try {
    const u = new URL(baseUrl);
    tenant = u.hostname.split(".")[0];
    const pathParts = u.pathname.split("/").filter(Boolean);
    if (pathParts.length > 0) site = pathParts[pathParts.length - 1];
  } catch {
    logger.warn(`[Workday] ${source.name}: could not parse URL`);
    return results;
  }

  try {
    const data = await attemptFetch(
      baseUrl.replace(/\/wday\/cxs\/.*/, ""),
      tenant,
      site
    );
    for (const job of data.jobPostings ?? []) {
      const location = job.primaryLocation?.descriptor
        ?? job.locations?.[0]?.descriptor
        ?? null;
      results.push({
        title: job.title,
        organization: source.name,
        category: source.category,
        location,
        stipend: null,
        deadline: null,
        eligibility: null,
        description: (job.jobDescription ?? "").slice(0, 5000),
        apply_link: job.externalApplyUrl ?? null,
        source_url: source.url,
        tags: [source.category, job.jobCategory ?? ""].filter(Boolean),
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("422")) {
      logger.warn(`[Workday] ${source.name}: 422 on standard payload, retrying stripped`);
      try {
        const data = await attemptFetch(
          baseUrl.replace(/\/wday\/cxs\/.*/, ""),
          tenant,
          site,
          undefined,
          true
        );
        for (const job of data.jobPostings ?? []) {
          const location = job.primaryLocation?.descriptor
            ?? job.locations?.[0]?.descriptor
            ?? null;
          results.push({
            title: job.title,
            organization: source.name,
            category: source.category,
            location,
            stipend: null,
            deadline: null,
            eligibility: null,
            description: (job.jobDescription ?? "").slice(0, 5000),
            apply_link: job.externalApplyUrl ?? null,
            source_url: source.url,
            tags: [source.category, job.jobCategory ?? ""].filter(Boolean),
          });
        }
      } catch (e2) {
        logger.warn(`[Workday] ${source.name}: stripped retry also failed, trying HTML fallback`);
        const htmlResults = await scrapeViaHtml(source.url, source);
        results.push(...htmlResults);
      }
    } else {
      logger.warn(`[Workday] ${source.name} API error: ${msg}`);
    }
  }

  return results;
}

async function scrapeViaHtml(
  careerPageUrl: string,
  source: SourceConfig
): Promise<ScrapedOpportunity[]> {
  const results: ScrapedOpportunity[] = [];
  try {
    const res = await fetch(careerPageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SiliconPath/1.0)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return results;
    const html = await res.text();
    const { load } = await import("cheerio");
    const $ = load(html);

    $("tr, .job-listing, .position, .posting-row, li").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 15 && /engineer|intern|scientist|vls|semiconductor|chip|design|verification|technician|manager/i.test(text)) {
        const linkEl = $(el).find("a").first();
        const href = linkEl.attr("href");
        results.push({
          title: text.slice(0, 150),
          organization: source.name,
          category: source.category,
          location: null,
          stipend: null,
          deadline: null,
          eligibility: null,
          description: text.slice(0, 3000),
          apply_link: href ? new URL(href, careerPageUrl).href : null,
          source_url: careerPageUrl,
          tags: [source.category],
        });
      }
    });
  } catch {
    // silent
  }
  return results;
}

export async function scrapeWorkday(source: SourceConfig): Promise<ScrapedOpportunity[]> {
  logger.info(`[Workday] Starting ${source.name}`);
  const results = await scrapeViaApi(source);
  logger.info(`[Workday] ${source.name}: got ${results.length} jobs`);
  return results;
}
