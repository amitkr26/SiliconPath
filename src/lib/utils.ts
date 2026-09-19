import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

export function cleanHtmlDescription(input: string | null | undefined): string {
  if (!input) return "";
  let text = String(input);
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
  text = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  text = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line, idx, arr) => line.length > 0 || (idx > 0 && arr[idx - 1].length > 0))
    .join("\n");
  return text.trim();
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return String(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
