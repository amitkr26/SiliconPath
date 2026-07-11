import * as cheerio from "cheerio";
import type { ScrapedOpportunity } from "./types";

const PSU_SOURCES = [
  {
    name: 'BARC',
    url: 'https://www.barc.gov.in/recruitments/',
    org: 'BARC',
    org_slug: 'barc',
    category: 'Govt Job'
  },
  {
    name: 'BEL',
    url: 'https://bel-india.in/JobOpenings',
    org: 'BEL',
    org_slug: 'bel',
    category: 'Govt Job'
  },
  {
    name: 'ECIL',
    url: 'https://www.ecil.co.in/careers.php',
    org: 'ECIL',
    org_slug: 'ecil',
    category: 'Govt Job'
  },
  {
    name: 'HAL',
    url: 'https://hal-india.co.in/Common/Uploads/Careers/',
    org: 'HAL',
    org_slug: 'hal',
    category: 'Govt Job'
  },
  {
    name: 'NIELIT',
    url: 'https://nielit.gov.in/node/1',
    org: 'NIELIT',
    org_slug: 'nielit',
    category: 'Govt Job'
  },
  {
    name: 'CDAC',
    url: 'https://cdac.in/index.aspx?id=career',
    org: 'C-DAC',
    org_slug: 'cdac',
    category: 'Govt Job'
  },
  {
    name: 'SAMEER',
    url: 'http://www.sameer.gov.in/career.html',
    org: 'SAMEER',
    org_slug: 'sameer',
    category: 'Govt Job'
  },
  {
    name: 'NPL',
    url: 'https://www.nplindia.org/recruitment',
    org: 'CSIR-NPL',
    org_slug: 'csir-npl',
    category: 'JRF'
  },
  {
    name: 'CEERI',
    url: 'https://www.ceeri.res.in/recruitment/',
    org: 'CSIR-CEERI',
    org_slug: 'csir-ceeri',
    category: 'JRF'
  },
  {
    name: 'CSIO',
    url: 'https://www.csio.res.in/index.php/careers',
    org: 'CSIR-CSIO',
    org_slug: 'csir-csio',
    category: 'JRF'
  }
];

const RELEVANT_KEYWORDS = [
  "recruitment", "vacancy", "career", "position", "fellow",
  "jrf", "srf", "scientist", "engineer", "apprentice", "project"
];

function isRelevant(title: string): boolean {
  const t = title.toLowerCase();
  return RELEVANT_KEYWORDS.some(k => t.includes(k));
}

function cleanTitle(title: string): string {
  return title.replace(/\s+/g, " ").trim();
}

async function scrapeSinglePSU(source: typeof PSU_SOURCES[0]): Promise<ScrapedOpportunity[]> {
  const opportunities: ScrapedOpportunity[] = [];
  try {
    const origTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    let res;
    try {
      res = await fetch(source.url, {
        signal: AbortSignal.timeout(10000),
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
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

      // Skip obvious navigation or layout helper texts
      const skipPatterns = /home|contact|sitemap|about|privacy|terms|login|sign in|register|apply now|download|click here|read more|view all|payment gateway|at a glance|departments|reference designs|quick links|useful links|important links|all rights reserved|copyright|disclaimer|help|faq|search|skip to main content|breadcrumb|you are here|news & events|photo gallery|tender|archive|annual report|right to information/i;
      if (text.length <= 15 || skipPatterns.test(text)) return;

      if (isRelevant(text)) {
        let fullLink = href;
        if (href && !href.startsWith("http")) {
          try {
            const urlObj = new URL(source.url);
            fullLink = `${urlObj.origin}${href.startsWith("/") ? "" : "/"}${href}`;
          } catch {
            fullLink = source.url;
          }
        }

        const title = cleanTitle(text);
        const tags = [source.org, "Govt Job", "Electronics"];
        if (title.toLowerCase().includes("jrf")) tags.push("JRF");
        if (title.toLowerCase().includes("project")) tags.push("Project");

        opportunities.push({
          title,
          organization: source.org,
          category: source.category,
          location: "India",
          stipend: null,
          deadline: null,
          eligibility: null,
          description: `Opportunity listed at official ${source.org} portal.`,
          apply_link: fullLink || source.url,
          source_url: fullLink || source.url,
          tags
        });
      }
    });
  } catch (error) {
    console.error(`Error scraping PSU ${source.name}:`, error);
  }
  return opportunities;
}

export async function scrapeIndiaPSU(): Promise<ScrapedOpportunity[]> {
  const all: ScrapedOpportunity[] = [];
  for (const source of PSU_SOURCES) {
    const results = await scrapeSinglePSU(source);
    all.push(...results);
    // 2000ms delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return all;
}
