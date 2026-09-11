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
        tags: item.tags || ["Semiconductor", "VLSI"],
        is_active: true,
      }))
      .filter((r: any) => r.url); // url is NOT NULL + UNIQUE — skip rows with no URL

    const { data, error } = await supabaseAdmin
      .from("news_articles")
      .upsert(recordsToInsert, { onConflict: "url", ignoreDuplicates: true })
      .select("id");

    if (error) {
      console.error("News sync upsert error:", error);
      return apiError(error, "news-sync-upsert", 500);
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
