import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isConfigured } from "@/lib/supabase";
import { fetchAllNews } from "@/lib/scrapers/rss-parser";
import { isElectronicsNews, autoTagArticle } from "@/lib/scrapers/news-filter";
import { normalizeUrl, slugify } from "@/lib/scrapers/utils";

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
    const articles = await fetchAllNews();
    let newsInserted = 0;
    let newsSkipped = 0;

    for (const article of articles) {
      if (!isElectronicsNews(article.title, article.summary, 1)) {
        newsSkipped++;
        continue;
      }

      if (!article.source_url) {
        newsSkipped++;
        continue;
      }

      const normalizedUrl = normalizeUrl(article.source_url);
      const { data: existingUrl } = await supabaseAdmin
        .from("news_articles")
        .select("id")
        .or(`source_url.eq."${article.source_url.replace(/"/g, '""')}",source_url.eq."${normalizedUrl.replace(/"/g, '""')}"`)
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

      let slug = slugify(article.title);
      if (!slug) slug = `news-${Date.now()}`;

      const { error } = await supabaseAdmin
        .from("news_articles")
        .insert([{
          title: article.title,
          slug,
          summary: article.summary,
          source: article.source,
          source_url: normalizedUrl,
          published_at: article.published_at,
          image_url: article.image_url,
          tags,
        }]);

      if (!error) newsInserted++;
      else newsSkipped++;
    }

    return NextResponse.json({
      message: "News scrape complete",
      total_fetched: articles.length,
      inserted: newsInserted,
      skipped: newsSkipped,
    });
  } catch (error: any) {
    console.error("News scrape error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
