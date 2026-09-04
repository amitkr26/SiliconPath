import { NextRequest } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
import { fetchAllNews } from "@/lib/scrapers/rss-parser";
import { runOpportunityScrape } from "@/lib/scrapers/run-opportunity-scrape";
import { slugify, normalizeUrl } from "@/lib/scrapers/utils";
import { isElectronicsNews, autoTagArticle } from "@/lib/scrapers/news-filter";
import { requireAdmin, serverError } from "@berojgardegreewala/api";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isAdminConfigured) {
    return new Response(
      JSON.stringify({ error: "Database not configured." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Admin access not configured." }), { status: 503, headers: { "Content-Type": "application/json" } });
    }

    try { await requireAdmin(request); }
    catch (e) { return e instanceof Response ? e : serverError(); }

    const mode = request.nextUrl.searchParams.get("mode") || "all";

    const result: Record<string, any> = {};

    if (mode === "news" || mode === "all") {
      const articles = await fetchAllNews();
      let newsInserted = 0;
      let newsSkipped = 0;

      for (const article of articles) {
        if (!isElectronicsNews(article.title, article.summary, 1)) {
          newsSkipped++;
          continue;
        }

        if (!article.url) {
          newsSkipped++;
          continue;
        }

        const normalizedUrl = normalizeUrl(article.url);
        // Check for existing by URL (live schema: column is `url`, not `source_url`)
        const { data: existingUrl } = await supabaseAdmin
          .from("news_articles")
          .select("id")
          .or(`url.eq.${JSON.stringify(article.url)},url.eq.${JSON.stringify(normalizedUrl)}`)
          .maybeSingle();

        const { data: existingTitle } = await supabaseAdmin
          .from("news_articles")
          .select("id")
          .ilike("title", article.title.trim())
          .maybeSingle();

        if (existingUrl || existingTitle) {
          newsSkipped++;
          continue;
        }

        const tags = article.tags.length > 0
          ? article.tags
          : autoTagArticle(article.title, article.summary || "");

        // Live schema: news_articles uses url/source_name/slug
        const { error: newsError } = await supabaseAdmin
          .from("news_articles")
          .insert([{
            title: article.title,
            slug: slugify(article.title) || `news-${Date.now()}`,
            url: normalizedUrl,            // live column: url (UNIQUE, NOT NULL)
            source_name: article.source_name,   // live column: source_name (NOT NULL)
            summary: article.summary,
            published_at: article.published_at,
            image_url: article.image_url,
            tags,
          }]);

        if (!newsError) newsInserted++;
        else { console.error("news_articles insert error:", newsError.message); newsSkipped++; }
      }

      result.news = {
        total_fetched: articles.length,
        inserted: newsInserted,
        skipped: newsSkipped,
      };
    }

    if (mode === "opportunities" || mode === "all") {
      result.opportunities = await runOpportunityScrape();
    }

    return new Response(JSON.stringify({
      message: `Scrape complete (${mode})`,
      ...result,
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in scrape endpoint:", error);
    return new Response(
      JSON.stringify({ error: "Failed to scrape" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
