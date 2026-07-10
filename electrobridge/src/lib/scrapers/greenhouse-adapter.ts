import type { ScrapedOpportunity } from "./types";
import { ATSAdapter, ATSConfig, ATSJobResponse, registerATSAdapter, mapATSJobToOpportunity } from "./ats-adapters";

interface GreenhouseJobResponse {
  id: number;
  title: string;
  location: { name: string } | null;
  department: { name: string } | null;
  employment_type: string;
  posted_at: string;
  updated_at: string;
  absolute_url: string;
  internal_job_id: string;
  content: {
    description: string;
    requirements: string;
    responsibilities: string;
  };
  metadata: Record<string, unknown>;
}

interface GreenhouseJobsResponse {
  jobs: GreenhouseJobResponse[];
  meta: { total: number };
}

export const greenhouseAdapter: ATSAdapter = {
  name: "greenhouse",
  sourceType: "ats",
  async fetchJobs(config: ATSConfig): Promise<ScrapedOpportunity[]> {
    const baseUrl = config.baseUrl.replace(/\/+$/, "");
    let boardToken = config.boardToken || config.customFields?.boardToken;

    if (!boardToken) {
      try {
        const urlObj = new URL(baseUrl);
        boardToken = urlObj.pathname.split('/').filter(Boolean).pop();
      } catch (e) {}
    }

    if (!boardToken) {
      throw new Error("Greenhouse requires boardToken in config or URL");
    }

    const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true&render_as=html`;
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Greenhouse API error: ${response.status} ${response.statusText}`);
    }

    const data: GreenhouseJobsResponse = await response.json();
    return data.jobs.map((job) => mapGreenhouseJob(job, baseUrl));
  },
  validateConfig(config: ATSConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!config.baseUrl) errors.push("baseUrl is required");
    if (!config.boardToken) errors.push("boardToken is required for Greenhouse");
    return { valid: errors.length === 0, errors };
  },
};

function mapGreenhouseJob(job: GreenhouseJobResponse, baseUrl: string) {
  const description = [
    job.content?.description,
    job.content?.requirements,
    job.content?.responsibilities,
  ].filter(Boolean).join("\n\n");

  const atsJob: ATSJobResponse = {
    id: job.id.toString(),
    title: job.title,
    location: job.location || undefined,
    department: job.department || undefined,
    employmentType: job.employment_type,
    postedAt: job.posted_at,
    updatedAt: job.updated_at,
    absoluteUrl: job.absolute_url,
    internalJobId: job.internal_job_id,
    content: {
      description: job.content?.description || "",
      requirements: job.content?.requirements || "",
      responsibilities: job.content?.responsibilities || "",
    },
    description,
    metadata: job.metadata,
  };

  const orgName = extractOrgFromUrl(baseUrl);
  return mapATSJobToOpportunity(atsJob, orgName, baseUrl);
}

function extractOrgFromUrl(baseUrl: string): string {
  try {
    const url = new URL(baseUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[0] || "Greenhouse";
  } catch {
    return "Greenhouse";
  }
}

registerATSAdapter(greenhouseAdapter);