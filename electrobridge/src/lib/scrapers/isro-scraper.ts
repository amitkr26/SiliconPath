import * as cheerio from "cheerio";
import type { ScrapedOpportunity } from "./types";

const ISRO_URL = "https://www.isro.gov.in/Careers.html";

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

export async function scrapeISRO(): Promise<ScrapedOpportunity[]> {
  const opportunities: ScrapedOpportunity[] = [];

  try {
    const res = await fetch(ISRO_URL, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ElectroBridge/1.0)" },
    });
    if (!res.ok) {
      console.error(`ISRO scraper: HTTP ${res.status}`);
      return [];
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    $("tr").each((_, row) => {
      if (opportunities.length >= 20) return;

      const text = $(row).text().trim();
      if (!text || text.length < 30) return;

      const linkEl = $(row).find("a").first();
      const href = linkEl.attr("href") || "";
      const linkText = linkEl.text().trim();

      const title = linkText || text.split("\n")[0].trim();
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
        source_url: ISRO_URL,
        tags: inferTags(title, text),
      });
    });
  } catch (error) {
    console.error("Error scraping ISRO:", error);
  }

  return opportunities;
}
