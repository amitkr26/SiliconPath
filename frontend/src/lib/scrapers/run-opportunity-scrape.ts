import { supabaseAdmin } from "@/lib/supabase-admin";
import { fetchOpportunitiesFromRSS } from "@/lib/scrapers/rss-parser";
import { scrapeAllOpportunities } from "@/lib/scrapers/opportunity-scraper-impl";
import { cleanTitle, slugify, normalizeUrl, GARBAGE_TITLE_PATTERNS } from "@/lib/scrapers/utils";
import { enrichOpportunity } from "@/lib/scrapers/deep-scraper";
import { resolveOrganization } from "@/lib/organizations/resolve";
import { isRelevantToPlatform } from "@/lib/scrapers/relevance";

export interface OpportunityScrapeResult {
  sources: unknown[];
  total_fetched: number;
  inserted: number;
  skipped: number;
  rss_sources: number;
  enriched: number;
  enriched_pending: number;
}

/**
 * P0.3: evidence-gated org resolution shared by every insert path.
 * Returns the matching organizations.id, or null when no evidence passes the
 * resolver's person-name guard. Only creates an org row when the resolved name
 * is backed by domain/title evidence (confidence !== "none") — bare person-name
 * strings never reach the create branch. Live schema: opportunities.organization_id uuid FK.
 */
export async function resolveOrganizationId(
  opp: { apply_link?: string | null; source_url?: string | null; title?: string | null; organization?: string | null; tags?: string[] | null },
  orgList: { id: string; name: string; slug: string | null; website: string | null }[]
): Promise<string | null> {
  const resolved = resolveOrganization({
    sourceUrl: opp.apply_link || opp.source_url,
    title: opp.title,
    name: opp.organization,
    organizations: orgList,
  });
  if (resolved.organizationId) return resolved.organizationId;
  if (!resolved.name || resolved.confidence === "none") return null;
  const orgSlug = slugify(resolved.name) || resolved.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, 80);
  const orgType = opp.tags?.includes("government") || ["ISRO","DRDO","CSIR"].includes(resolved.name)
    ? "government"
    : opp.tags?.includes("academic") || resolved.name.includes("IIT") || resolved.name.includes("NIT")
    ? "academic"
    : "private";
  const { data: newOrg } = await supabaseAdmin
    .from("organizations")
    .insert([{ name: resolved.name, slug: orgSlug, type: orgType }])
    .select("id")
    .single();
  return newOrg?.id ?? null;
}

/**
 * Shared opportunity-scraping pipeline (route -> service layer, mandate §36).
 * Used by /api/cron/scrape-opportunities (Vercel cron, P0.1) and /api/scrape (admin).
 * Real engine only — fabricated scrapers never flow through here.
 *
 * P0.2: newly scraped records are inserted as `unverified`; the verification
 * pipeline (link check + source validation) is the only path to `verified`.
 * Never fabricate verification evidence.
 */
export async function runOpportunityScrape(): Promise<OpportunityScrapeResult> {
  const { opportunities: scrapedOpps, results: scrapeResults, total } = await scrapeAllOpportunities();
  const rssOpps = await fetchOpportunitiesFromRSS();
  const allOpportunities = [...scrapedOpps, ...rssOpps];
  // P0.3: org table loaded once per run; resolution is evidence-gated
  // (domain/token/name/title match, person-name guard) — never blind creation.
  const { data: orgRows } = await supabaseAdmin
    .from("organizations")
    .select("id, name, slug, website");
  const orgList = orgRows ?? [];
  let oppInserted = 0;
  let oppSkipped = 0;
  const newOppIds: { id: string; source_url: string; title: string; organization: string }[] = [];

  for (const opp of allOpportunities) {
    if (!opp.source_url) {
      oppSkipped++;
      continue;
    }
    const cleanedTitle = cleanTitle(opp.title, opp.organization);
    const normalizedUrl = normalizeUrl(opp.source_url);

    // Filter out obvious navigation or non-job garbage titles
    if (
      cleanedTitle.length < 10 ||
      GARBAGE_TITLE_PATTERNS.test(cleanedTitle) ||
      GARBAGE_TITLE_PATTERNS.test(opp.title)
    ) {
      oppSkipped++;
      continue;
    }

    // ROLE-LEVEL RELEVANCE GATE (P0.2): skip opportunities that are clearly
    // irrelevant to the platform's electronics/semiconductor/research domain.
    // This is a safety layer — scrapers should also filter, but this catches
    // any that slip through (e.g. generic PSU HR/admin vacancies).
    if (!isRelevantToPlatform(opp.title, opp.description, opp.organization, opp.tags)) {
      oppSkipped++;
      continue;
    }

    const { data: existingUrlRows } = await supabaseAdmin
      .from("opportunities")
      .select("id")
      .in("source_url", [opp.source_url, normalizedUrl].filter(Boolean))
      .limit(1);
    const existingUrl = existingUrlRows?.[0];

    const { data: existingTitle } = await supabaseAdmin
      .from("opportunities")
      .select("id")
      .ilike("title", cleanedTitle)
      .maybeSingle();

    if (existingUrl || existingTitle) {
      oppSkipped++;
      continue;
    }

    // P0.3: evidence-gated org resolution (shared helper — same rules for every insert path)
    const orgId = await resolveOrganizationId(opp, orgList);

    // Normalize category to live CHECK constraint values (all lowercase)
    const CAT_MAP: Record<string, string> = {
      "jrf": "jrf", "JRF": "jrf",
      "srf": "srf", "SRF": "srf",
      "phd": "phd", "PhD": "phd", "PHD": "phd",
      "postdoc": "postdoc", "PostDoc": "postdoc", "Research Associate": "postdoc",
      "fellowship": "fellowship", "Fellowship": "fellowship", "Research Fellow": "fellowship",
      "internship": "internship", "Internship": "internship",
      "government": "government", "Govt Job": "government", "govt job": "government",
      "industry": "industry", "Tech Job": "industry", "tech job": "industry",
      "Electronics": "industry", "electronics": "industry",
      "Engineering": "industry", "engineering": "industry",
      "Private Job": "industry", "private job": "industry"
    };
    const normalizedCategory = CAT_MAP[opp.category] ?? CAT_MAP[opp.category?.toLowerCase() ?? ""] ?? "government";

    // Generate slug from title (required NOT NULL UNIQUE in live schema)
    let oppSlug = slugify(cleanedTitle);
    if (!oppSlug) oppSlug = `opportunity-${Date.now()}`;
    // Ensure uniqueness by appending timestamp if slug already exists
    const { data: existingSlug } = await supabaseAdmin
      .from("opportunities")
      .select("id")
      .eq("slug", oppSlug)
      .maybeSingle();
    if (existingSlug) oppSlug = `${oppSlug}-${Date.now()}`;

    // Build deadline: live schema expects date type (YYYY-MM-DD) or null
    let deadlineDate: string | null = null;
    if (opp.deadline) {
      // Try to parse common formats: DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD
      const dd = opp.deadline.match(/(\d{2})[.\/](\d{2})[.\/](\d{4})/);
      if (dd) deadlineDate = `${dd[3]}-${dd[2]}-${dd[1]}`;
      else if (/^\d{4}-\d{2}-\d{2}$/.test(opp.deadline)) deadlineDate = opp.deadline;
    }

    // Live schema: apply_url (NOT NULL), salary_range, organization_id — NO apply_link, NO stipend, NO organization (text)
    const { data: oppData, error: oppError } = await supabaseAdmin
      .from("opportunities")
      .insert([
        {
          title: cleanedTitle,
          slug: oppSlug,
          organization_id: orgId,
          category: normalizedCategory,
          location: opp.location,
          salary_range: opp.stipend,     // renamed: stipend → salary_range
          deadline: deadlineDate,
          eligibility: opp.eligibility,
          description: opp.description,
          apply_url: opp.apply_link || normalizedUrl,  // renamed: apply_link → apply_url
          source_url: normalizedUrl,
          tags: opp.tags,
          verification_status: "pending", // FIX #16: "unverified" violates live CHECK constraint (only pending/verified/rejected/expired/link_unavailable are valid); the verification pipeline should move pending → verified
          is_active: true,
          source_type: "scraped",
        },
      ])
      .select("id, source_url, title")
      .single();

    if (!oppError && oppData) {
      oppInserted++;
      newOppIds.push({ id: oppData.id, source_url: oppData.source_url, title: oppData.title, organization: opp.organization });
    } else {
      if (oppError) console.error("opportunities insert error:", oppError.message);
      oppSkipped++;
    }
  }

  // Deep scrape — enrich newly inserted opportunities with full detail page data
  let enrichedCount = 0;
  if (newOppIds.length > 0) {
    const batchSize = 5;
    for (const item of newOppIds.slice(0, batchSize)) {
      const original = allOpportunities.find((o) => o.source_url === item.source_url);
      if (!original) continue;

      try {
        const enriched = await enrichOpportunity(original, item.id);
        // Only update columns that exist in live schema; removed apply_link_type and official_page_url (don't exist)
        if (enriched.description || enriched.eligibility || enriched.stipend) {
          await supabaseAdmin
            .from("opportunities")
            .update({
              description: enriched.description,
              eligibility: enriched.eligibility,
              salary_range: enriched.stipend,    // stipend → salary_range
              deadline: enriched.deadline,
              location: enriched.location,
              tags: enriched.tags,
            })
            .eq("id", item.id);
          enrichedCount++;
        }
      } catch {
        // skip — detail page fetching failed, keep listing data
      }
    }
  }

  return {
    sources: scrapeResults,
    total_fetched: allOpportunities.length,
    inserted: oppInserted,
    skipped: oppSkipped,
    rss_sources: rssOpps.length,
    enriched: enrichedCount,
    enriched_pending: Math.max(0, oppInserted - enrichedCount),
  };
}
