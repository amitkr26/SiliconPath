import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isConfigured } from "@/lib/supabase";
import { scrapeGlobalSemiconductor } from "@/lib/scrapers/global-semiconductor-scraper";
import { scrapeInternationalAcademic } from "@/lib/scrapers/international-academic-scraper";
import { scrapeFellowships } from "@/lib/scrapers/fellowship-scraper";
import { cleanTitle, normalizeUrl } from "@/lib/scrapers/utils";

export async function GET(request: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await Promise.allSettled([
      scrapeGlobalSemiconductor(),
      scrapeInternationalAcademic(),
      scrapeFellowships()
    ]);

    const allOpportunities = [];
    const sourceStats = [];

    const names = ["GlobalSemiconductor", "InternationalAcademic", "Fellowships"];
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

      const { error } = await supabaseAdmin
        .from("opportunities")
        .insert([{
          title: cTitle,
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

    return NextResponse.json({
      message: "Global opportunities scrape complete",
      stats: sourceStats,
      total_fetched: allOpportunities.length,
      inserted,
      skipped
    });
  } catch (error: any) {
    console.error("Global scrape error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
