import { ScrapedOpportunity, SourceConfig } from "../types.js";
import { logger } from "../../lib/logger.js";
import * as cheerio from "cheerio";

const DEADLINE_PATTERNS = /deadline|last date|closing on|apply by|closes/i;
const STIPEND_PATTERNS = /stipend|salary|fellowship|emoluments|pay|remuneration/i;
const ELIGIBILITY_PATTERNS = /eligibility|qualification|required|b\.e|b\.tech|m\.e|m\.tech|ph\.d|m\.sc/i;

const USER_AGENT = "Mozilla/5.0 (compatible; SiliconPath/1.0; +https://siliconpath.vercel.app)";

// Layout/navigation containers that produce garbage "job titles" (e.g.
// "Payment Gateway", "Practice School") when row/link-matched. Stripped before
// any extraction so the parser only ever sees content DOM.
const LAYOUT_SELECTOR =
  "header, footer, nav, aside, script, style, noscript, form, " +
  ".sidebar, .side-bar, .menu, .nav, .navbar, .navigation, .breadcrumb, .breadcrumbs, " +
  ".header, .footer, .site-header, .site-footer, .top-bar, .topbar, " +
  "#header, #footer, #nav, #navbar, #sidebar, #menu";

// Best-effort per-host rate limiting. Serverless cold starts reset this map, so
// it is a courtesy floor rather than a hard guarantee.
const MIN_INTERVAL_MS = 3000;
const lastHitByHost: Record<string, number> = {};

async function rateLimit(host: string): Promise<void> {
  const last = lastHitByHost[host] ?? 0;
  const wait = MIN_INTERVAL_MS - (Date.now() - last);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastHitByHost[host] = Date.now();
}

function isDisallowedByRobots(robotsTxt: string, path: string, userAgent: string): boolean {
  const lines = robotsTxt.split(/\r?\n/).map((l) => l.replace(/#.*$/, "").trim());
  const uaLower = userAgent.toLowerCase();
  let applies = false;
  const disallows: string[] = [];

  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (key === "user-agent") {
      const agent = value.toLowerCase();
      applies = agent === "*" || uaLower.includes(agent) || agent.includes("siliconpath");
    } else if (key === "disallow" && applies && value) {
      disallows.push(value);
    }
  }

  return disallows.some((rule) => path.startsWith(rule));
}

async function isAllowedByRobots(targetUrl: string): Promise<boolean> {
  try {
    const u = new URL(targetUrl);
    const robotsUrl = `${u.protocol}//${u.host}/robots.txt`;
    const res = await fetch(robotsUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return true; // no usable robots.txt => allowed
    const txt = await res.text();
    const allowed = !isDisallowedByRobots(txt, u.pathname, USER_AGENT);
    if (!allowed) logger.warn(`[HTML] robots.txt disallows ${u.pathname} on ${u.host}; skipping`);
    return allowed;
  } catch {
    return true; // fail open if robots.txt can't be fetched
  }
}

export async function scrapeHTML(source: SourceConfig): Promise<ScrapedOpportunity[]> {
  const results: ScrapedOpportunity[] = [];
  logger.info(`[HTML] Starting ${source.name} at ${source.url}`);

  let host = "";
  try {
    host = new URL(source.url).host;
  } catch {
    logger.error(`[HTML] ${source.name}: invalid URL ${source.url}`);
    return results;
  }

  // Respect robots.txt and a courtesy rate limit before hitting the source.
  if (!(await isAllowedByRobots(source.url))) return results;
  await rateLimit(host);

  try {
    const res = await fetch(source.url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-IN,en-GB;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      logger.warn(`[HTML] ${source.name}: HTTP ${res.status}`);
      return results;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Strip layout/navigation chrome BEFORE matching to avoid garbage titles.
    $(LAYOUT_SELECTOR).remove();

    const rows: string[][] = [];

    $("table tr").each((_, tr) => {
      const cols: string[] = [];
      $(tr).find("td, th").each((_, td) => {
        cols.push($(td).text().trim());
      });
      if (cols.some((c) => c.length > 5)) rows.push(cols);
    });

    if (rows.length === 0) {
      // Fallback: list items / paragraphs mentioning common opportunity keywords.
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

      const deadline =
        row.find((c) => DEADLINE_PATTERNS.test(c)) ||
        (rowText.match(/deadline[:\s]*([^\n]+)/i)?.[1]?.trim() ?? null);
      const stipend =
        row.find((c) => STIPEND_PATTERNS.test(c)) ||
        (rowText.match(/stipend[:\s]*([^\n]+)/i)?.[1]?.trim() ?? null);
      const eligibility =
        row.find((c) => ELIGIBILITY_PATTERNS.test(c)) ||
        (rowText.match(/eligibility[:\s]*([^\n]+)/i)?.[1]?.trim() ?? null);

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
