import type { ScrapedOpportunity } from "./types";
import { ATSAdapter, ATSConfig, ATSJobResponse, registerATSAdapter, mapATSJobToOpportunity } from "./ats-adapters";

interface SmartRecruitersRawPosting {
  id: string;
  name: string;
  department?: { label: string };
  location?: { city: string; country: string };
  typeOfEmployment?: { label: string };
  releasedDate?: string;
  company?: { name: string };
}

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

export const smartRecruitersAdapter: ATSAdapter = {
  name: "smartrecruiters",
  sourceType: "ats",
  async fetchJobs(config: ATSConfig): Promise<ScrapedOpportunity[]> {
    let baseUrl = config.baseUrl.replace(/\/+$/, "");
    
    // Extract company name from the url (e.g. https://careers.smartrecruiters.com/NordicSemiconductor)
    let companyName = "";
    try {
      const urlObj = new URL(baseUrl);
      companyName = urlObj.pathname.split('/').pop() || "";
    } catch(e) {}
    
    if (!companyName) {
      throw new Error("SmartRecruiters requires companyName in URL path");
    }

    const url = `https://api.smartrecruiters.com/v1/companies/${companyName}/postings`;
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`SmartRecruiters API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const jobs: SmartRecruitersRawPosting[] = data.content || [];
    return jobs.map((job) => {
      // Map to SmartRecruitersJobResponse format expected by mapSmartRecruitersJob
      return mapSmartRecruitersJob({
        jobId: job.id,
        title: job.name,
        department: job.department?.label || "",
        city: job.location?.city || "",
        countryCode: job.location?.country || "",
        employmentType: job.typeOfEmployment?.label || "",
        datePosted: job.releasedDate || "",
        url: baseUrl,
        externalUrl: `https://jobs.smartrecruiters.com/${companyName}/${job.id}`,
        companyName: job.company?.name || companyName,
        description: "", // Public postings list might not include full description
        education: "",
        skills: [],
        broadcastType: "EXTERNAL",
        applicationDeadline: ""
      }, baseUrl, config);
    });
  },
  validateConfig(config: ATSConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!config.baseUrl) errors.push("baseUrl is required");
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