import { ATSAdapter, ATSConfig, ATSJobResponse, registerATSAdapter, mapATSJobToOpportunity } from "./ats-adapters";

interface SmartRecruitersJobResponse {
  jobId: string;
  title: string;
  department: string;
  city: string;
  countryCode: string;
  employmentType: string;
  datePosted: string;
  url: string;
  externalUrl: string;
  companyName: string;
  description: string;
  education: string;
  skills: string[];
  broadcastType: string;
  applicationDeadline: string;
}

interface SmartRecruitersJobsResponse {
  jobs: SmartRecruitersJobResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export const smartRecruitersAdapter: ATSAdapter = {
  name: "smartrecruiters",
  sourceType: "ats",
  async fetchJobs(config: ATSConfig): Promise<any[]> {
    const baseUrl = config.baseUrl.replace(/\/+$/, "");
    const apiKey = config.apiKey || config.customFields?.apiKey;

    if (!apiKey) {
      throw new Error("SmartRecruiters requires apiKey in config");
    }

    const url = `${baseUrl}/api/v2/jobs?limit=100&offset=0&state=PUBLISHED"`;
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "apikey": apiKey,
        "User-Agent": "ElectroBridge-Scraper/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`SmartRecruiters API error: ${response.status} ${response.statusText}`);
    }

    const data: SmartRecruitersJobsResponse = await response.json();
    return data.jobs
      .filter((job) => job.broadcastType === "EXTERNAL")
      .map((job) => mapSmartRecruitersJob(job, baseUrl, config));
  },
  validateConfig(config: ATSConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!config.baseUrl) errors.push("baseUrl is required");
    if (!config.apiKey && !config.customFields?.apiKey) errors.push("apiKey is required for SmartRecruiters");
    return { valid: errors.length === 0, errors };
  },
};

function mapSmartRecruitersJob(job: SmartRecruitersJobResponse, baseUrl: string, config: ATSConfig) {
  const location = job.city && job.countryCode
    ? `${job.city}, ${job.countryCode}`
    : job.countryCode || "International";

  const department = job.department || "General";
  const atsJob: ATSJobResponse = {
    id: job.jobId,
    title: job.title,
    location: location,
    department: department,
    employmentType: job.employmentType,
    postedAt: job.datePosted,
    absoluteUrl: job.externalUrl,
    description: job.description,
    internalJobId: job.jobId,
    content: {
      description: job.description,
      requirements: job.skills?.join(", ") || "",
      responsibilities: job.education || "",
    },
    metadata: {
      companyName: job.companyName,
      education: job.education,
      skills: job.skills,
      broadcastType: job.broadcastType,
      applicationDeadline: job.applicationDeadline,
    },
  };

  const orgName = config?.apiKey || extractOrgFromUrl(baseUrl, config);
  return mapATSJobToOpportunity(atsJob, orgName, baseUrl);
}

function extractOrgFromUrl(baseUrl: string, config: ATSConfig): string {
  if (config.apiKey || config.customFields?.apiKey) return "SmartRecruiters";
  try {
    const url = new URL(baseUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[0] || "SmartRecruiters";
  } catch {
    return "SmartRecruiters";
  }
}

registerATSAdapter(smartRecruitersAdapter);