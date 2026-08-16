import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { resolveOrganization } from "@/lib/organizations/resolve";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getURL() {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.endsWith("/") ? window.location.origin : `${window.location.origin}/`;
  }
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

function inferAuthenticOrganization(dbRow: any): string | null {
  // P0.3: single resolver module owns org inference (domain/token/name/title
  // evidence + person-name guard). Previously this function had its own URL map.
  const r = resolveOrganization({
    sourceUrl: dbRow.apply_url || dbRow.apply_link || dbRow.source_url,
    title: dbRow.title,
    name:
      dbRow.organization &&
      dbRow.organization !== "Unknown Organization" &&
      dbRow.organization !== "Semiconductor Institute"
        ? dbRow.organization
        : null,
    organizations: dbRow.organizations ? [dbRow.organizations] : [],
  });
  return r.name;
}

function inferCategoryLabel(dbRow: any): string {
  const rawCat = (dbRow.category || "").toLowerCase();
  const title = (dbRow.title || "").toUpperCase();

  // Prefer the raw DB category — filters/counts run on it, so the displayed
  // badge must agree with what the user filtered by. Title heuristics only
  // kick in when the category is missing/unknown.
  if (rawCat === "jrf" || rawCat === "research fellowship") return "JRF";
  if (rawCat === "srf" || rawCat === "senior research fellow") return "SRF";
  if (rawCat === "phd" || rawCat === "scholarship" || rawCat === "doctoral") return "PhD";
  if (rawCat === "government" || rawCat === "govt-job") return "Govt Job";
  if (rawCat === "internship") return "Internship";
  if (rawCat === "fellowship") return "Fellowship";
  if (rawCat === "job" || rawCat === "private") return "Job";

  if (title.includes("JRF") || title.includes("JUNIOR RESEARCH")) return "JRF";
  if (title.includes("SRF") || title.includes("SENIOR RESEARCH")) return "SRF";
  if (title.includes("PHD") || title.includes("DOCTORAL")) return "PhD";
  if (title.includes("INTERN") || title.includes("APPRENTICE")) return "Internship";
  if (title.includes("FELLOW")) return "Fellowship";
  if (title.includes("SCIENTIST") || title.includes("OFFICER") || title.includes("DRDO") || title.includes("ISRO")) return "Govt Job";
  if (title.includes("ENGINEER") || title.includes("DEVELOPER") || title.includes("STAFF") || title.includes("TECHNICIAN") || title.includes("ARCHITECT")) return "Job";

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
    org_slug: dbRow.organizations?.slug || dbRow.org_slug || (org ? org.toLowerCase().replace(/[^a-z0-9]+/g, "-") : (dbRow.organization_id || "")),
    stipend: dbRow.salary_range || dbRow.stipend || null,
    apply_link: dbRow.apply_url || dbRow.apply_link || dbRow.source_url || "#",
    posted_at: dbRow.created_at || dbRow.posted_at || null,
    verification_status: dbRow.verification_status ?? "unverified",
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

// Usernames that would collide with real app routes or system pages.
// Must be checked in the profile PATCH write path (server) and the edit form (client).
export const RESERVED_USERNAMES = [
  "about", "academy", "admin", "api", "applications", "ask-ai", "auth",
  "categories", "category", "chat", "community", "companies", "contact",
  "dashboard", "employer", "employers", "feed", "login", "match", "messages",
  "network", "news", "notifications", "onboarding", "opportunities",
  "organizations", "people", "post-job", "profile", "register", "resources",
  "resume", "saved", "search", "settings", "signup", "me", "www",
];

// Columns safe to expose on public profiles (never email / email_notifications).
export const PUBLIC_PROFILE_FIELDS =
  "id, username, display_name, headline, bio, location, country, job_title, current_company, experience_years, skills, interests, linkedin_url, github_url, website_url, avatar_url, is_open_to_work, profile_views, account_type, created_at";
