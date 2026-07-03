import type { ScrapedOpportunity } from "./types";

export interface ATSAdapter {
  name: string;
  sourceType: "ats";
  fetchJobs(config: ATSConfig): Promise<ScrapedOpportunity[]>;
  validateConfig(config: ATSConfig): { valid: boolean; errors: string[] };
}

export interface ATSConfig {
  baseUrl: string;
  apiKey?: string;
  boardToken?: string;
  departmentId?: string;
  customFields?: Record<string, string>;
  filters?: ATSFilters;
}

export interface ATSFilters {
  locations?: string[];
  departments?: string[];
  jobTypes?: string[];
  keywords?: string[];
  postedAfter?: string;
}

export interface ATSJobResponse {
  id: string;
  title: string;
  location?: { name: string } | string;
  department?: { name: string } | string;
  employmentType?: string;
  postedAt?: string;
  updatedAt?: string;
  absoluteUrl: string;
  description?: string;
  internalJobId?: string;
  content?: { description: string; requirements: string; responsibilities: string };
  metadata?: Record<string, unknown>;
}

export const ATS_ADAPTERS: Record<string, ATSAdapter> = {};

export function registerATSAdapter(adapter: ATSAdapter) {
  ATS_ADAPTERS[adapter.name] = adapter;
}

export function getATSAdapter(name: string): ATSAdapter | undefined {
  return ATS_ADAPTERS[name];
}

export function getAvailableATSAdapters(): ATSAdapter[] {
  return Object.values(ATS_ADAPTERS);
}

export function normalizeLocation(loc: { name: string } | string | undefined): string | null {
  if (!loc) return null;
  return typeof loc === "string" ? loc : loc.name;
}

export function normalizeDepartment(dept: { name: string } | string | undefined): string | null {
  if (!dept) return null;
  return typeof dept === "string" ? dept : dept.name;
}

export function inferCategoryFromTitle(title: string): string {
  const t = title.toUpperCase();
  if (t.includes("JRF") || t.includes("JUNIOR RESEARCH")) return "JRF";
  if (t.includes("SRF") || t.includes("SENIOR RESEARCH")) return "SRF";
  if (t.includes("PHD") || t.includes("DOCTORAL") || t.includes("FELLOWSHIP")) return "Fellowship";
  if (t.includes("SCIENTIST") || t.includes("ENGINEER") && !t.includes("SOFTWARE")) return "Govt Job";
  if (t.includes("INTERN")) return "Fellowship";
  if (t.includes("TECHNICIAN") || t.includes("ASSISTANT")) return "Govt Job";
  if (t.includes("SOFTWARE") || t.includes("DEVELOPER") || t.includes("PROGRAMMER")) return "Tech Job";
  return "JRF";
}

export function inferTags(title: string, description?: string): string[] {
  const tags = new Set<string>(["ATS"]);
  const text = `${title} ${description || ""}`.toLowerCase();
  const patterns: [string, string][] = [
    ["electron", "electronics"],
    ["engineer", "engineering"],
    ["research", "research"],
    ["jrf", "JRF"],
    ["phd", "PhD"],
    ["intern", "internship"],
    ["apprentice", "apprenticeship"],
    ["technician", "technical"],
    ["scientist", "scientist"],
    ["software", "software"],
    ["developer", "development"],
    ["data", "data-science"],
    ["machine learning", "ml"],
    ["ai", "artificial-intelligence"],
  ];
  for (const [keyword, tag] of patterns) {
    if (text.includes(keyword)) tags.add(tag);
  }
  return Array.from(tags);
}

export function extractDeadline(postedAt?: string, updatedAt?: string): string | null {
  if (!postedAt && !updatedAt) return null;
  try {
    const date = postedAt ? new Date(postedAt) : new Date(updatedAt!);
    const deadline = new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000);
    return deadline.toISOString().split("T")[0];
  } catch {
    return null;
  }
}

export function mapATSJobToOpportunity(
  job: ATSJobResponse,
  orgName: string,
  sourceUrl: string
): ScrapedOpportunity {
  return {
    title: job.title,
    organization: orgName,
    category: inferCategoryFromTitle(job.title),
    location: normalizeLocation(job.location),
    stipend: null,
    deadline: extractDeadline(job.postedAt, job.updatedAt),
    eligibility: null,
    description: job.description
      || job.content?.description
      || job.content?.requirements
      || job.content?.responsibilities
      || null,
    apply_link: job.absoluteUrl,
    source_url: sourceUrl,
    tags: inferTags(job.title, job.description || job.content?.description),
  };
}