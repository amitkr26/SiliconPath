import * as cheerio from "cheerio";
import type { ScrapedOpportunity, SourceConfig } from "../types.js";

const USER_AGENT = "Mozilla/5.0 (compatible; SiliconPath/1.0; +https://siliconpath.vercel.app)";
const DEADLINE = /deadline|last date|closing on|apply by|closes/i;
const STIPEND = /stipend|salary|fellowship|emoluments|pay|remuneration/i;
const ELIGIBILITY = /eligibility|qualification|required|b\.e|b\.tech|m\.e|m\.tech|ph\.d|m\.sc/i;
const KEYWORDS = /vacancy|recruitment|fellowship|phd|jrf|srf|intern|position|scientist|engineer/i;

const LAYOUT =
  "header, footer, nav, aside, script, style, noscript, form, " +
  ".sidebar, .menu, .nav, .navbar, .navigation, .breadcrumb, .breadcrumbs, " +
  ".header, .footer, .site-header, .site-footer, .top-bar, .topbar, " +
  "#header, #footer, #nav, #navbar, #sidebar, #menu";

const MIN_INTERVAL_MS = 3000;
const lastHit: Record<string, number> = {};

async function rateLimit(host: string) {
  const wait = MIN_INTERVAL_MS - (Date.now() - (lastHit[host] ?? 0));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastHit[host] = Date.now();
}

function robotsDisallows(txt: string, path: string, ua: string): boolean {
  const lines = txt.split(/\r?\n/).map((l) => l.replace(/#.*$/, "").trim());
  const uaLower = ua.toLowerCase();
  let applies = false;
  const disallow: string[] = [];
  for (const line of lines) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    const k = line.slice(0, i).trim().toLowerCase();
    const v = line.slice(i + 1).trim();
    if (k === "user-agent") {
      const a = v.toLowerCase();
      applies = a === "*" || uaLower.includes(a) || a.includes("siliconpath");
    } else if (k === "disallow" && applies && v) disallow.push(v);
  }
  return disallow.some((rule) => path.startsWith(rule));
}

async function allowedByRobots(target: string): Promise<boolean> {
  try {
    const u = new URL(target);
    const res = await fetch(`${u.protocol}//${u.host}/robots.txt`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return true;
    return !robotsDisallows(await res.text(), u.pathname, USER_AGENT);
  } catch {
    return true;
  }
}

export async function scrapeHTML(source: SourceConfig): Promise<ScrapedOpportunity[]> {
  const results: ScrapedOpportunity[] = [];
  let host = "";
  try {
    host = new URL(source.url).host;
  } catch {
    return results;
  }
  if (!(await allowedByRobots(source.url))) return results;
  await rateLimit(host);

  const res = await fetch(source.url, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml", "Accept-Language": "en-IN,en;q=0.8" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return results;

  const $ = cheerio.load(await res.text());
  $(LAYOUT).remove();

  const rows: string[][] = [];
  $("table tr").each((_, tr) => {
    const cols: string[] = [];
    $(tr).find("td, th").each((_, td) => cols.push($(td).text().trim()));
    if (cols.some((c) => c.length > 5)) rows.push(cols);
  });
  if (rows.length === 0) {
    $("li, p, div.item, div.posting").each((_, el) => {
      const t = $(el).text().trim();
      if (t.length > 30 && KEYWORDS.test(t)) rows.push([t.slice(0, 200)]);
    });
  }

  const seen = new Set<string>();
  for (const row of rows) {
    const rowText = row.join(" | ");
    const title = row[0] || rowText.slice(0, 100);
    if (seen.has(title) || title.length < 5) continue;
    seen.add(title);
    results.push({
      title,
      organization: source.name,
      category: source.category,
      location: null,
      stipend: row.find((c) => STIPEND.test(c)) || null,
      deadline: row.find((c) => DEADLINE.test(c)) || null,
      eligibility: row.find((c) => ELIGIBILITY.test(c)) || null,
      description: rowText.slice(0, 3000),
      apply_link: null,
      source_url: source.url,
      tags: [source.category],
    });
  }
  return results;
}
