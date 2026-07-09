import { ScrapedOpportunity, SourceConfig } from "../types.js";
import { logger } from "../../lib/logger.js";

interface GreenhouseJob {
  id: number;
  title: string;
  location: { name: string } | null;
  department: { name: string } | null;
  office: { name: string } | null;
  employment_type: string;
  posted_at: string;
  updated_at: string;
  absolute_url: string;
  internal_job_id: string;
  content: { description: string; requirements: string; responsibilities: string };
  metadata: Record<string, unknown>;
}

interface GreenhouseResponse { jobs: GreenhouseJob[]; meta: { total: number } }

export const BOARD_ALIASES: Record<string, string> = {
  "jobs.intel.com": "intl",
  "jobs.intel.com/": "intl",
  "intel": "intel",
  "intel-india": "intl",
  // Batch 3 & 5 & 14 additions
  "graphcore": "graphcore",
  "cerebras": "cerebras",
  "sifive": "sifive",
  "rivos": "rivos",
  "axelera-ai": "axelera-ai",
  "untether-ai": "untether-ai",
  "hailo": "hailo",
  "alphawave-semi": "alphawavesemi",
  "astera-labs": "asteralabs",
  "navitas": "navitas",
  "dmatrix": "d-matrix",
  "blaize": "blaize",
  "lightmatter": "lightmatter",
  "furiosa-ai": "furiosa",
  "positron-ai": "positron",
};

function extractBoardToken(source: SourceConfig): string | null {
  const fromAlias = BOARD_ALIASES[source.id] || BOARD_ALIASES[source.url];
  if (fromAlias) return fromAlias;
  try {
    const u = new URL(source.url);
    const hostname = u.hostname;
    const pathParts = u.pathname.split("/").filter(Boolean);

    // boards.greenhouse.io/{board} → extract from path
    if (hostname === "boards.greenhouse.io" && pathParts.length > 0) {
      return pathParts[0];
    }

    // {board}.greenhouse.io → extract from subdomain
    if (hostname.endsWith(".greenhouse.io")) {
      const subdomain = hostname.split(".")[0];
      if (subdomain !== "boards" && subdomain !== "www" && subdomain !== "careers") {
        return subdomain;
      }
      if (pathParts.length > 0) return pathParts[0];
    }

    // job-boards.greenhouse.io/{board}
    if (hostname === "job-boards.greenhouse.io" && pathParts.length > 0) {
      return pathParts[0];
    }

    // Generic: try subdomain, fall back to path
    const hostParts = hostname.split(".");
    if (hostParts.length >= 2 && hostParts[0] !== "www" && hostParts[0] !== "careers" && hostParts[0] !== "jobs") {
      return hostParts[0];
    }
    if (pathParts.length > 0) return pathParts[0];
    return hostParts[0] || null;
  } catch {
    return null;
  }
}

function buildDescription(job: GreenhouseJob): string {
  return [job.content?.description, job.content?.requirements, job.content?.responsibilities]
    .filter(Boolean).join("\n\n").slice(0, 8000);
}

export async function scrapeGreenhouse(source: SourceConfig): Promise<ScrapedOpportunity[]> {
  const results: ScrapedOpportunity[] = [];
  logger.info(`[Greenhouse] Starting ${source.name}`);

  const boardToken = extractBoardToken(source);
  if (!boardToken) {
    logger.warn(`[Greenhouse] ${source.name}: could not extract board token`);
    return results;
  }

  // Fetch all pages (Greenhouse returns max 500 per page)
  let page = 1;
  const perPage = 100;
  let totalPages = 1;

  while (page <= totalPages) {
    const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true&per_page=${perPage}&page=${page}`;
    try {
      const res = await fetch(apiUrl, {
        headers: { Accept: "application/json", "User-Agent": "SiliconPath/1.0" },
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) {
        if (page === 1) logger.warn(`[Greenhouse] ${source.name}: HTTP ${res.status}`);
        break;
      }
      const data: GreenhouseResponse = await res.json();
      if (page === 1 && data.meta?.total) {
        totalPages = Math.ceil(data.meta.total / perPage);
        logger.info(`[Greenhouse] ${source.name}: ${data.meta.total} total jobs, ~${totalPages} pages`);
      }
      for (const job of data.jobs ?? []) {
        const location = job.location?.name || job.office?.name || null;
        results.push({
          title: job.title,
          organization: source.name,
          category: source.category,
          location,
          stipend: null,
          deadline: null,
          eligibility: null,
          description: buildDescription(job),
          apply_link: job.absolute_url ?? null,
          source_url: source.url,
          tags: [source.category, job.department?.name ?? "", job.employment_type ?? ""].filter(Boolean),
        });
      }
      if (data.jobs.length < perPage) break;
      page++;
      await new Promise((r) => setTimeout(r, 500));
    } catch (e) {
      logger.error(`[Greenhouse] ${source.name} page ${page}:`, e instanceof Error ? e.message : e);
      break;
    }
  }

  logger.info(`[Greenhouse] ${source.name}: ${results.length} jobs across ${page} pages`);
  return results;
}
