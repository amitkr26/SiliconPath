import * as cheerio from "cheerio";
import type { ScrapedOpportunity } from "./types";
import companies from "@/config/scrapers/companies.json";

interface CompanyConfig {
  name: string;
  url: string;
  method: "workday_api" | "greenhouse_api" | "html";
  org_slug?: string;
  company_type?: string;
  country?: string;
  workdayConfig?: { baseUrl: string; tenant: string; site: string };
  greenhouseConfig?: { boardToken: string };
}

async function scrapeWorkdayJobs(company: CompanyConfig): Promise<ScrapedOpportunity[]> {
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
        organization: company.name,
        category: 'Private Job',
        location: p.primaryLocation?.descriptor || p.location || 'India',
        stipend: null,
        deadline: null,
        eligibility: null,
        description: `Position available at official ${company.name} career portal. Requisition ID: ${p.jobRequisitionId}`,
        apply_link: p.externalApplyUrl ? `${cfg.baseUrl}${p.externalApplyUrl}` : company.url,
        source_url: company.url,
        tags: [company.name, 'Semiconductor', 'Private Job']
      });
    }
  } catch (error) {
    console.error(`Error fetching Workday for ${company.name}:`, error);
  }
  return opportunities;
}

async function scrapeGreenhouseJobs(company: CompanyConfig): Promise<ScrapedOpportunity[]> {
  const opportunities: ScrapedOpportunity[] = [];
  const cfg = company.greenhouseConfig;
  if (!cfg) return [];

  try {
    const url = `https://boards-api.greenhouse.io/v1/boards/${cfg.boardToken}/jobs?content=true&render_as=html`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) return [];
    const data = await response.json();
    const jobs = data.jobs || [];

    for (const job of jobs) {
      // Filter for semiconductor/VLSI relevant roles
      const titleLower = job.title.toLowerCase();
      if (
        titleLower.includes("design") ||
        titleLower.includes("hardware") ||
        titleLower.includes("engineer") ||
        titleLower.includes("intern") ||
        titleLower.includes("vlsi") ||
        titleLower.includes("semiconductor") ||
        titleLower.includes("analog") ||
        titleLower.includes("rtl") ||
        titleLower.includes("verification")
      ) {
        opportunities.push({
          title: job.title,
          organization: company.name,
          category: 'Private Job',
          location: job.location?.name || 'Global',
          stipend: null,
          deadline: null,
          eligibility: null,
          description: job.content || `Position available at ${company.name} Greenhouse board.`,
          apply_link: job.absolute_url || company.url,
          source_url: job.absolute_url || company.url,
          tags: [company.name, 'Semiconductor', 'Private Job']
        });
      }
    }
  } catch (error) {
    console.error(`Error fetching Greenhouse for ${company.name}:`, error);
  }
  return opportunities;
}

async function scrapeHtmlCompany(company: CompanyConfig): Promise<ScrapedOpportunity[]> {
  const opportunities: ScrapedOpportunity[] = [];
  try {
    const res = await fetch(company.url, {
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
        text.toLowerCase().includes("design") ||
        text.toLowerCase().includes("hardware") ||
        text.toLowerCase().includes("engineer") ||
        text.toLowerCase().includes("intern") ||
        text.toLowerCase().includes("vlsi") ||
        text.toLowerCase().includes("semiconductor") ||
        text.toLowerCase().includes("analog") ||
        text.toLowerCase().includes("rtl") ||
        text.toLowerCase().includes("verification")
      ) {
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
          organization: company.name,
          category: 'Private Job',
          location: 'India',
          stipend: null,
          deadline: null,
          eligibility: null,
          description: `Career opportunity at ${company.name}.`,
          apply_link: fullLink || company.url,
          source_url: fullLink || company.url,
          tags: [company.name, 'Private Job', 'Semiconductor']
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
  
  // We only run a subset of active/prominent companies in a single run to prevent server timeout
  // but allow full coverage across multiple cron sweeps
  const activeCompanies = (companies as CompanyConfig[]).filter(c => c.method === 'workday_api' || c.method === 'greenhouse_api' || Math.random() < 0.2);
  
  for (const company of activeCompanies) {
    let results: ScrapedOpportunity[] = [];
    if (company.method === 'workday_api') {
      results = await scrapeWorkdayJobs(company);
    } else if (company.method === 'greenhouse_api') {
      results = await scrapeGreenhouseJobs(company);
    } else {
      results = await scrapeHtmlCompany(company);
    }
    all.push(...results);
    // Be gentle to company servers
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  return all;
}
