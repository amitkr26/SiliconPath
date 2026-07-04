import * as cheerio from "cheerio";
import type { ScrapedOpportunity } from "./types";

const SEMICONDUCTOR_COMPANIES = [
  {
    name: 'Texas Instruments India',
    url: 'https://careers.ti.com/search-jobs/?country=India',
    org: 'Texas Instruments',
    org_slug: 'texas-instruments',
    method: 'html'
  },
  {
    name: 'Qualcomm India',
    url: 'https://www.qualcomm.com/company/careers/students?country=India',
    org: 'Qualcomm',
    org_slug: 'qualcomm',
    method: 'html'
  },
  {
    name: 'NXP Semiconductors India',
    url: 'https://nxp.wd3.myworkdayjobs.com/careers?locationCountry=India',
    org: 'NXP Semiconductors',
    org_slug: 'nxp',
    method: 'workday_api',
    workdayConfig: {
      baseUrl: 'https://nxp.wd3.myworkdayjobs.com',
      tenant: 'nxp',
      site: 'careers'
    }
  },
  {
    name: 'Infineon India',
    url: 'https://www.infineon.com/cms/en/careers/jobs/?country=India',
    org: 'Infineon Technologies',
    org_slug: 'infineon',
    method: 'html'
  },
  {
    name: 'STMicroelectronics India',
    url: 'https://www.st.com/content/st_com/en/about/careers/st-jobs.html',
    org: 'STMicroelectronics',
    org_slug: 'stmicro',
    method: 'html'
  },
  {
    name: 'Synopsys India',
    url: 'https://careers.synopsys.com/search?q=&location=India',
    org: 'Synopsys',
    org_slug: 'synopsys',
    method: 'html'
  },
  {
    name: 'Cadence India',
    url: 'https://cadence.wd1.myworkdayjobs.com/External_Careers?locationCountry=India',
    org: 'Cadence Design Systems',
    org_slug: 'cadence',
    method: 'workday_api',
    workdayConfig: {
      baseUrl: 'https://cadence.wd1.myworkdayjobs.com',
      tenant: 'cadence',
      site: 'External_Careers'
    }
  },
  {
    name: 'Microchip Technology India',
    url: 'https://careers.microchip.com/us/en/search-results?keywords=&location=India',
    org: 'Microchip Technology',
    org_slug: 'microchip',
    method: 'html'
  },
  {
    name: 'Renesas India',
    url: 'https://jobs.renesas.com/en/search-results?location=India',
    org: 'Renesas Electronics',
    org_slug: 'renesas',
    method: 'html'
  },
  {
    name: 'onsemi India',
    url: 'https://www.onsemi.com/company/careers?country=India',
    org: 'onsemi',
    org_slug: 'onsemi',
    method: 'html'
  }
];

async function scrapeWorkdayJobs(company: typeof SEMICONDUCTOR_COMPANIES[0]): Promise<ScrapedOpportunity[]> {
  const opportunities: ScrapedOpportunity[] = [];
  const cfg = company.workdayConfig;
  if (!cfg) return [];

  try {
    const url = `${cfg.baseUrl}/wday/cxs/${cfg.tenant}/${cfg.site}/jobs`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; SiliconPathBot/1.0; +https://siliconpath.vercel.app/bot)'
      },
      body: JSON.stringify({
        limit: 20,
        offset: 0,
        searchText: 'electronics semiconductor VLSI embedded hardware'
      })
    });

    if (!response.ok) return [];
    const data = await response.json();
    const postings = data.jobPostings || [];

    for (const p of postings) {
      opportunities.push({
        title: p.title,
        organization: company.org,
        category: 'Private Job',
        location: p.primaryLocation?.descriptor || p.location || 'India',
        stipend: null,
        deadline: null,
        eligibility: null,
        description: `Position available at official ${company.org} career portal. Requisition ID: ${p.jobRequisitionId}`,
        apply_link: p.externalApplyUrl ? `${cfg.baseUrl}${p.externalApplyUrl}` : company.url,
        source_url: company.url,
        tags: [company.org, 'Semiconductor', 'Private Job']
      });
    }
  } catch (error) {
    console.error(`Error fetching Workday for ${company.name}:`, error);
  }
  return opportunities;
}

async function scrapeHtmlCompany(company: typeof SEMICONDUCTOR_COMPANIES[0]): Promise<ScrapedOpportunity[]> {
  const opportunities: ScrapedOpportunity[] = [];
  try {
    const res = await fetch(company.url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SiliconPathBot/1.0; +https://siliconpath.vercel.app/bot)"
      }
    });

    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);

    // Look for matching elements containing career keywords
    $("a").each((_, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr("href") || "";

      if (text.length > 15 && (
        text.toLowerCase().includes("design") ||
        text.toLowerCase().includes("hardware") ||
        text.toLowerCase().includes("engineer") ||
        text.toLowerCase().includes("intern") ||
        text.toLowerCase().includes("vlsi") ||
        text.toLowerCase().includes("semiconductor")
      )) {
        let fullLink = href;
        if (href && !href.startsWith("http")) {
          try {
            const urlObj = new URL(company.url);
            fullLink = `${urlObj.origin}${href.startsWith("/") ? "" : "/"}${href}`;
          } catch {
            fullLink = company.url;
          }
        }

        opportunities.push({
          title: text.replace(/\s+/g, " ").trim(),
          organization: company.org,
          category: 'Private Job',
          location: 'India',
          stipend: null,
          deadline: null,
          eligibility: null,
          description: `Career opportunity at ${company.org}.`,
          apply_link: fullLink || company.url,
          source_url: company.url,
          tags: [company.org, 'Private Job', 'Semiconductor']
        });
      }
    });
  } catch (error) {
    console.error(`Error scraping HTML for ${company.name}:`, error);
  }
  return opportunities;
}

export async function scrapeGlobalSemiconductor(): Promise<ScrapedOpportunity[]> {
  const all: ScrapedOpportunity[] = [];
  for (const company of SEMICONDUCTOR_COMPANIES) {
    let results: ScrapedOpportunity[] = [];
    if (company.method === 'workday_api') {
      results = await scrapeWorkdayJobs(company);
    } else {
      results = await scrapeHtmlCompany(company);
    }
    all.push(...results);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return all;
}
