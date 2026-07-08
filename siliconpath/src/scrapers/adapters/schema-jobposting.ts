import * as cheerio from "cheerio";
import type { ScrapedOpportunity, SourceConfig } from "../types.js";

const USER_AGENT = "Mozilla/5.0 (compatible; SiliconPath/1.0; +https://siliconpath.vercel.app)";

/**
 * schema.org JobPosting extractor — first-choice for company/university career
 * pages, since it's what sites deliberately expose for Google Jobs. Reads
 * ld+json blocks and pulls JobPosting entities.
 */
export async function scrapeSchemaJobPostings(source: SourceConfig): Promise<ScrapedOpportunity[]> {
  const res = await fetch(source.url, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return [];
  const $ = cheerio.load(await res.text());
  const out: ScrapedOpportunity[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse($(el).contents().text());
    } catch {
      return;
    }
    const nodes = Array.isArray(parsed) ? parsed : [parsed];
    for (const node of nodes as Array<Record<string, unknown>>) {
      if (!node || node["@type"] !== "JobPosting") continue;
      const org = (node.hiringOrganization as { name?: string })?.name ?? source.name;
      const loc =
        ((node.jobLocation as { address?: { addressLocality?: string } })?.address?.addressLocality) ?? null;
      out.push({
        title: String(node.title ?? "").trim(),
        organization: String(org),
        category: source.category,
        location: loc,
        stipend: node.baseSalary ? String((node.baseSalary as { value?: unknown }).value ?? "") || null : null,
        deadline: node.validThrough ? String(node.validThrough) : null,
        eligibility: null,
        description: node.description ? String(node.description).replace(/<[^>]+>/g, "").slice(0, 3000) : null,
        apply_link: node.url ? String(node.url) : source.url,
        source_url: source.url,
        tags: [source.category],
      });
    }
  });
  return out.filter((o) => o.title.length > 3);
}
