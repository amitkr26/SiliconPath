import { clsx } from "clsx";
import type { ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getURL() {
  const siteUrl = process?.env?.NEXT_PUBLIC_SITE_URL?.trim();
  const appUrl = process?.env?.NEXT_PUBLIC_APP_URL?.trim();
  const vercelUrl = process?.env?.NEXT_PUBLIC_VERCEL_URL?.trim();
  const defaultUrl = "http://localhost:3000";

  let url = siteUrl || appUrl || vercelUrl || defaultUrl;
  url = url.startsWith("http") ? url : `https://${url}`;
  url = url.endsWith("/") ? url : `${url}/`;
  return url;
}

/**
 * ponytail: Clean HTML entity decoding & text formatting helper.
 * Solves raw unescaped HTML entities (&lt;p&gt;, &amp;nbsp;, &amp;quot;)
 * into clean formatted plain text paragraphs.
 */
export function cleanHtmlDescription(input: string | null | undefined): string {
  if (!input) return "Detailed position responsibilities and eligibility criteria are provided on the official organization portal.";

  let text = String(input);

  // Multi-pass HTML entity decoding
  for (let i = 0; i < 3; i++) {
    text = text
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&amp;/gi, "&")
      .replace(/&nbsp;/gi, " ")
      .replace(/&#39;/gi, "'")
      .replace(/&quot;/gi, '"')
      .replace(/&bull;/gi, "• ")
      .replace(/&hellip;/gi, "...")
      .replace(/&mdash;/gi, "—")
      .replace(/&ndash;/gi, "–");
  }

  // Convert HTML linebreaks & paragraph tags into clean newlines
  text = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, ""); // Strip remaining HTML tags

  // Clean excessive whitespace while preserving paragraph spacing
  text = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line, idx, arr) => line.length > 0 || (idx > 0 && arr[idx - 1].length > 0))
    .join("\n");

  return text.trim() || "Detailed position responsibilities and eligibility criteria are provided on the official organization portal.";
}

export const CATEGORIES = [
  "All",
  "jrf",
  "srf",
  "phd",
  "govt-job",
  "fellowship",
  "private",
  "internship",
  "postdoc",
  "international",
];

export const CATEGORY_COLORS: Record<string, string> = {
  jrf: "bg-purple-500/10 text-purple-600 border-purple-200 font-semibold",
  srf: "bg-blue-500/10 text-blue-600 border-blue-200 font-semibold",
  phd: "bg-emerald-500/10 text-emerald-600 border-emerald-200 font-semibold",
  "govt-job": "bg-amber-500/10 text-amber-600 border-amber-200 font-semibold",
  government: "bg-amber-500/10 text-amber-600 border-amber-200 font-semibold",
  "Govt Job": "bg-amber-500/10 text-amber-600 border-amber-200 font-semibold",
  fellowship: "bg-pink-500/10 text-pink-600 border-pink-200 font-semibold",
  Fellowship: "bg-pink-500/10 text-pink-600 border-pink-200 font-semibold",
  private: "bg-cyan-500/10 text-cyan-700 border-cyan-200 font-semibold",
  job: "bg-cyan-500/10 text-cyan-700 border-cyan-200 font-semibold",
  Job: "bg-cyan-500/10 text-cyan-700 border-cyan-200 font-semibold",
  internship: "bg-violet-500/10 text-violet-600 border-violet-200 font-semibold",
  Internship: "bg-violet-500/10 text-violet-600 border-violet-200 font-semibold",
  postdoc: "bg-rose-500/10 text-rose-600 border-rose-200 font-semibold",
  international: "bg-indigo-500/10 text-indigo-600 border-indigo-200 font-semibold",
};

export const ELIGIBILITY_OPTIONS = [
  "All",
  "B.Tech",
  "M.Tech",
  "PhD",
  "M.Sc",
  "B.Sc",
  "Diploma",
  "Any Graduate",
];

export const LOCATIONS = [
  "All India",
  "Bangalore",
  "Hyderabad",
  "Pune",
  "Mumbai",
  "Delhi / NCR",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Multiple Locations",
  "Remote / WFH",
  "Abroad",
];

export const DEADLINE_FILTERS = [
  "Any Deadline",
  "Within 7 days",
  "Within 14 days",
  "Within 30 days",
  "Expired",
];

export function getDaysUntilDeadline(deadline: string): number {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isExpired(deadline: string): boolean {
  return getDaysUntilDeadline(deadline) < 0;
}

export function getDaysAgo(date: string): string {
  const now = new Date();
  const posted = new Date(date);
  const diff = now.getTime() - posted.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export function isNew(date: string, thresholdDays = 7): boolean {
  const now = new Date();
  const posted = new Date(date);
  const diff = now.getTime() - posted.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return days < thresholdDays;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function inferAuthenticOrganization(dbRow: any): string {
  if (dbRow.organizations?.name) return dbRow.organizations.name;
  if (dbRow.organization && dbRow.organization !== "Unknown Organization" && dbRow.organization !== "Semiconductor Institute") return dbRow.organization;

  const url = (dbRow.apply_url || dbRow.apply_link || dbRow.source_url || "").toLowerCase();
  const text = `${dbRow.title || ""} ${url} ${(dbRow.tags || []).join(" ")}`.toUpperCase();

  if (url.includes("arm.com")) return "Arm Ltd";
  if (url.includes("apple.com")) return "Apple";
  if (url.includes("westerndigital.com") || url.includes("westerndigital")) return "Western Digital";
  if (url.includes("qualcomm.com") || text.includes("QUALCOMM")) return "Qualcomm";
  if (url.includes("intel.com") || text.includes("INTEL")) return "Intel Corporation";
  if (url.includes("amd.com") || text.includes("AMD")) return "AMD";
  if (url.includes("nvidia.com") || text.includes("NVIDIA")) return "NVIDIA";
  if (url.includes("synopsys.com") || text.includes("SYNOPSYS")) return "Synopsys";
  if (url.includes("cadence.com") || text.includes("CADENCE")) return "Cadence Design Systems";
  if (url.includes("tataelectronics") || text.includes("TATA")) return "Tata Electronics";
  if (url.includes("micron.com") || text.includes("MICRON")) return "Micron Technology";
  if (url.includes("ti.com") || text.includes("TEXAS INSTRUMENTS")) return "Texas Instruments";
  if (url.includes("drdo.gov.in") || text.includes("DRDO") || text.includes("SAG") || text.includes("DMSRDE")) return "DRDO";
  if (url.includes("isro.gov.in") || text.includes("ISRO") || text.includes("SAC") || text.includes("URSC")) return "ISRO";
  if (url.includes("csir.res.in") || text.includes("CSIR") || text.includes("CEERI")) return "CSIR";
  if (url.includes("iitb.ac.in") || text.includes("IIT BOMBAY") || text.includes("IRCC")) return "IIT Bombay";
  if (url.includes("iitm.ac.in") || text.includes("IIT MADRAS") || text.includes("ICSR")) return "IIT Madras";
  if (url.includes("iisc.ac.in") || text.includes("IISC")) return "IISc Bangalore";
  if (url.includes("scl.gov.in") || text.includes("SEMICONDUCTOR LABORATORY")) return "SCL Mohali";
  if (url.includes("cdac.in") || text.includes("C-DAC")) return "C-DAC";

  return "Semiconductor Enterprise";
}

function inferCategoryLabel(dbRow: any): string {
  const rawCat = (dbRow.category || "").toLowerCase();
  const title = (dbRow.title || "").toUpperCase();

  if (title.includes("JRF") || title.includes("JUNIOR RESEARCH")) return "JRF";
  if (title.includes("SRF") || title.includes("SENIOR RESEARCH")) return "SRF";
  if (title.includes("PHD") || title.includes("DOCTORAL")) return "PhD";
  if (title.includes("INTERN") || title.includes("APPRENTICE")) return "Internship";
  if (title.includes("FELLOW")) return "Fellowship";
  if (title.includes("SCIENTIST") || title.includes("OFFICER") || title.includes("DRDO") || title.includes("ISRO")) return "Govt Job";
  if (title.includes("ENGINEER") || title.includes("DEVELOPER") || title.includes("STAFF") || title.includes("TECHNICIAN") || title.includes("ARCHITECT")) return "Job";

  if (rawCat === "jrf") return "JRF";
  if (rawCat === "srf") return "SRF";
  if (rawCat === "phd") return "PhD";
  if (rawCat === "government" || rawCat === "govt-job") return "Govt Job";
  if (rawCat === "internship") return "Internship";
  if (rawCat === "fellowship") return "Fellowship";
  if (rawCat === "job" || rawCat === "private") return "Job";

  return "Job";
}

export function mapDbOpportunityToClient(dbRow: any): any {
  if (!dbRow) return null;
  const org = inferAuthenticOrganization(dbRow);
  const cat = inferCategoryLabel(dbRow);
  const cleanedDesc = cleanHtmlDescription(dbRow.description);
  const cleanedElig = cleanHtmlDescription(dbRow.eligibility);

  return {
    ...dbRow,
    organization: org,
    category: cat,
    description: cleanedDesc,
    eligibility: cleanedElig !== "Detailed position responsibilities and eligibility criteria are provided on the official organization portal." ? cleanedElig : null,
    org_slug: dbRow.organizations?.slug || dbRow.org_slug || org.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    stipend: dbRow.salary_range || dbRow.stipend || "As per Industry Pay Standard",
    apply_link: dbRow.apply_url || dbRow.apply_link || dbRow.source_url || "#",
    posted_at: dbRow.created_at || dbRow.posted_at || new Date().toISOString(),
    verification_status: "verified",
  };
}

/**
 * ponytail: Map raw news article rows to client model, ensuring source_url and source fields are present.
 */
export function mapNewsArticleToClient(dbRow: any): any {
  if (!dbRow) return null;
  return {
    ...dbRow,
    source: dbRow.source || dbRow.source_name || "Official Source",
    source_url: dbRow.source_url || dbRow.url || "#",
    slug: dbRow.slug || dbRow.id,
    summary: cleanHtmlDescription(dbRow.summary),
  };
}

const DISPLAY_GARBAGE_TITLE =
  /^(home|contact|sitemap|about|privacy|terms|login|sign in|register|apply now|download|click here|read more|view all|payment gateway|at a glance|departments|reference designs|quick links|useful links|important links|all rights reserved|copyright|disclaimer|help|faq|search|breadcrumb|news & events|photo gallery|tender|archive|annual report|right to information|overview|scholarships & funding|academic positions|position paper archive)$/i;

export function isDisplayableOpportunity(opp: {
  title?: string | null;
  apply_link?: string | null;
  apply_url?: string | null;
} | null | undefined): boolean {
  if (!opp) return false;
  const title = (opp.title || "").trim();
  if (title.length < 5) return false;
  if (DISPLAY_GARBAGE_TITLE.test(title)) return false;
  return true;
}
