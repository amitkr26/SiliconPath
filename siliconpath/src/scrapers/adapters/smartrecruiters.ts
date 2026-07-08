import type { ScrapedOpportunity, SourceConfig } from "../types.js";

/** SmartRecruiters public Posting API adapter (official, compliant). */
export async function scrapeSmartRecruiters(source: SourceConfig): Promise<ScrapedOpportunity[]> {
  const res = await fetch(source.url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    content?: Array<{ name?: string; ref?: string; location?: { city?: string; country?: string }; company?: { name?: string } }>;
  };
  const out: ScrapedOpportunity[] = [];
  for (const p of data.content ?? []) {
    if (!p.name) continue;
    const loc = [p.location?.city, p.location?.country].filter(Boolean).join(", ") || null;
    out.push({
      title: p.name,
      organization: source.name,
      category: source.category,
      location: loc,
      stipend: null,
      deadline: null,
      eligibility: null,
      description: null,
      apply_link: p.ref ?? null,
      source_url: source.url,
      tags: [source.category],
    });
  }
  return out;
}
