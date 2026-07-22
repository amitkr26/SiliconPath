import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isConfigured } from "@/lib/supabase";
import { scrapeAllOpportunities } from "@/lib/scrapers/opportunity-scraper";
import { normalizeUrl } from "@/lib/scrapers/utils";
import { serverError } from "@berojgardegreewala/api";

export const dynamic = 'force-dynamic';

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

    if (process.env.NODE_ENV === "production" && !cronSecret) {
      return NextResponse.json({ error: "Fail-Secure: Cron Secret is missing." }, { status: 500 });
    }

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { opportunities, results, total } = await scrapeAllOpportunities();

    let inserted = 0;
    let skipped = 0;

    for (const opp of opportunities) {
      const normUrl = opp.source_url ? normalizeUrl(opp.source_url) : null;
      if (!normUrl) {
        skipped++;
        continue;
      }

      const { data: existing } = await supabaseAdmin
        .from("opportunities")
        .select("id")
        .eq("source_url", normUrl)
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
            source_url: normUrl,
            tags: opp.tags,
            verification_status: "verified",
            is_active: true,
          },
        ]);

      if (!error) inserted++;
    }

    return NextResponse.json({
      message: "Opportunity scrape complete",
      results,
      total_fetched: total,
      inserted,
      skipped,
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "digest" in error && (error as any).digest === "DYNAMIC_SERVER_USAGE") throw error;
    console.error("Error scraping opportunities:", error);
    return serverError("Failed to scrape opportunities");
  }
}
