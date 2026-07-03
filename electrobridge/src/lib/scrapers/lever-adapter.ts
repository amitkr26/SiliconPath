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
  async fetchJobs(config: ATSConfig): Promise<any[]> {
    const baseUrl = config.baseUrl.replace(/\/+$/, "");
    let url = `${baseUrl}/postings?mode=json`;

    if (config.boardToken) {
      url = `${baseUrl}/${config.boardToken}?mode=json`;
    }

    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "SiliconPath-Scraper/1.0",
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