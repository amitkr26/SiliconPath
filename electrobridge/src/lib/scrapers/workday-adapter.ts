import { ATSAdapter, ATSConfig, ATSJobResponse, registerATSAdapter, mapATSJobToOpportunity } from "./ats-adapters";

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
  async fetchJobs(config: ATSConfig): Promise<any[]> {
    const baseUrl = config.baseUrl.replace(/\/+$/, "");
    const tenant = config.customFields?.tenant || "yourtenant";
    const site = config.customFields?.site || "External";

    const url = `${baseUrl}/wday/cxs/${tenant}/${site}/jobs`;

    const body = {
      appliedFacets: {},
      limit: 100,
      offset: 0,
      searchText: config.filters?.keywords?.join(" ") || "",
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "ElectroBridge-Scraper/1.0",
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
    if (!config.customFields?.tenant) errors.push("customFields.tenant is required for Workday");
    if (!config.customFields?.site) errors.push("customFields.site is required for Workday");
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