/**
 * ISRO Careers scraper — replica of the production
 * `frontend/src/lib/scrapers/isro-scraper.ts`, ported for the backend worker.
 *
 * Deliberate divergences from the frontend (all documented in the Phase 8
 * report / KNOWN_ISSUES):
 *  - TLS verification is NEVER disabled. The frontend sets
 *    NODE_TLS_REJECT_UNAUTHORIZED=0 around its fetch; the live careers page
 *    serves a valid certificate (verified 2026-08-20), so the replica keeps
 *    the platform's default verified TLS and drops the insecure toggle.
 *  - HTTP non-ok is a thrown error (worker exits non-zero = the fail-loud
 *    contract), where the frontend swallows it and returns [].
 * Every parsing rule, filter, inference and field mapping below is
 * byte-identical to the frontend so dedup + normalization stay comparable.
 */

import * as cheerio from "cheerio";
import type { ScrapedOpportunity } from "./opportunity-utils.js";

export const ISRO_URL = "https://www.isro.gov.in/Careers.html";

const RESULT_PATTERNS = [
  /list of selected/i,
  /list of provisionally/i,
  /provisional selected/i,
  /result for selection/i,
  /second list/i,
  /corrigendum/i,
  /answer key/i,
  /revised.*list/i,
  /validity of the selection/i,
  /extended upto/i,
  /revised final/i,
];

function isResultOrNotice(title: string): boolean {
  return RESULT_PATTERNS.some((p) => p.test(title));
}

function extractDeadline(text: string): string | null {
  const patterns = [
    /(\d{2}\.\d{2}\.\d{4})/,
    /(\d{2}\/\d{2}\/\d{4})/,
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return null;
}

function inferCategory(title: string): string {
  const t = title.toUpperCase();
  if (t.includes("JRF") || t.includes("JUNIOR RESEARCH FELLOW")) return "JRF";
  if (t.includes("SRF") || t.includes("SENIOR RESEARCH FELLOW")) return "SRF";
  if (t.includes("PHD") || t.includes("DOCTORAL") || t.includes("FELLOWSHIP")) return "Fellowship";
  if (t.includes("SCIENTIST") || t.includes("ENGINEER")) return "Govt Job";
  if (t.includes("INTERN") || t.includes("APPRENTICE")) return "Fellowship";
  if (t.includes("TECHNICIAN") || t.includes("ASSISTANT")) return "Govt Job";
  return "JRF";
}

function inferLocation(text: string): string {
  const cities = ["Bengaluru", "Bangalore", "Delhi", "Hyderabad", "Chennai", "Kolkata", "Mumbai", "Sriharikota", "Thiruvananthapuram"];
  for (const city of cities) {
    if (text.includes(city)) return city;
  }
  return "India";
}

function inferTags(title: string, text: string): string[] {
  const tags: string[] = ["ISRO", "space"];
  const combined = `${title} ${text}`.toLowerCase();
  if (combined.includes("electron")) tags.push("electronics");
  if (combined.includes("engineer")) tags.push("engineering");
  if (combined.includes("research")) tags.push("research");
  if (combined.includes("jrf") || combined.includes("junior research")) tags.push("JRF");
  if (combined.includes("phd") || combined.includes("doctoral")) tags.push("PhD");
  if (combined.includes("intern")) tags.push("internship");
  if (combined.includes("apprentice")) tags.push("apprenticeship");
  if (combined.includes("technician")) tags.push("technical");
  if (combined.includes("scientist")) tags.push("scientist");
  return Array.from(new Set(tags));
}

/** Pure parse of the careers-page HTML — same rules as the frontend. */
export function parseISROCareersHtml(html: string): ScrapedOpportunity[] {
  const opportunities: ScrapedOpportunity[] = [];
  const $ = cheerio.load(html);

  $("tr").each((_, row) => {
    if (opportunities.length >= 20) return;

    const text = $(row).text().trim();
    if (!text || text.length < 30) return;

    const linkEl = $(row).find("a").first();
    const href = linkEl.attr("href") || "";
    const linkText = linkEl.text().trim();

    const title = (linkText || text.split("\n")[0].trim()).replace(/\s+/g, " ").replace(/\s*Read More\s*$/i, "").trim(); // parity: strip trailing " Read More" (FIX #17)
    if (!title || title.length < 15) return;
    if (title.includes("Home") || title.includes("Contact") || title.includes("Sitemap")) return;
    if (isResultOrNotice(title)) return;

    const fullUrl = href
      ? href.startsWith("http")
        ? href
        : `https://www.isro.gov.in${href.startsWith("/") ? "" : "/"}${href}`
      : ISRO_URL;

    opportunities.push({
      title,
      organization: "ISRO",
      category: inferCategory(title),
      location: inferLocation(text),
      stipend: null,
      deadline: extractDeadline(text),
      eligibility: null,
      description: text.substring(0, 300),
      apply_link: fullUrl,
      source_url: fullUrl,  // use per-listing URL for dedup, not the careers page
      tags: inferTags(title, text),
    });
  });

  return opportunities;
}

export async function scrapeISRO(deps: { fetchHtml?: () => Promise<string> } = {}): Promise<ScrapedOpportunity[]> {
  const fetchHtml = deps.fetchHtml ?? (async () => {
    const res = await fetch(ISRO_URL, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BerojgarDegreeWala/1.0)" },
    });
    if (!res.ok) {
      throw new Error(`ISRO scraper: HTTP ${res.status}`);
    }
    return res.text();
  });
  return parseISROCareersHtml(await fetchHtml());
}