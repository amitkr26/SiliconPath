import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isConfigured } from "@/lib/supabase";
import { scrapeGovtJobs } from "@/lib/scrapers/govt-scraper";

export async function GET(request: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Admin access not configured." }, { status: 503 });
    }

    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { opportunities, results, total } = await scrapeGovtJobs();

    let inserted = 0;
    let skipped = 0;

    for (const opp of opportunities) {
      const { data: existing } = await supabaseAdmin
        .from("opportunities")
        .select("id")
        .eq("source_url", opp.source_url)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const { error } = await supabaseAdmin
        .from("opportunities")
        .insert([
          {
            title: opp.title,
            organization: opp.organization,
            category: opp.category,
            location: opp.location,
            stipend: opp.stipend,
            deadline: opp.deadline,
            eligibility: opp.eligibility,
            description: opp.description,
            apply_link: opp.apply_link,
            source_url: opp.source_url,
            tags: opp.tags,
            is_active: true,
          },
        ]);

      if (!error) inserted++;
    }

    return NextResponse.json({
      message: "Govt jobs scrape complete",
      deprecation_notice: "This endpoint is deprecated. DRDO is now scraped by the main /api/scrape endpoint. Use /api/scrape?mode=opportunities instead.",
      sources: results,
      total_fetched: total,
      inserted,
      skipped,
    });
  } catch (error) {
    console.error("Error in scrape-jobs endpoint:", error);
    return NextResponse.json(
      { error: "Failed to scrape govt jobs" },
      { status: 500 }
    );
  }
}
