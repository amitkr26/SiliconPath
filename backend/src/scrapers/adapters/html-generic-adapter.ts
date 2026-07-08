import { ScrapedOpportunity, SourceConfig } from "../types.js";
import { logger } from "../../lib/logger.js";
import * as cheerio from "cheerio";
import * as https from "https";

const DEADLINE_PATTERNS = /deadline|last date|closing on|apply by|closes/i;
const STIPEND_PATTERNS = /stipend|salary|fellowship|emoluments|pay|remuneration/i;
const ELIGIBILITY_PATTERNS = /eligibility|qualification|required|b\.e|b\.tech|m\.e|m\.tech|ph\.d|m\.sc/i;

function createAgentWithCert(): https.Agent {
  return new https.Agent({ keepAlive: true });
}

export async function scrapeHTML(source: SourceConfig): Promise<ScrapedOpportunity[]> {
  const results: ScrapedOpportunity[] = [];
  logger.info(`[HTML] Starting ${source.name} at ${source.url}`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(source.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SiliconPath/1.0; +https://siliconpath.vercel.app)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-IN,en-GB;q=0.9,en;q=0.8",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      logger.warn(`[HTML] ${source.name}: HTTP ${res.status}`);
      return results;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const rows: string[][] = [];

    $("table tr").each((_, tr) => {
      const cols: string[] = [];
      $(tr).find("td, th").each((_, td) => {
        cols.push($(td).text().trim());
      });
      if (cols.some((c) => c.length > 5)) rows.push(cols);
    });

    if (rows.length === 0) {
      // Fallback: look for list items or paragraphs with common keywords
      $("li, p, div.item, div.posting").each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 30 && /vacancy|recruitment|fellowship|phd|jrf|srf|intern/i.test(text)) {
          rows.push([text.slice(0, 200)]);
        }
      });
    }

    const seen = new Set<string>();
    for (const row of rows) {
      const rowText = row.join(" | ");
      const title = row[0] || rowText.slice(0, 100);
      if (seen.has(title) || title.length < 5) continue;
      seen.add(title);

      const deadline = row.find((c) => DEADLINE_PATTERNS.test(c))
        || (rowText.match(/deadline[:\s]*([^\n]+)/i)?.[1]?.trim() ?? null);
      const stipend = row.find((c) => STIPEND_PATTERNS.test(c))
        || (rowText.match(/stipend[:\s]*([^\n]+)/i)?.[1]?.trim() ?? null);
      const eligibility = row.find((c) => ELIGIBILITY_PATTERNS.test(c))
        || (rowText.match(/eligibility[:\s]*([^\n]+)/i)?.[1]?.trim() ?? null);

      results.push({
        title,
        organization: source.name,
        category: source.category,
        location: null,
        stipend,
        deadline,
        eligibility,
        description: rowText.slice(0, 3000),
        apply_link: null,
        source_url: source.url,
        tags: [source.category],
      });
    }

    logger.info(`[HTML] ${source.name}: extracted ${results.length} entries from ${rows.length} rows`);
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      logger.warn(`[HTML] ${source.name}: request timed out`);
    } else {
      logger.error(`[HTML] ${source.name} error:`, e instanceof Error ? e.message : e);
    }
  }

  return results;
}

export function createTlsAgentForSource(url: string): https.Agent {
  return createAgentWithCert();
}
