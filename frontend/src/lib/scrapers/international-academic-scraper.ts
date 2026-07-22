import * as cheerio from "cheerio";
import type { ScrapedOpportunity } from "./types";
import Parser from "rss-parser";
import institutions from "@/config/scrapers/institutions.json";

// RSS and static external feeds
const STATIC_INTERNATIONAL_SOURCES = [
  {
    name: 'Academic Positions RSS',
    url: 'https://academicpositions.com/rss/jobs?discipline=electrical-electronic-engineering',
    type: 'rss',
    category: 'PhD',
    org: 'Academic Positions'
  },
  {
    name: 'Jobs.ac.uk Electronics RSS',
    url: 'https://www.jobs.ac.uk/feed/rss/?q=electronics+semiconductor',
    type: 'rss',
    category: 'PhD',
    org: 'Jobs.ac.uk'
  }
];

// Combine static feeds with dynamic international institutions from JSON
const INTERNATIONAL_SOURCES = [
  ...STATIC_INTERNATIONAL_SOURCES,
  ...institutions
    .filter(inst => inst.country !== "India")
    .map(inst => ({
      name: inst.name,
      url: inst.url,
      type: 'html',
      category: 'PhD' as const,
      org: inst.org
    }))
];

async function scrapeRssSource(source: typeof INTERNATIONAL_SOURCES[0]): Promise<ScrapedOpportunity[]> {
  const opportunities: ScrapedOpportunity[] = [];
  try {
    const parser = new Parser({
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
    });
    const feed = await parser.parseURL(source.url);

    for (const item of feed.items) {
      opportunities.push({
        title: item.title || "Academic Research Position",
        organization: item.creator || item.publisher || source.org,
        category: source.category,
        location: "International",
        stipend: null,
        deadline: null,
        eligibility: null,
        description: item.contentSnippet || item.content || `Academic opportunity listed on ${source.org}.`,
        apply_link: item.link || source.url,
        source_url: source.url,
        tags: ["International", "Academic", source.category]
      });
    }
  } catch (error) {
    console.error(`Error scraping RSS ${source.name}:`, error);
  }
  return opportunities;
}

async function scrapeHtmlAcademic(source: typeof INTERNATIONAL_SOURCES[0]): Promise<ScrapedOpportunity[]> {
  const opportunities: ScrapedOpportunity[] = [];
  try {
    const res = await fetch(source.url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove headers, footers, sidebars, and navigation areas to prevent false positives
    $("header, footer, nav, .header, .footer, #header, #footer, .nav, #nav, .sidebar, #sidebar, .menu, #menu").remove();

    $("a").each((_, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr("href") || "";

      // Skip obvious navigation or layout helper texts
      const skipPatterns = /home|contact|sitemap|about|privacy|terms|login|sign in|register|apply now|download|click here|read more|view all|payment gateway|at a glance|departments|reference designs|quick links|useful links|important links|all rights reserved|copyright|disclaimer|help|faq|search|skip to main content|breadcrumb|you are here|news & events|photo gallery|tender|archive|annual report|right to information/i;
      if (text.length <= 15 || skipPatterns.test(text)) return;

      if (
        text.toLowerCase().includes("phd") ||
        text.toLowerCase().includes("research") ||
        text.toLowerCase().includes("postdoc") ||
        text.toLowerCase().includes("vacancy") ||
        text.toLowerCase().includes("position") ||
        text.toLowerCase().includes("fellow") ||
        text.toLowerCase().includes("ph.d")
      ) {
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
          title: text.replace(/\s+/g, " ").trim(),
          organization: source.org,
          category: source.category,
          location: "International",
          stipend: null,
          deadline: null,
          eligibility: null,
          description: `Research position available at ${source.org} careers portal.`,
          apply_link: fullLink || source.url,
          source_url: fullLink || source.url,
          tags: ["International", "Academic", source.category, source.org]
        });
      }
    });
  } catch (error) {
    console.error(`Error scraping HTML ${source.name}:`, error);
  }
  return opportunities;
}

export async function scrapeInternationalAcademic(): Promise<ScrapedOpportunity[]> {
  const all: ScrapedOpportunity[] = [];
  for (const source of INTERNATIONAL_SOURCES) {
    let results: ScrapedOpportunity[] = [];
    if (source.type === 'rss') {
      results = await scrapeRssSource(source);
    } else {
      results = await scrapeHtmlAcademic(source);
    }
    all.push(...results);
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  return all;
}
