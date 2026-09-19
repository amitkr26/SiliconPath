import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
import { fetchAllNews } from "@/lib/scrapers/rss-parser";
import { requireCron, serverError } from "@berojgardegreewala/api";
import { apiError } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

// QA audit root cause: this route previously inserted `source`/`source_url`
// (columns that do not exist in news_articles — the live schema uses
// `url`/`source_name`) and upserted onConflict "title" (no unique constraint
// on title). Every insert failed silently while the response claimed
// success:true. Now: canonical columns, upsert on the UNIQUE url column,
// slug from title, and honest errors. Cron-protected via requireCron
// (Vercel sends Authorization: Bearer <CRON_SECRET>).
export async function GET(request: NextRequest) {
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try { await requireCron(request); }
  catch (e) { return e instanceof Response ? e : serverError(); }

  try {
    const startedAt = new Date().toISOString();
    const liveRss = await fetchAllNews();

    if (liveRss.length === 0) {
      // Honest result — no fake success, no fake insert count.
      return NextResponse.json({
        success: true,
        scraped_count: 0,
        inserted_count: 0,
        error: null,
        timestamp: new Date().toISOString(),
      });
    }

    const recordsToInsert = liveRss
      .map((item: any) => ({
        title: item.title,
        slug: item.title ? item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) : `rss-${Date.now()}`,
        url: item.url || null,
        source_name: item.source_name || "Industry Source",
        published_at: item.published_at || new Date().toISOString(),
        summary: item.summary || item.title,
        image_url: item.image_url || null,
        tags: item.tags || ["Semiconductor", "VLSI"],
        is_active: true,
      }))
      .filter((r: any) => r.url); // url is NOT NULL + UNIQUE — skip rows with no URL

    const { data, error } = await supabaseAdmin
      .from("news_articles")
      .upsert(recordsToInsert, { onConflict: "url", ignoreDuplicates: false })
      .select("id");

    if (error) {
      console.error("News sync upsert error:", error);
      return apiError(error, "news-sync-upsert", 500);
    }

    // Persist run health (scrape_sources/scrape_runs) so the admin scraper
    // dashboard reflects reality. The standalone worker that writes this
    // contract is NOT scheduled (render.yaml), so the Vercel cron itself must
    // keep the telemetry truthful. Per-source accepted counts come from the
    // fetched articles; sources that produced no rows are skipped (we can't
    // distinguish "feed empty" from "feed failed" without a per-source result
    // contract — leave their consecutive_failures to worker/manual runs).
    const now = new Date().toISOString();
    const acceptedBySource = new Map<string, number>();
    for (const r of recordsToInsert) {
      acceptedBySource.set(r.source_name, (acceptedBySource.get(r.source_name) ?? 0) + 1);
    }
    const sourceNames = Array.from(acceptedBySource.keys());
    if (sourceNames.length > 0) {
      const { data: sources } = await supabaseAdmin
        .from("scrape_sources")
        .select("id, name, total_runs, total_results")
        .in("name", sourceNames);
      for (const src of sources ?? []) {
        const accepted = acceptedBySource.get(src.name) ?? 0;
        try {
          await supabaseAdmin
            .from("scrape_sources")
            .update({
              last_scrape_at: now,
              last_success_at: now,
              consecutive_failures: 0,
              last_error: null,
              total_runs: (src.total_runs ?? 0) + 1,
              total_results: (src.total_results ?? 0) + accepted,
            })
            .eq("id", src.id);
          await supabaseAdmin.from("scrape_runs").insert([
            {
              source_id: src.id,
              status: "success",
              results_count: accepted,
              error: null,
              started_at: startedAt,
              completed_at: now,
            },
          ]);
        } catch (healthErr) {
          console.error("news sync health persistence error:", healthErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      scraped_count: liveRss.length,
      inserted_count: data?.length || 0,
      error: null,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("News sync error:", err);
    return apiError(err, "news-sync");
  }
}
