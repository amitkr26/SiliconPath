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
  publicationDate?: string;
}

interface SRResponse {
  content: SRJob[];
  totalPages?: number;
  totalElements?: number;
  number?: number;
  size?: number;
}

const SR_COMPANY_MAP: Record<string, string> = {
  "nordic-semi": "NordicSemiconductor",
};

function extractCompanyName(source: SourceConfig): string | null {
  if (SR_COMPANY_MAP[source.id]) return SR_COMPANY_MAP[source.id];
  if (source.id === "nordic-semi") return "NordicSemiconductor";
  try {
    const u = new URL(source.url);
    const parts = u.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && last.length > 1) return last;
    return u.hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}

export async function scrapeSmartRecruiters(source: SourceConfig): Promise<ScrapedOpportunity[]> {
  const results: ScrapedOpportunity[] = [];
  logger.info(`[SmartRecruiters] Starting ${source.name}`);

  const companyName = extractCompanyName(source);
  if (!companyName) {
    logger.warn(`[SmartRecruiters] ${source.name}: could not extract company name`);
    return results;
  }

  let page = 0;
  const size = 100;
  let totalPages = 1;

  while (page < totalPages) {
    const apiUrl = `https://api.smartrecruiters.com/v1/companies/${companyName}/postings?page=${page}&size=${size}`;
    try {
      const res = await fetch(apiUrl, {
        headers: { Accept: "application/json", "User-Agent": "SiliconPath/1.0" },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) {
        if (page === 0) logger.warn(`[SmartRecruiters] ${source.name}: HTTP ${res.status}`);
        break;
      }
      const data: SRResponse = await res.json();
      if (page === 0) {
        totalPages = data.totalPages ?? 1;
        logger.info(`[SmartRecruiters] ${source.name}: ~${data.totalElements ?? '?'} jobs, ${totalPages} pages`);
      }
      for (const job of data.content ?? []) {
        const location = [job.location?.city, job.location?.country].filter(Boolean).join(", ") || null;
        const applyLink = `https://jobs.smartrecruiters.com/${companyName}/${job.id}`;
        results.push({
          title: job.name,
          organization: source.name,
          category: source.category,
          location,
          stipend: null,
          deadline: null,
          eligibility: null,
          description: "", // list API doesn't include full description
          apply_link: applyLink,
          source_url: source.url,
          tags: [source.category, job.department?.label ?? "", job.typeOfEmployment?.label ?? ""].filter(Boolean),
        });
      }
      if (data.content?.length < size) break;
      page++;
      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      logger.error(`[SmartRecruiters] ${source.name} page ${page}:`, e instanceof Error ? e.message : e);
      break;
    }
  }
  logger.info(`[SmartRecruiters] ${source.name}: ${results.length} jobs`);
  return results;
}
