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
  jrf: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  srf: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  phd: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "govt-job": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  fellowship: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  private: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  internship: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  postdoc: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  international: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
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
  if (days === 0) return "Today";
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
