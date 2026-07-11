import * as cheerio from "cheerio";
import type { ScrapedOpportunity } from "./types";
import institutions from "@/config/scrapers/institutions.json";

// Filter for Indian academic institutions
const ACADEMIC_SOURCES = institutions.filter(inst => inst.country === "India" && inst.type !== "Research Lab");

function detectCategory(title: string): string | null {
  const t = title.toUpperCase();
  if (t.includes("FACULTY") || t.includes("PROFESSOR") || t.includes("LECTURER")) {
    return null; // Skip faculty listings as they are not student/fellow positions
  }
  if (t.includes("JRF") || t.includes("JUNIOR RESEARCH")) return "JRF";
  if (t.includes("SRF") || t.includes("SENIOR RESEARCH")) return "SRF";
  if (t.includes("PHD") || t.includes("DOCTORAL")) return "PhD";
  if (t.includes("POSTDOC") || t.includes("POST-DOCTORAL") || t.includes("POST DOCTORAL")) return "Postdoc";
  if (t.includes("PROJECT") || t.includes("ASSOCIATE") || t.includes("SCIENTIST")) return "Research Associate";
  
  // No fallback to prevent false positives for every link on the page
  return null;
}

function cleanTitle(title: string): string {
  return title.replace(/\s+/g, " ").trim();
}

async function scrapeSingleAcademic(source: any): Promise<ScrapedOpportunity[]> {
  const opportunities: ScrapedOpportunity[] = [];
  try {
    const origTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    let res;
    try {
      res = await fetch(source.url, {
        signal: AbortSignal.timeout(10000),
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
    } finally {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = origTls;
    }

    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove headers, footers, sidebars, and navigation areas to prevent false positives
    $("header, footer, nav, .header, .footer, #header, #footer, .nav, #nav, .sidebar, #sidebar, .menu, #menu").remove();

    $("a").each((_, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr("href") || "";

      // Skip empty, short, or obvious navigation texts
      const skipPatterns = /home|contact|sitemap|about|privacy|terms|login|sign in|register|apply now|download|click here|read more|view all|payment gateway|at a glance|departments|reference designs|quick links|useful links|important links|all rights reserved|copyright|disclaimer|help|faq|search|skip to main content|breadcrumb|you are here|news & events|photo gallery|tender|archive|annual report|right to information/i;
      if (text.length <= 12 || skipPatterns.test(text)) return;
        const category = detectCategory(text);
        if (category) {
          let fullLink = href;
          if (href && !href.startsWith("http")) {
            try {
              const urlObj = new URL(source.url);
              fullLink = `${urlObj.origin}${href.startsWith("/") ? "" : "/"}${href}`;
            } catch {
              fullLink = source.url;
            }
          }

          opportunities.push({
            title: cleanTitle(text),
            organization: source.org,
            category,
            location: "India",
            stipend: null,
            deadline: null,
            eligibility: null,
            description: `Academic position listed at official ${source.org} jobs portal.`,
            apply_link: fullLink || source.url,
            source_url: fullLink || source.url,
            tags: [source.org, category, "Research"]
          });
        }
    });
  } catch (error) {
    console.error(`Error scraping academic portal ${source.name}:`, error);
  }
  return opportunities;
}

export async function scrapeIndiaAcademic(): Promise<ScrapedOpportunity[]> {
  const all: ScrapedOpportunity[] = [];
  for (const source of ACADEMIC_SOURCES) {
    const results = await scrapeSingleAcademic(source);
    all.push(...results);
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  return all;
}
