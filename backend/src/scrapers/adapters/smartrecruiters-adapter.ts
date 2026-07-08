import { ScrapedOpportunity, SourceConfig } from "../types.js";
import { logger } from "../../lib/logger.js";

interface SRJob {
  id: string;
  name: string;
  department?: { label: string };
  location?: { city?: string; country?: string };
  typeOfEmployment?: { label: string };
  releasedDate?: string;
  company?: { name: string };
}

interface SRResponse {
  content: SRJob[];
  total?: number;
}

function extractCompanyName(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

export async function scrapeSmartRecruiters(source: SourceConfig): Promise<ScrapedOpportunity[]> {
  const results: ScrapedOpportunity[] = [];
  logger.info(`[SmartRecruiters] Starting ${source.name}`);

  const companyName = extractCompanyName(source.url);
  if (!companyName) {
    logger.warn(`[SmartRecruiters] ${source.name}: could not extract company name`);
    return results;
  }

  const apiUrl = `https://api.smartrecruiters.com/v1/companies/${companyName}/postings`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; SiliconPath/1.0)",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      logger.warn(`[SmartRecruiters] ${source.name}: HTTP ${res.status}`);
      return results;
    }

    const data: SRResponse = await res.json();

    for (const job of data.content ?? []) {
      const location = [job.location?.city, job.location?.country]
        .filter(Boolean)
        .join(", ");

      const applyLink = `https://jobs.smartrecruiters.com/${companyName}/${job.id}`;

      results.push({
        title: job.name,
        organization: source.name,
        category: source.category,
        location: location || null,
        stipend: null,
        deadline: null,
        eligibility: null,
        description: "", // Postings list API does not include full description
        apply_link: applyLink,
        source_url: source.url,
        tags: [
          source.category,
          job.department?.label ?? "",
          job.typeOfEmployment?.label ?? "",
        ].filter(Boolean),
      });
    }

    logger.info(`[SmartRecruiters] ${source.name}: ${results.length} jobs`);
  } catch (e) {
    logger.error(`[SmartRecruiters] ${source.name}:`, e instanceof Error ? e.message : e);
  }

  return results;
}
