import { load } from "cheerio";
import { ScrapedOpportunity, SourceConfig } from "../types.js";
import { logger } from "../../lib/logger.js";

type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

function extractJSON(html: string, tag: string): Record<string, JSONValue>[] {
  const results: Record<string, JSONValue>[] = [];
  const regex = new RegExp(`<${tag}[^>]*type="application/ld\\+json"[^>]*>([^<]+)</${tag}>`, "gi");
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) results.push(...parsed);
      else if (typeof parsed === "object" && parsed !== null) results.push(parsed as Record<string, JSONValue>);
    } catch { /* skip invalid JSON */ }
  }
  const relaxed = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "gi");
  while ((match = relaxed.exec(html)) !== null) {
    const txt = match[1].trim();
    if (txt.includes('"@context"') || txt.includes('"JobPosting"')) {
      try {
        const parsed = JSON.parse(txt);
        if (Array.isArray(parsed)) results.push(...parsed);
        else if (typeof parsed === "object" && parsed !== null) results.push(parsed as Record<string, JSONValue>);
      } catch { /* skip */ }
    }
  }
  return results;
}

function str(val: JSONValue | undefined): string {
  if (typeof val === "string") return val;
  return "";
}

function getNested(obj: Record<string, JSONValue>, ...keys: string[]): JSONValue | undefined {
  let cur: JSONValue | undefined = obj;
  for (const key of keys) {
    if (!cur || typeof cur !== "object" || Array.isArray(cur)) return undefined;
    cur = (cur as Record<string, JSONValue>)[key];
  }
  return cur;
}

export async function scrapeSchema(source: SourceConfig): Promise<ScrapedOpportunity[]> {
  const results: ScrapedOpportunity[] = [];
  logger.info(`[Schema.org] Starting ${source.name}`);

  try {
    const res = await fetch(source.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SiliconPath/1.0)", Accept: "text/html" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      logger.warn(`[Schema.org] ${source.name}: HTTP ${res.status}`);
      return results;
    }
    const html = await res.text();
    const schemas = extractJSON(html, "script");

    for (const s of schemas) {
      const ctx = str(s["@context"]);
      const typeRaw = str(s["@type"]);
      const graph = s["@graph"];
      let type = typeRaw;
      let data = s;

      if (Array.isArray(graph) && graph.length > 0 && typeof graph[0] === "object" && graph[0] !== null) {
        const first = graph[0] as Record<string, JSONValue>;
        type = str(first["@type"]);
        data = first;
      }

      if (!type.includes("JobPosting") && !type.includes("Job")) continue;

      const title = str(data["title"] ?? data["name"] ?? "");
      if (!title || title === "undefined") continue;

      let desc = str(data["description"] ?? data["jobDescription"] ?? "");
      if (desc) desc = desc.replace(/<[^>]+>/g, "").trim().slice(0, 8000);

      const jobLoc = data["jobLocation"];
      let location = "";
      if (typeof jobLoc === "object" && jobLoc !== null) {
        const locMap = jobLoc as Record<string, JSONValue>;
        if (str(locMap["@type"]) === "Place") {
          const addr = locMap["address"];
          if (typeof addr === "object" && addr !== null) {
            const addrMap = addr as Record<string, JSONValue>;
            location = str(addrMap["addressLocality"] ?? addrMap["name"] ?? "");
          }
          if (!location) location = str(locMap["name"] ?? "");
        } else {
          location = str(locMap["addressLocality"] ?? locMap["name"] ?? "");
        }
      }

      const salary = data["baseSalary"];
      let stipend: string | null = null;
      if (typeof salary === "object" && salary !== null) {
        const salMap = salary as Record<string, JSONValue>;
        const val = salMap["value"];
        if (typeof val === "number" || typeof val === "string") {
          stipend = `${val} ${str(salMap["currency"])}`.trim();
        }
      }

      const deadline = str(data["validThrough"] ?? data["datePosted"] ?? "");
      const urlField = data["url"];
      const applyLink = str(urlField) || str(data["directApply"] ?? "");

      results.push({
        title,
        organization: source.name,
        category: source.category,
        location: location || null,
        stipend,
        deadline: deadline.length > 4 ? deadline : null,
        eligibility: null,
        description: desc || null,
        apply_link: applyLink || null,
        source_url: source.url,
        tags: [source.category, str(data["employmentType"]), str(data["industry"])].filter(Boolean),
      });
    }
    logger.info(`[Schema.org] ${source.name}: ${results.length} jobs`);
  } catch (e) {
    logger.error(`[Schema.org] ${source.name}:`, e instanceof Error ? e.message : e);
  }
  return results;
}
