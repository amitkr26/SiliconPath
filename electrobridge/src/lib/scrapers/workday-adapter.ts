import type { ScrapedOpportunity } from "./types";
import { ATSAdapter, ATSConfig, ATSJobResponse, registerATSAdapter, mapATSJobToOpportunity } from "./ats-adapters";
import { logger } from "@/lib/logger";

interface WorkdayJobResponse {
  jobRequisitionId: string;
  title: string;
  location: string;
  jobCategory: string;
  jobType: string;
  postedOn: string;
  externalApplyUrl: string;
  jobDescription: string;
  locations: { descriptor: string }[];
  primaryLocation?: { descriptor: string };
  jobPostingId: string;
}

interface WorkdayJobsResponse {
  jobPostings: WorkdayJobResponse[];
  total: number;
}

export const workdayAdapter: ATSAdapter = {
  name: "workday",
  sourceType: "ats",
  async fetchJobs(config: ATSConfig): Promise<ScrapedOpportunity[]> {
    let baseUrl = config.baseUrl.replace(/\/+$/, "");
    let tenant = config.customFields?.tenant;
    let site = config.customFields?.site;

    // Extract tenant and site from baseUrl if possible
    try {
      const urlObj = new URL(baseUrl);
      if (!tenant) {
        tenant = urlObj.hostname.split('.')[0];
      }
      if (!site) {
        site = urlObj.pathname.split('/').pop() || "External";
      }
      // reset baseUrl to just the origin
      baseUrl = urlObj.origin;
    } catch (e) {
      if (!tenant) tenant = "yourtenant";
      if (!site) site = "External";
    }

    const url = `${baseUrl}/wday/cxs/${tenant}/${site}/jobs`;

    const searchText = config.filters?.keywords?.join(" ") || "";
    const body: { limit: number; offset: number; searchText?: string } = {
      limit: 20,
      offset: 0,
    };
    
    if (searchText) {
      body.searchText = searchText;
    }

    logger.debug("Workday scraping", { url, body });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Workday API error: ${response.status} ${response.statusText}`);
    }

    const data: WorkdayJobsResponse = await response.json();
    return data.jobPostings.map((job) => mapWorkdayJob(job, baseUrl, config));
  },
  validateConfig(config: ATSConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!config.baseUrl) errors.push("baseUrl is required");
    return { valid: errors.length === 0, errors };
  },
};

function mapWorkdayJob(job: WorkdayJobResponse, baseUrl: string, config?: ATSConfig) {
  const location = job.primaryLocation
    ? { name: job.primaryLocation.descriptor }
    : job.locations?.[0]
      ? { name: job.locations[0].descriptor }
      : undefined;

  const atsJob: ATSJobResponse = {
    id: job.jobRequisitionId,
    title: job.title,
    location,
    department: job.jobCategory ? { name: job.jobCategory } : undefined,
    employmentType: job.jobType,
    postedAt: job.postedOn,
    absoluteUrl: job.externalApplyUrl,
    description: job.jobDescription,
    internalJobId: job.jobPostingId,
    content: {
      description: job.jobDescription,
      requirements: "",
      responsibilities: "",
    },
    metadata: {
      jobPostingId: job.jobPostingId,
      jobRequisitionId: job.jobRequisitionId,
    },
  };

  const orgName = extractOrgFromUrl(baseUrl, config?.customFields?.tenant);
  return mapATSJobToOpportunity(atsJob, orgName, baseUrl);
}

function extractOrgFromUrl(baseUrl: string, tenant?: string): string {
  if (tenant) return tenant;
  try {
    const url = new URL(baseUrl);
    return url.hostname.split(".")[0] || "Workday";
  } catch {
    return "Workday";
  }
}

registerATSAdapter(workdayAdapter);