import * as cheerio from "cheerio";
import type { ScrapedOpportunity } from "./types";

const DRDO_VACANCIES_URL = "https://drdo.gov.in/drdo/en/offerings/vacancies";

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
    /(\d{2}\/\d{2}\/\d{4})/,
    /(\d{2}-\d{2}-\d{4})/,
    /(\d{2}\.\d{2}\.\d{4})/,
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
  if (t.includes("RA") || t.includes("RESEARCH ASSOCIATE")) return "SRF";
  if (t.includes("SCIENTIST") || t.includes("TECHNICAL ASSISTANT")) return "Govt Job";
  if (t.includes("INTERN") || t.includes("APPRENTICE")) return "Fellowship";
  if (t.includes("TECHNICIAN") || t.includes("ADMIN") || t.includes("MEDICAL")) return "Govt Job";
  if (t.includes("FELLOWSHIP") || t.includes("PHD")) return "Fellowship";
  return "JRF";
}

function inferLocation(text: string): string | null {
  const cities = [
    "Bengaluru", "Bangalore", "Delhi", "New Delhi", "Hyderabad",
    "Pune", "Chennai", "Kolkata", "Mumbai", "Chandigarh",
    "Gwalior", "Kanpur", "Tezpur", "Nasik", "Ambernath",
    "Visakhapatnam", "Dehradun", "Haldwani",
  ];
  for (const city of cities) {
    if (text.includes(city)) return city;
  }
  return "India";
}

function inferTags(title: string, text: string): string[] {
  const tags: string[] = ["DRDO", "defence"];
  const combined = `${title} ${text}`.toLowerCase();
  if (combined.includes("electron")) tags.push("electronics");
  if (combined.includes("engineer")) tags.push("engineering");
  if (combined.includes("research") || combined.includes("fellow")) tags.push("research");
  if (combined.includes("jrf") || combined.includes("junior research")) tags.push("JRF");
  if (combined.includes("srf") || combined.includes("senior research")) tags.push("SRF");
  if (combined.includes("intern")) tags.push("internship");
  if (combined.includes("apprentice")) tags.push("apprenticeship");
  if (combined.includes("scientist")) tags.push("scientist");
  return Array.from(new Set(tags));
}

export async function scrapeDRDO(): Promise<ScrapedOpportunity[]> {
  const opportunities: ScrapedOpportunity[] = [];

  try {
    const res = await fetch(DRDO_VACANCIES_URL, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "Mozilla/5.0 (ElectroBridge/1.0)" },
    });
    if (!res.ok) {
      console.error(`DRDO scraper: HTTP ${res.status}`);
      return [];
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    const titles = $(".vacanciess-title");
    titles.each((i, el) => {
      if (opportunities.length >= 20) return;

      const title = $(el).text().trim();
      if (!title || title.length < 15) return;
      if (title === "Vacancies" || title.includes("Breadcrumb")) return;

      if (isResultOrNotice(title)) return;

      const descText = $(el).siblings(".vacanciess-desc").first().text().trim() || title;

      opportunities.push({
        title,
        organization: "DRDO",
        category: inferCategory(title),
        location: inferLocation(title + " " + descText),
        stipend: null,
        deadline: extractDeadline(title + " " + descText),
        eligibility: null,
        description: descText.substring(0, 300),
        apply_link: DRDO_VACANCIES_URL,
        source_url: DRDO_VACANCIES_URL,
        tags: inferTags(title, descText),
      });
    });
  } catch (error) {
    console.error("Error scraping DRDO:", error);
  }

  return opportunities;
}
