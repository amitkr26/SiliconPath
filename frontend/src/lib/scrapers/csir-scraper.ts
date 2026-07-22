import * as cheerio from "cheerio";
import type { ScrapedOpportunity } from "./types";

const CSIR_URL = "https://www.csir.res.in/en/career-opportunities/recruitment";

const RESULT_PATTERNS = [
  /result of interview/i, /list of selected/i, /list of provisionally/i,
  /provisional selected/i, /answer key/i, /corrigendum/i, /revised.*list/i,
];

function inferCategory(title: string): string {
  const t = title.toUpperCase();
  if (t.includes("JRF") || t.includes("JUNIOR RESEARCH FELLOW")) return "JRF";
  if (t.includes("SRF") || t.includes("SENIOR RESEARCH FELLOW")) return "SRF";
  if (t.includes("RA") || t.includes("RESEARCH ASSOCIATE")) return "SRF";
  if (t.includes("PROJECT STAFF") || t.includes("PROJECT ASSISTANT")) return "JRF";
  if (t.includes("TECHNICIAN")) return "Govt Job";
  if (t.includes("SCIENTIST")) return "Govt Job";
  if (t.includes("INTERN") || t.includes("FELLOWSHIP")) return "Fellowship";
  return "JRF";
}

function inferLocation(title: string): string {
  const locations: Record<string, string> = {
    "IITR": "Lucknow", "IICB": "Kolkata", "NPL": "Delhi",
    "IMCB": "Chandigarh", "IICT": "Hyderabad", "CEERI": "Pilani",
    "NAL": "Bengaluru", "NEERI": "Nagpur", "NIIST": "Thiruvananthapuram",
    "CDRI": "Lucknow", "CIMAP": "Lucknow", "IGIB": "Delhi",
    "IHBT": "Palampur", "IMMT": "Bhubaneswar", "CLRI": "Chennai",
    "CECRI": "Karaikudi", "CGCRI": "Kolkata", "CMERI": "Durgapur",
    "Mumbai": "Mumbai", "Lucknow": "Lucknow", "Kolkata": "Kolkata",
    "Delhi": "Delhi", "Chandigarh": "Chandigarh",
  };
  for (const [key, city] of Object.entries(locations)) {
    if (title.includes(key)) return city;
  }
  return "India";
}

function inferTags(title: string): string[] {
  const tags: string[] = ["CSIR", "research"];
  const t = title.toLowerCase();
  if (t.includes("electron") || t.includes("electrical")) tags.push("electronics");
  if (t.includes("engineer")) tags.push("engineering");
  if (t.includes("jrf") || t.includes("junior research")) tags.push("JRF");
  if (t.includes("technician")) tags.push("technical");
  if (t.includes("scientist")) tags.push("science");
  if (t.includes("intern")) tags.push("internship");
  if (t.includes("walk") || t.includes("interview")) tags.push("walk-in");
  if (t.includes("project")) tags.push("project");
  return Array.from(new Set(tags));
}

export async function scrapeCSIR(): Promise<ScrapedOpportunity[]> {
  const opportunities: ScrapedOpportunity[] = [];

  try {
    const origTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    let res;
    try {
      res = await fetch(CSIR_URL, {
        signal: AbortSignal.timeout(15000),
        headers: { "User-Agent": "Mozilla/5.0 (BerojgarDegreeWala/1.0)" },
      });
    } finally {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = origTls;
    }
    if (!res.ok) {
      console.error(`CSIR scraper: HTTP ${res.status}`);
      return [];
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    // CSIR Drupal table: find rows in the views table
    $("table tbody tr, .views-table tbody tr, .view-content table tbody tr").each((_, row) => {
      if (opportunities.length >= 20) return;

      const cells = $(row).find("td");
      if (cells.length < 3) return;

      // Title is in second column, deadline in third column
      const titleEl = $(cells[1] || cells[0]);
      const title = titleEl.text().trim();
      if (!title || title.length < 10) return;
      if (title === "Title" || title.includes("Sl No")) return;

      const linkEl = titleEl.find("a").first();
      const href = linkEl.attr("href") || "";

      if (RESULT_PATTERNS.some((p) => p.test(title))) return;  // skip result notices

      let deadline: string | null = null;
      if (cells.length >= 3) {
        deadline = $(cells[2]).text().trim() || null;
      }

      const fullUrl = href
        ? href.startsWith("http")
          ? href
          : `https://www.csir.res.in${href.startsWith("/") ? "" : "/"}${href}`
        : CSIR_URL;

      opportunities.push({
        title,
        organization: "CSIR",
        category: inferCategory(title),
        location: inferLocation(title),
        stipend: null,
        deadline,
        eligibility: null,
        description: null,
        apply_link: fullUrl,
        source_url: fullUrl,  // per-listing URL for dedup
        tags: inferTags(title),
      });
    });
  } catch (error) {
    console.error("Error scraping CSIR:", error);
  }

  return opportunities;
}
