import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
import { mapNewsArticleToClient } from "@/lib/utils";
import { fetchAllNews } from "@/lib/scrapers/rss-parser";

export const dynamic = "force-dynamic";

let cachedLiveRss: any[] = [];
let lastSyncTime = 0;
const CACHE_TTL_MS = 30 * 60 * 1000;

// (removed 2026-08-11: JULY_2026_MAJOR_UPDATES was a hand-written, fabricated article list served as public content — see CONTENT_UPGRADE_PLAN.md P0)


async function syncRssFeedsWithTimeout(): Promise<any[]> {
  const now = Date.now();
  if (cachedLiveRss.length > 0 && now - lastSyncTime < CACHE_TTL_MS) {
    return cachedLiveRss;
  }

  try {
    const liveRssPromise = fetchAllNews();
    const timeoutPromise = new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 1000));
    
    const liveRss = await Promise.race([liveRssPromise, timeoutPromise]);
    if (liveRss && liveRss.length > 0) {
      cachedLiveRss = liveRss.map((a: any, i: number) => ({
        id: `rss-auto-${i}-${Date.now()}`,
        title: a.title,
        slug: a.title ? a.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : `rss-${i}`,
        source: a.source || "Industry Source",
        source_url: a.source_url || a.link || "https://semiengineering.com/",
        published_at: a.published_at || a.pubDate || new Date().toISOString(),
        summary: a.summary || a.contentSnippet || a.title,
        tags: a.tags || ["Semiconductor", "Industry"],
      }));
      lastSyncTime = now;
    }
  } catch (err) {
    console.error("Auto RSS sync error:", err);
  }

  return cachedLiveRss;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");

    let articles: any[] = [];

    if (isAdminConfigured && supabaseAdmin) {
      try {
        let query = supabaseAdmin
          .from("news_articles")
          .select("*")
          .order("published_at", { ascending: false })
          .limit(limit);

        if (search) {
          const cleanSearch = search.replace(/[{}()"\\,.]/g, "").slice(0, 100);
          query = query.or(`title.ilike.%${cleanSearch}%,summary.ilike.%${cleanSearch}%`);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          articles = data.map(mapNewsArticleToClient);
        }
      } catch (err) {
        console.error("Supabase news query error:", err);
      }
    }

    const liveRssArticles = await syncRssFeedsWithTimeout();

    const mapByTitle = new Map<string, any>();
    
    liveRssArticles.forEach(a => {
      const key = a.title?.toLowerCase().trim();
      if (key && !mapByTitle.has(key)) {
        mapByTitle.set(key, a);
      }
    });

    articles.forEach(a => {
      const key = a.title?.toLowerCase().trim();
      if (key && !mapByTitle.has(key)) {
        mapByTitle.set(key, a);
      }
    });

    let combinedArticles = Array.from(mapByTitle.values());

    combinedArticles.sort((a, b) => {
      const timeA = a.published_at ? new Date(a.published_at).getTime() : 0;
      const timeB = b.published_at ? new Date(b.published_at).getTime() : 0;
      return timeB - timeA;
    });

    if (tag && tag.toLowerCase() !== "all") {
      const lowerTag = tag.toLowerCase();
      combinedArticles = combinedArticles.filter((a: any) => {
        const tArr = Array.isArray(a.tags) ? a.tags : [];
        return (
          tArr.some((t: string) => t.toLowerCase() === lowerTag) ||
          (a.title && a.title.toLowerCase().includes(lowerTag)) ||
          (a.summary && a.summary.toLowerCase().includes(lowerTag))
        );
      });
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      combinedArticles = combinedArticles.filter((a: any) =>
        a.title?.toLowerCase().includes(lowerSearch) ||
        a.summary?.toLowerCase().includes(lowerSearch) ||
        a.source?.toLowerCase().includes(lowerSearch)
      );
    }

    return NextResponse.json({
      articles: combinedArticles.slice(0, limit),
      count: combinedArticles.length,
      last_synced: new Date(lastSyncTime || Date.now()).toISOString(),
    });
  } catch (err: any) {
    console.error("API /api/news error:", err);
    return NextResponse.json({
      articles: [],
      count: 0,
    });
  }
}
