import * as https from "https";
import * as http from "http";
import { ScrapedOpportunity, SourceConfig } from "../types.js";
import { logger } from "../../lib/logger.js";

const NAV_SELECTORS = [
  "nav", "header", "footer", ".nav", ".navbar", ".header", ".footer",
  "#nav", "#navbar", "#header", "#footer", ".menu", ".sidebar",
  ".breadcrumb", "[role=navigation]", "[role=banner]", "[role=contentinfo]",
];
const LINK_PATTERNS = /career|job|open(?:ing|position)|vacanc|hiring|recruit|apply|position|internship|fellow|opportunit/gi;
const EXCLUDE_PATTERNS = /@|mailto:|tel:|#|javascript:/i;

export async function scrapeHtml(source: SourceConfig): Promise<ScrapedOpportunity[]> {
  const results: ScrapedOpportunity[] = [];
  logger.info(`[HTML] Starting ${source.name}`);

  let html: string;
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  };

  try {
    // For .gov.in and .ac.in domains, use raw TLS with relaxed cert checking
    const url = new URL(source.url);
    const isGovIn = url.hostname.endsWith(".gov.in") || url.hostname.endsWith(".ac.in") || url.hostname.endsWith(".edu.in");

    if (isGovIn) {
      html = await rawFetch(url.toString(), headers);
    } else {
      const res = await fetch(source.url, { headers, signal: AbortSignal.timeout(20000) });
      if (!res.ok) {
        logger.warn(`[HTML] ${source.name}: HTTP ${res.status}`);
        return results;
      }
      html = await res.text();
    }
  } catch (e) {
    logger.warn(`[HTML] ${source.name}: fetch failed - ${e instanceof Error ? e.message : e}`);
    return results;
  }

  if (!html || html.length < 100) {
    logger.warn(`[HTML] ${source.name}: response too short (${html?.length ?? 0} chars)`);
    return results;
  }

  const { load } = await import("cheerio");
  const $ = load(html);

  // Strip navigation, header, footer elements
  NAV_SELECTORS.forEach((sel) => {
    try { $(sel).remove(); } catch { /* ignore bad selector */ }
  });

  // Remove script, style, noscript, link, meta
  $("script, style, noscript, svg, iframe, img, meta, link").remove();

  const isCareersPage = /career|job|open|vacanc/i.test($("title").text()) || LINK_PATTERNS.test($.text());

  // Extract from structured listings first
  $("ul li, ol li, tr, .job-listing, .position, .vacancy, .career, .accordion-item, .card, article, .listing-item").each((_, el) => {
    const text = $(el).text().trim();
    if (!isRelevantEntry(text)) return;
    const links = $(el).find("a[href]");
    const link = links.first();
    let href = link.attr("href");
    if (!href || EXCLUDE_PATTERNS.test(href)) return;
    href = resolveUrl(source.url, href);
    const key = text.slice(0, 100);
    if ([...results.map((r) => r.title.slice(0, 100))].includes(key)) return;
    results.push(makeOpportunity(text, href, source, ""));
  });

  // If few results, try extracting from all links
  if (results.length < 5) {
    const visited = new Set<string>();
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href || EXCLUDE_PATTERNS.test(href)) return;
      const text = $(el).text().trim();
      if (!text || !LINK_PATTERNS.test(text)) return;
      const resolved = resolveUrl(source.url, href);
      if (visited.has(resolved)) return;
      visited.add(resolved);
      const key = text.slice(0, 100);
      if ([...results.map((r) => r.title.slice(0, 100))].includes(key)) return;
      results.push(makeOpportunity(text, resolved, source, ""));
    });
  }

  logger.info(`[HTML] ${source.name}: ${results.length} entries extracted`);
  return results;
}

function isRelevantEntry(text: string): boolean {
  if (text.length < 15 || text.length > 3000) return false;
  return LINK_PATTERNS.test(text);
}

function makeOpportunity(text: string, href: string, source: SourceConfig, description: string): ScrapedOpportunity {
  return {
    title: text.slice(0, 300),
    organization: source.name,
    category: source.category,
    location: null,
    stipend: null,
    deadline: null,
    eligibility: null,
    description: description || text.slice(0, 3000),
    apply_link: href,
    source_url: source.url,
    tags: [source.category],
  };
}

function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return base;
  }
}

// Fallback for sites with broken TLS (gov.in, ac.in, edu.in)
function rawFetch(url: string, headers: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === "https:" ? https : http;
    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: "GET",
      headers,
      rejectUnauthorized: false,
      timeout: 20000,
    };
    const req = mod.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
    req.end();
  });
}
