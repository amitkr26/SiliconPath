import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { fetchAllNews } from "@/lib/scrapers/rss-parser";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const liveRss = await fetchAllNews();
    let insertedCount = 0;

    if (isAdminConfigured && supabaseAdmin && liveRss.length > 0) {
      const recordsToInsert = liveRss.map((item: any) => ({
        title: item.title,
        slug: item.title ? item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) : `rss-${Date.now()}`,
        source: item.source || "Industry Source",
        source_url: item.source_url || item.link || "https://semiengineering.com/",
        published_at: item.published_at || item.pubDate || new Date().toISOString(),
        summary: item.summary || item.contentSnippet || item.title,
        tags: item.tags || ["Semiconductor", "VLSI"],
        is_active: true,
      }));

      const { data, error } = await supabaseAdmin
        .from("news_articles")
        .upsert(recordsToInsert, { onConflict: "title", ignoreDuplicates: true })
        .select("id");

      if (!error && data) {
        insertedCount = data.length;
      }
    }

    return NextResponse.json({
      success: true,
      scraped_count: liveRss.length,
      inserted_count: insertedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("News sync error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
