import type { ScrapedOpportunity } from "./types";
import { ATSAdapter, ATSConfig, ATSJobResponse, registerATSAdapter, mapATSJobToOpportunity } from "./ats-adapters";

interface LeverJobResponse {
  id: string;
  text: string;
  categories: {
    team?: string;
    department?: string;
    location?: string;
    commitment?: string;
    level?: string;
  };
  lists: string[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
  applyUrl: string;
  hostedUrl: string;
  description: string;
  descriptionPlain: string;
  additional: string;
  additionalPlain: string;
  state: string;
  distribution: string;
}

interface LeverJobsResponse {
  data: LeverJobResponse[];
}

export const leverAdapter: ATSAdapter = {
  name: "lever",
  sourceType: "ats",
  async fetchJobs(config: ATSConfig): Promise<ScrapedOpportunity[]> {
    const baseUrl = config.baseUrl.replace(/\/+$/, "");
    let companyId = config.boardToken || config.customFields?.boardToken;

    if (!companyId) {
      try {
        const urlObj = new URL(baseUrl);
        companyId = urlObj.pathname.split('/').filter(Boolean).pop();
      } catch(e) {}
    }

    if (!companyId) {
      throw new Error("Lever requires companyId in config or URL");
    }

    const url = `https://api.lever.co/v0/postings/${companyId}?mode=json`;

    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Lever API error: ${response.status} ${response.statusText}`);
    }

    const data: LeverJobsResponse = await response.json();
    return data.data
      .filter((job) => job.state === "published")
      .map((job) => mapLeverJob(job, baseUrl, config.boardToken));
  },
  validateConfig(config: ATSConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!config.baseUrl) errors.push("baseUrl is required");
    return { valid: errors.length === 0, errors };
  },
};

function mapLeverJob(job: LeverJobResponse, baseUrl: string, boardToken?: string) {
  const location = job.categories.location
    ? { name: job.categories.location }
    : undefined;

  const department = job.categories.department
    ? { name: job.categories.department }
    : job.categories.team
      ? { name: job.categories.team }
      : undefined;

  const atsJob: ATSJobResponse = {
    id: job.id,
    title: job.text,
    location,
    department,
    employmentType: job.categories.commitment,
    postedAt: new Date(job.createdAt).toISOString(),
    updatedAt: new Date(job.updatedAt).toISOString(),
    absoluteUrl: job.applyUrl || job.hostedUrl,
    description: job.descriptionPlain,
    content: {
      description: job.descriptionPlain,
      requirements: job.additionalPlain,
      responsibilities: "",
    },
    metadata: {
      lists: job.lists,
      tags: job.tags,
      level: job.categories.level,
      distribution: job.distribution,
    },
  };

  const orgName = extractOrgFromUrl(baseUrl, boardToken);
  return mapATSJobToOpportunity(atsJob, orgName, baseUrl);
}

function extractOrgFromUrl(baseUrl: string, boardToken?: string): string {
  if (boardToken) return boardToken;
  try {
    const url = new URL(baseUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[0] || "Lever";
  } catch {
    return "Lever";
  }
}

registerATSAdapter(leverAdapter);