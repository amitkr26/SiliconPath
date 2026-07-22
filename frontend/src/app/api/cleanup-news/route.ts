import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { slugify, normalizeUrl } from "@/lib/scrapers/utils";
import { serverError } from "@berojgardegreewala/api";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === "production" && !cronSecret) {
    return NextResponse.json({ error: "Fail-Secure: Cron Secret is missing." }, { status: 500 });
  }

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results: Record<string, any> = {};

    // Fetch all news ordered by created_at (oldest first)
    const { data: allNews, error: fetchError } = await supabaseAdmin
      .from("news_articles")
      .select("id, source_url, title, created_at")
      .order("created_at", { ascending: true });

    if (fetchError) throw fetchError;
    if (!allNews || allNews.length === 0) {
      return NextResponse.json({ success: true, message: "No articles found", total: 0 });
    }

    results.total = allNews.length;

    // Group by dedup key (normalized source_url if present, otherwise normalized title)
    const seen = new Map<string, string>(); // key → first (keep) id
    const toDelete: string[] = [];

    for (const article of allNews) {
      let key = "";
      if (article.source_url) {
        key = `url:${normalizeUrl(article.source_url)}`;
      } else if (article.title) {
        key = `title:${article.title.trim().toLowerCase()}`;
      }
      if (!key) continue;

      if (!seen.has(key)) {
        seen.set(key, article.id);
      } else {
        toDelete.push(article.id);
      }
    }

    results.duplicates_found = toDelete.length;

    // Delete duplicates in batches
    if (toDelete.length > 0) {
      for (let i = 0; i < toDelete.length; i += 50) {
        const batch = toDelete.slice(i, i + 50);
        const { error: delError } = await supabaseAdmin
          .from("news_articles")
          .delete()
          .in("id", batch);
        if (delError) console.error("Delete batch error:", delError);
      }
      results.deleted = toDelete.length;
    }

    // Generate slugs for articles without one
    const { data: noSlugArticles } = await supabaseAdmin
      .from("news_articles")
      .select("id, title, source_url")
      .is("slug", null);

    let slugged = 0;
    if (noSlugArticles && noSlugArticles.length > 0) {
      for (const article of noSlugArticles) {
        let slug = slugify(article.title);
        if (!slug) slug = `article-${article.id.slice(0, 8)}`;

        const { error: upError } = await supabaseAdmin
          .from("news_articles")
          .update({ slug })
          .eq("id", article.id);

        if (!upError) slugged++;
      }
    }
    results.slugs_generated = slugged;

    return NextResponse.json({
      success: true,
      message: `Cleanup complete: ${results.deleted || 0} duplicates removed, ${slugged} slugs generated`,
      ...results,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return serverError(error instanceof Error ? error.message : "Cleanup failed");
  }
}
