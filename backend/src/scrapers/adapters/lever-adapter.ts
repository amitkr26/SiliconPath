import { ScrapedOpportunity, SourceConfig } from "../types.js";
import { logger } from "../../lib/logger.js";

interface LeverJob {
  id: string;
  text: string;
  categories: {
    team?: string;
    department?: string;
    location?: string;
    commitment?: string;
    level?: string;
  };
  tags: string[];
  createdAt: number;
  updatedAt: number;
  applyUrl: string;
  hostedUrl: string;
  descriptionPlain: string;
  additionalPlain: string;
  state: string;
  lists: string[];
}

interface LeverResponse {
  data: LeverJob[];
}

function extractCompanyId(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[0] || u.hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}

export async function scrapeLever(source: SourceConfig): Promise<ScrapedOpportunity[]> {
  const results: ScrapedOpportunity[] = [];
  logger.info(`[Lever] Starting ${source.name}`);

  const companyId = extractCompanyId(source.url);
  if (!companyId) {
    logger.warn(`[Lever] ${source.name}: could not extract company ID`);
    return results;
  }

  const apiUrl = `https://api.lever.co/v0/postings/${companyId}?mode=json`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; SiliconPath/1.0)",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      logger.warn(`[Lever] ${source.name}: HTTP ${res.status}`);
      return results;
    }

    const data: LeverResponse = await res.json();

    for (const job of data.data ?? []) {
      if (job.state !== "published") continue;

      const fullDesc = [job.descriptionPlain, job.additionalPlain]
        .filter(Boolean)
        .join("\n\n")
        .slice(0, 5000);

      results.push({
        title: job.text,
        organization: source.name,
        category: source.category,
        location: job.categories.location ?? null,
        stipend: null,
        deadline: null,
        eligibility: null,
        description: fullDesc,
        apply_link: job.applyUrl || job.hostedUrl || null,
        source_url: source.url,
        tags: [
          source.category,
          job.categories.commitment ?? "",
          job.categories.level ?? "",
          ...job.tags ?? [],
        ].filter(Boolean),
      });
    }

    logger.info(`[Lever] ${source.name}: ${results.length} jobs`);
  } catch (e) {
    logger.error(`[Lever] ${source.name}:`, e instanceof Error ? e.message : e);
  }

  return results;
}
