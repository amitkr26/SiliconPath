import Parser from "rss-parser";
import type { ScrapedOpportunity, ScrapeResult } from "./types";

function inferCategory(title: string): string {
  const t = title.toUpperCase();
  if (t.includes("PHD") || t.includes("DOCTORAL") || t.includes("FELLOWSHIP")) return "Fellowship";
  if (t.includes("POSTDOC") || t.includes("POST-DOC") || t.includes("POST DOC")) return "PostDoc";
  if (t.includes("JRF") || t.includes("JUNIOR RESEARCH")) return "JRF";
  if (t.includes("SRF") || t.includes("SENIOR RESEARCH")) return "SRF";
  if (t.includes("RESEARCHER") || t.includes("RESEARCH ASSOCIATE")) return "SRF";
  if (t.includes("SCIENTIST") || t.includes("ENGINEER")) return "Govt Job";
  if (t.includes("INTERN") || t.includes("INTERNSHIP")) return "Fellowship";
  return "JRF";
}

function inferDeadline(description: string): string | null {
  const patterns = [
    /closing\s*date[:\s]*(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i,
    /deadline[:\s]*(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i,
    /apply\s*by[:\s]*(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i,
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i,
  ];
  for (const p of patterns) {
    const m = description.match(p);
    if (m) return m[1];
  }
  return null;
}

function inferLocation(title: string, description: string): string | null {
  const combined = `${title} ${description}`;
  const cities = [
    "Bengaluru", "Bangalore", "Delhi", "Hyderabad", "Chennai",
    "Kolkata", "Mumbai", "Pune", "Chandigarh", "Lucknow",
    "India", "Singapore", "Germany", "UK", "USA", "Europe",
    "Netherlands", "France", "Switzerland", "Japan",
  ];
  for (const city of cities) {
    if (combined.includes(city)) return city;
  }
  return "International";
}

function inferTags(title: string, description: string, baseTags: string[]): string[] {
  const tags = [...baseTags];
  const combined = `${title} ${description}`.toLowerCase();
  if (combined.includes("electron")) tags.push("electronics");
  if (combined.includes("engineer")) tags.push("engineering");
  if (combined.includes("research")) tags.push("research");
  if (combined.includes("phd") || combined.includes("doctor")) tags.push("PhD");
  if (combined.includes("thin film") || combined.includes("thin-film")) tags.push("thin film");
  if (combined.includes("semiconductor")) tags.push("semiconductor");
  if (combined.includes("material")) tags.push("materials");
  if (combined.includes("physics") || combined.includes("physic")) tags.push("physics");
  if (combined.includes("jrf") || combined.includes("junior research")) tags.push("JRF");
  if (combined.includes("postdoc")) tags.push("postdoc");
  return Array.from(new Set(tags));
}

async function scrapeCSIR_RSS(): Promise<ScrapedOpportunity[]> {
  const results: ScrapedOpportunity[] = [];
  try {
    const parser = new Parser({
      timeout: 8000,
      headers: { "User-Agent": "Mozilla/5.0 (ElectroBridge/1.0)" },
    });
    const feed = await parser.parseURL("https://www.csir.res.in/en/rss.xml");
    for (const item of feed.items) {
      const title = item.title?.trim();
      if (!title || title.length < 10) continue;

      const skipPatterns = [
        /what is the/i, /can the following/i, /are there/i, /do committee/i,
        /are separate/i, /name and other/i, /assessment/i, /selection commi/i,
        /criteria/i, /basis of awarding/i, /mode of assessment/i,
        /rab|research assessment board/i,
      ];
      if (skipPatterns.some((p) => p.test(title))) continue;

      const link = item.link?.trim() || "";

      results.push({
        title,
        organization: "CSIR",
        category: inferCategory(title),
        location: "India",
        stipend: null,
        deadline: null,
        eligibility: null,
        description: item.contentSnippet?.substring(0, 300) || null,
        apply_link: link || "https://www.csir.res.in/en/career-opportunities",
        source_url: link || "https://www.csir.res.in/en/rss.xml",
        tags: inferTags(title, item.contentSnippet || "", ["CSIR", "research"]),
      });
    }
  } catch (error) {
    console.error("CSIR RSS scraper failed:", error);
  }
  return results;
}

export async function scrapeGovtJobs(): Promise<{
  opportunities: ScrapedOpportunity[];
  results: ScrapeResult[];
  total: number;
}> {
  const sources: { name: string; scraper: () => Promise<ScrapedOpportunity[]> }[] = [
    { name: "CSIR RSS", scraper: scrapeCSIR_RSS },
  ];

  const allResults: ScrapeResult[] = [];
  const allOpportunities: ScrapedOpportunity[] = [];

  for (const source of sources) {
    try {
      const data = await source.scraper();
      allOpportunities.push(...data);
      allResults.push({
        source: source.name,
        success: true,
        count: data.length,
      });
      console.log(`${source.name}: ${data.length} opportunities scraped`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`${source.name} scraper failed:`, msg);
      allResults.push({
        source: source.name,
        success: false,
        count: 0,
        error: msg,
      });
    }
  }

  return {
    opportunities: allOpportunities,
    results: allResults,
    total: allOpportunities.length,
  };
}
