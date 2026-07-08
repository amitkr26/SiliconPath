import type { ScrapedOpportunity, SourceConfig } from "../types.js";

/**
 * Workday CxS adapter. Workday tenants expose a JSON jobs endpoint at
 * <tenant-host>/wday/cxs/<tenant>/<site>/jobs. We derive it from the careers URL.
 * Returns [] gracefully if the tenant shape can't be resolved (logged by caller).
 */
export async function scrapeWorkday(source: SourceConfig): Promise<ScrapedOpportunity[]> {
  const u = new URL(source.url);
  const parts = u.pathname.split("/").filter(Boolean);
  const tenant = u.host.split(".")[0];
  const site = parts[parts.length - 1] || parts[0];
  if (!tenant || !site) return [];

  const endpoint = `${u.protocol}//${u.host}/wday/cxs/${tenant}/${site}/jobs`;
  const out: ScrapedOpportunity[] = [];
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ appliedFacets: {}, limit: 20, offset: 0, searchText: "" }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return out;
  const data = (await res.json()) as { jobPostings?: Array<{ title?: string; externalPath?: string; locationsText?: string }> };
  for (const j of data.jobPostings ?? []) {
    if (!j.title) continue;
    out.push({
      title: j.title,
      organization: source.name,
      category: source.category,
      location: j.locationsText ?? null,
      stipend: null,
      deadline: null,
      eligibility: null,
      description: null,
      apply_link: j.externalPath ? `${u.protocol}//${u.host}${j.externalPath}` : null,
      source_url: source.url,
      tags: [source.category],
    });
  }
  return out;
}
