import * as cheerio from "cheerio";
import type { ScrapedOpportunity } from "./types";

const FELLOWSHIP_SOURCES = [
  {
    name: 'DAAD Scholarships',
    url: 'https://www.daad.de/en/studying-in-germany/scholarships/daad-scholarships/',
    org: 'DAAD Germany',
    org_slug: 'daad',
    category: 'Fellowship',
    location_type: 'International'
  },
  {
    name: 'MEXT Japan Scholarship',
    url: 'https://www.studyinjapan.go.jp/en/planning/scholarship/',
    org: 'MEXT Japan',
    org_slug: 'mext',
    category: 'Fellowship',
    location_type: 'International'
  },
  {
    name: 'SINGA Fellowship',
    url: 'https://www.a-star.edu.sg/Scholarships/for-graduate-studies/singapore-international-graduate-award-singa',
    org: 'SINGA Singapore',
    org_slug: 'singa',
    category: 'Fellowship',
    location_type: 'International'
  },
  {
    name: 'DST-SERB Fellowships',
    url: 'https://serb.gov.in/programs.php',
    org: 'DST-SERB',
    org_slug: 'dst-serb',
    category: 'Fellowship',
    location_type: 'India'
  },
  {
    name: 'CSIR Fellowship Programmes',
    url: 'https://csirhrdg.res.in/Home/Index/1/Default/1742/59',
    org: 'CSIR HRDG',
    org_slug: 'csir-hrdg',
    category: 'Fellowship',
    location_type: 'India'
  },
  {
    name: 'DBT Fellowships',
    url: 'https://dbtindia.gov.in/schemes-programmes/research-development/human-resource-development',
    org: 'DBT India',
    org_slug: 'dbt',
    category: 'Fellowship',
    location_type: 'India'
  },
  {
    name: 'Summer Research Fellowship',
    url: 'https://www.ias.ac.in/Fellowship/Summer_Research_Fellowship/',
    org: 'IAS/INSA/NASI',
    org_slug: 'ias-insa-nasi',
    category: 'Internship',
    location_type: 'India'
  }
];

async function scrapeSingleFellowship(source: typeof FELLOWSHIP_SOURCES[0]): Promise<ScrapedOpportunity[]> {
  const opportunities: ScrapedOpportunity[] = [];
  try {
    const res = await fetch(source.url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BerojgarDegreeWalaBot/1.0; +https://berojgardegreewala.vercel.app/bot)"
      }
    });

    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);

    $("a").each((_, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr("href") || "";

      if (text.length > 15 && (
        text.toLowerCase().includes("fellowship") ||
        text.toLowerCase().includes("scholarship") ||
        text.toLowerCase().includes("award") ||
        text.toLowerCase().includes("scheme") ||
        text.toLowerCase().includes("program")
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
          location: source.location_type,
          stipend: null,
          deadline: null,
          eligibility: null,
          description: `Research fellowship scheme details listed on the official portal.`,
          apply_link: fullLink || source.url,
          source_url: fullLink || source.url,
          tags: [source.org, source.category, source.location_type, "Funding"]
        });
      }
    });
  } catch (error) {
    console.error(`Error scraping fellowship portal ${source.name}:`, error);
  }
  return opportunities;
}

export async function scrapeFellowships(): Promise<ScrapedOpportunity[]> {
  const all: ScrapedOpportunity[] = [];
  for (const source of FELLOWSHIP_SOURCES) {
    const results = await scrapeSingleFellowship(source);
    all.push(...results);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return all;
}
