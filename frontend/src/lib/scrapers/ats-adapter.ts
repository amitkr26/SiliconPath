import type { ScrapedOpportunity } from "./types";

export interface ATSAdapterConfig {
  name: string;
  sourceType: "ats";
  baseUrl: string;
  apiKey?: string;
  customFields?: Record<string, string>;
}

export interface ATSJobResponse {
  id: string;
  title: string;
  location?: { name: string } | string | null;
  department?: { name: string } | string | null;
  employmentType?: string | null;
  postedAt?: string | null;
  absoluteUrl?: string | null;
  description?: string | null;
  internalJobId?: string | null;
  content?: {
    description?: string;
    requirements?: string;
    responsibilities?: string;
  };
  metadata?: Record<string, any>;
}

export interface ATSAdapter {
  name: string;
  fetchJobs(config: ATSAdapterConfig): Promise<ATSJobResponse[]>;
  mapJob(job: ATSJobResponse, config: ATSAdapterConfig): ScrapedOpportunity;
}

const adapterRegistry: Map<string, ATSAdapter> = new Map();

export function registerATSAdapter(adapter: ATSAdapter): void {
  adapterRegistry.set(adapter.name.toLowerCase(), adapter);
}

export function getATSAdapter(name: string): ATSAdapter | undefined {
  return adapterRegistry.get(name.toLowerCase());
}

export function getAllATSAdapters(): ATSAdapter[] {
  return Array.from(adapterRegistry.values());
}

function inferCategory(title: string, department?: string): string {
  const t = title.toUpperCase();
  const d = (department || "").toUpperCase();
  if (t.includes("JRF") || t.includes("JUNIOR RESEARCH")) return "JRF";
  if (t.includes("SRF") || t.includes("SENIOR RESEARCH")) return "SRF";
  if (t.includes("PHD") || t.includes("DOCTORAL") || t.includes("FELLOWSHIP")) return "Fellowship";
  if (t.includes("SCIENTIST") || d.includes("SCIENCE") || d.includes("RESEARCH")) return "Govt Job";
  if (t.includes("ENGINEER") || d.includes("ENGINEERING")) return "Engineering";
  if (t.includes("INTERN") || t.includes("APPRENTICE")) return "Fellowship";
  if (t.includes("TECHNICIAN") || t.includes("ASSISTANT")) return "Govt Job";
  if (d.includes("ELECTRON") || d.includes("VLSI") || d.includes("SEMICONDUCTOR")) return "Electronics";
  return "JRF";
}

function inferLocation(loc: { name: string } | string | null | undefined): string {
  if (!loc) return "India";
  const locStr = typeof loc === "string" ? loc : loc.name;
  if (!locStr) return "India";
  const cities = ["Bengaluru", "Bangalore", "Delhi", "Hyderabad", "Chennai", "Kolkata", "Mumbai", "Pune", "Noida", "Gurugram", "Ahmedabad"];
  for (const city of cities) {
    if (locStr.toLowerCase().includes(city.toLowerCase())) return city;
  }
  return locStr;
}

function inferTags(title: string, description?: string, department?: string): string[] {
  const tags = new Set<string>(["ATS"]);
  const text = `${title} ${description || ""} ${department || ""}`.toLowerCase();
  if (text.includes("electron")) tags.add("electronics");
  if (text.includes("engineer")) tags.add("engineering");
  if (text.includes("research")) tags.add("research");
  if (text.includes("jrf") || text.includes("junior research")) tags.add("JRF");
  if (text.includes("phd") || text.includes("doctoral")) tags.add("PhD");
  if (text.includes("intern")) tags.add("internship");
  if (text.includes("apprentice")) tags.add("apprenticeship");
  if (text.includes("technician")) tags.add("technical");
  if (text.includes("scientist")) tags.add("scientist");
  if (text.includes("vlsi")) tags.add("VLSI");
  if (text.includes("semiconductor")) tags.add("semiconductor");
  if (text.includes("embedded")) tags.add("embedded");
  return Array.from(tags);
}

function extractDeadline(postedAt?: string | null, description?: string | null): string | null {
  if (!postedAt) return null;
  try {
    const date = new Date(postedAt);
    if (isNaN(date.getTime())) return null;
    const deadline = new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000);
    return deadline.toISOString().split("T")[0];
  } catch {
    return null;
  }
}

export function mapATSJobToOpportunity(
  job: ATSJobResponse,
  orgName: string,
  baseUrl: string
): ScrapedOpportunity {
  const title = job.title || "Untitled Position";
  const location = inferLocation(job.location);
  const department = typeof job.department === "object" ? job.department?.name : job.department;
  const category = inferCategory(title, department);
  const tags = inferTags(title, job.description || undefined, department);
  const deadline = extractDeadline(job.postedAt, job.description);

  const applyLink = job.absoluteUrl || job.metadata?.jobPostingUrl || "";
  const sourceUrl = baseUrl;

  return {
    title,
    organization: orgName,
    category,
    location,
    stipend: null,
    deadline,
    eligibility: null,
    description: job.description?.substring(0, 500) || null,
    apply_link: applyLink,
    source_url: sourceUrl,
    tags,
  };
}

function extractOrgName(config: ATSAdapterConfig): string {
  if (config.customFields?.organizationName) return config.customFields.organizationName;
  try {
    const url = new URL(config.baseUrl);
    return url.hostname.split(".")[0] || config.name;
  } catch {
    return config.name;
  }
}