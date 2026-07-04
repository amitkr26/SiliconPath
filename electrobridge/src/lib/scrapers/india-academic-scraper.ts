import * as cheerio from "cheerio";
import type { ScrapedOpportunity } from "./types";

const ACADEMIC_SOURCES = [
  {
    name: 'IIT Delhi Jobs',
    url: 'https://home.iitd.ac.in/jobs-iitd.php',
    org: 'IIT Delhi', org_slug: 'iit-delhi'
  },
  {
    name: 'IIT Bombay Jobs',
    url: 'https://www.ircc.iitb.ac.in/IRCC-Webpage/rnd/HRMSLoginPage.jsp',
    org: 'IIT Bombay', org_slug: 'iit-bombay'
  },
  {
    name: 'IIT Madras Jobs',
    url: 'https://icsr.iitm.ac.in/jobs.html',
    org: 'IIT Madras', org_slug: 'iit-madras'
  },
  {
    name: 'IISc Jobs',
    url: 'https://iisc.ac.in/jobs/',
    org: 'IISc', org_slug: 'iisc'
  },
  {
    name: 'TIFR Jobs',
    url: 'https://www.tifr.res.in/TSN/article/Jobs-at-TIFR',
    org: 'TIFR', org_slug: 'tifr'
  },
  {
    name: 'IIT Kharagpur Jobs',
    url: 'http://www.iitkgp.ac.in/fac-emp',
    org: 'IIT Kharagpur', org_slug: 'iit-kharagpur'
  },
  {
    name: 'IIT Kanpur Jobs',
    url: 'https://www.iitk.ac.in/new/jobs',
    org: 'IIT Kanpur', org_slug: 'iit-kanpur'
  },
  {
    name: 'IIT Roorkee Jobs',
    url: 'https://www.iitr.ac.in/campus/pages/jobs-at-iit-roorkee.html',
    org: 'IIT Roorkee', org_slug: 'iit-roorkee'
  },
  {
    name: 'IISER Pune Jobs',
    url: 'https://www.iiserpune.ac.in/opportunities/1/Jobs',
    org: 'IISER Pune', org_slug: 'iiser-pune'
  },
  {
    name: 'NIT Warangal Jobs',
    url: 'https://www.nitw.ac.in/page/?url=/main/Recruitments/',
    org: 'NIT Warangal', org_slug: 'nit-warangal'
  }
];

function detectCategory(title: string): string | null {
  const t = title.toUpperCase();
  if (t.includes("FACULTY") || t.includes("PROFESSOR") || t.includes("LECTURER")) {
    return null; // Skip faculty listings as they are not student/fellow positions
  }
  if (t.includes("JRF") || t.includes("JUNIOR RESEARCH")) return "JRF";
  if (t.includes("SRF") || t.includes("SENIOR RESEARCH")) return "SRF";
  if (t.includes("PHD") || t.includes("DOCTORAL")) return "PhD";
  if (t.includes("POSTDOC") || t.includes("POST-DOCTORAL") || t.includes("POST DOCTORAL")) return "Postdoc";
  if (t.includes("PROJECT") || t.includes("ASSOCIATE")) return "Research Associate";
  return "JRF"; // Default fallback
}

function cleanTitle(title: string): string {
  return title.replace(/\s+/g, " ").trim();
}

async function scrapeSingleAcademic(source: typeof ACADEMIC_SOURCES[0]): Promise<ScrapedOpportunity[]> {
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

      if (text.length > 10) {
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
            source_url: source.url,
            tags: [source.org, category, "Research"]
          });
        }
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
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return all;
}
