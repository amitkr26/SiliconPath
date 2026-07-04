import * as cheerio from "cheerio";
import type { ScrapedOpportunity } from "./types";
import Parser from "rss-parser";

const INTERNATIONAL_SOURCES = [
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
  },
  {
    name: 'EURAXESS',
    url: 'https://euraxess.ec.europa.eu/jobs/search/field_research_profile/first-stage-researcher-r1-445?discipline=electrical-engineering',
    type: 'html',
    category: 'Postdoc',
    org: 'EURAXESS'
  },
  {
    name: 'TU Delft Jobs',
    url: 'https://www.tudelft.nl/en/about-tu-delft/working-at-tu-delft/vacancies',
    type: 'html',
    org: 'TU Delft',
    category: 'PhD'
  },
  {
    name: 'TU Munich Jobs',
    url: 'https://www.tum.de/en/about-tum/jobs-at-tum/',
    type: 'html',
    org: 'TU Munich',
    category: 'PhD'
  },
  {
    name: 'ETH Zurich Jobs',
    url: 'https://jobs.ethz.ch/',
    type: 'html',
    org: 'ETH Zurich',
    category: 'PhD'
  },
  {
    name: 'NUS Singapore Jobs',
    url: 'https://careers.nus.edu.sg/NUS/search/?q=semiconductor+VLSI',
    type: 'html',
    org: 'NUS Singapore',
    category: 'PhD'
  }
];

async function scrapeRssSource(source: typeof INTERNATIONAL_SOURCES[0]): Promise<ScrapedOpportunity[]> {
  const opportunities: ScrapedOpportunity[] = [];
  try {
    const parser = new Parser({
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SiliconPathBot/1.0)" }
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
        "User-Agent": "Mozilla/5.0 (compatible; SiliconPathBot/1.0; +https://siliconpath.vercel.app/bot)"
      }
    });

    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);

    $("a").each((_, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr("href") || "";

      if (text.length > 15 && (
        text.toLowerCase().includes("phd") ||
        text.toLowerCase().includes("research") ||
        text.toLowerCase().includes("postdoc") ||
        text.toLowerCase().includes("vacancy") ||
        text.toLowerCase().includes("position")
      )) {
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
          source_url: source.url,
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
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return all;
}
