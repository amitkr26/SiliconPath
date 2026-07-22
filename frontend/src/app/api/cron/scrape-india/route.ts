import { NextRequest } from "next/server";
import { supabaseAdmin, isConfigured } from "@/lib/supabase";
import { scrapeISRO } from "@/lib/scrapers/isro-scraper";
import { scrapeDRDO } from "@/lib/scrapers/drdo-scraper";
import { scrapeCSIR } from "@/lib/scrapers/csir-scraper";
import { scrapeIndiaPSU } from "@/lib/scrapers/india-psu-scraper";
import { scrapeIndiaAcademic } from "@/lib/scrapers/india-academic-scraper";
import { cleanTitle, normalizeUrl, slugify } from "@/lib/scrapers/utils";
import { requireCron, serverError } from "@berojgardegreewala/api";

export async function GET(request: NextRequest) {
  if (!isConfigured) {
    return new Response(JSON.stringify({ error: "Database not configured." }), { status: 503, headers: { "Content-Type": "application/json" } });
  }

  try { await requireCron(request); }
  catch (e) { return e instanceof Response ? e : serverError(); }

  try {
    const results = await Promise.allSettled([
      scrapeISRO(),
      scrapeDRDO(),
      scrapeCSIR(),
      scrapeIndiaPSU(),
      scrapeIndiaAcademic()
    ]);

    const allOpportunities = [];
    const sourceStats = [];

    const names = ["ISRO", "DRDO", "CSIR", "IndiaPSU", "IndiaAcademic"];
    for (let i = 0; i < results.length; i++) {
      const name = names[i];
      const r = results[i];
      if (r.status === 'fulfilled') {
        allOpportunities.push(...r.value);
        sourceStats.push({ source: name, success: true, count: r.value.length });
      } else {
        sourceStats.push({ source: name, success: false, error: String(r.reason) });
      }
    }

    let inserted = 0;
    let skipped = 0;

    for (const opp of allOpportunities) {
      if (!opp.source_url) {
        skipped++;
        continue;
      }
      const cTitle = cleanTitle(opp.title, opp.organization);
      const normUrl = normalizeUrl(opp.source_url);

      const { data: existing } = await supabaseAdmin
        .from("opportunities")
        .select("id")
        .or(`source_url.eq."${opp.source_url.replace(/"/g, '""')}",source_url.eq."${normUrl.replace(/"/g, '""')}"`)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      let oppSlug = slugify(cTitle);
      if (!oppSlug) oppSlug = `opportunity-${Date.now()}`;
      const { data: existingSlug } = await supabaseAdmin
        .from("opportunities")
        .select("id")
        .eq("slug", oppSlug)
        .maybeSingle();
      if (existingSlug) oppSlug = `${oppSlug}-${Date.now()}`;

      const { error } = await supabaseAdmin
        .from("opportunities")
        .insert([{
          title: cTitle,
          slug: oppSlug,
          organization: opp.organization,
          category: opp.category,
          location: opp.location,
          stipend: opp.stipend,
          deadline: opp.deadline,
          eligibility: opp.eligibility,
          description: opp.description,
          apply_link: opp.apply_link,
          source_url: normUrl,
          tags: opp.tags,
          verification_status: "verified",
          is_active: true,
        }]);

      if (!error) inserted++;
      else skipped++;
    }

    return new Response(JSON.stringify({
      message: "India opportunities scrape complete",
      stats: sourceStats,
      total_fetched: allOpportunities.length,
      inserted,
      skipped
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("India scrape error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
