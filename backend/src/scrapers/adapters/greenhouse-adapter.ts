import { ScrapedOpportunity, SourceConfig } from "../types.js";
import { logger } from "../../lib/logger.js";

interface GreenhouseJob {
  id: number;
  title: string;
  location: { name: string } | null;
  department: { name: string } | null;
  employment_type: string;
  posted_at: string;
  absolute_url: string;
  internal_job_id: string;
  content: {
    description: string;
    requirements: string;
    responsibilities: string;
  };
  metadata: Record<string, unknown>;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
  meta: { total: number };
}

function extractBoardToken(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[0] || u.hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}

function buildDescription(job: GreenhouseJob): string {
  return [
    job.content?.description,
    job.content?.requirements,
    job.content?.responsibilities,
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 5000);
}

export async function scrapeGreenhouse(source: SourceConfig): Promise<ScrapedOpportunity[]> {
  const results: ScrapedOpportunity[] = [];
  logger.info(`[Greenhouse] Starting ${source.name}`);

  const boardToken = extractBoardToken(source.url);
  if (!boardToken) {
    logger.warn(`[Greenhouse] ${source.name}: could not extract board token`);
    return results;
  }

  const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; SiliconPath/1.0)",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      logger.warn(`[Greenhouse] ${source.name}: HTTP ${res.status}`);
      return results;
    }

    const data: GreenhouseResponse = await res.json();

    for (const job of data.jobs ?? []) {
      results.push({
        title: job.title,
        organization: source.name,
        category: source.category,
        location: job.location?.name ?? null,
        stipend: null,
        deadline: null,
        eligibility: null,
        description: buildDescription(job),
        apply_link: job.absolute_url ?? null,
        source_url: source.url,
        tags: [
          source.category,
          job.department?.name ?? "",
          job.employment_type ?? "",
        ].filter(Boolean),
      });
    }

    logger.info(`[Greenhouse] ${source.name}: ${results.length} jobs`);
  } catch (e) {
    logger.error(`[Greenhouse] ${source.name}:`, e instanceof Error ? e.message : e);
  }

  return results;
}
