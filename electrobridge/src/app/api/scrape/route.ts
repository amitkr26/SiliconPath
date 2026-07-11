import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { fetchAllNews, fetchOpportunitiesFromRSS } from "@/lib/scrapers/rss-parser";
import { scrapeAllOpportunities } from "@/lib/scrapers/opportunity-scraper";
import { cleanTitle, slugify, normalizeUrl } from "@/lib/scrapers/utils";
import { isElectronicsNews, autoTagArticle } from "@/lib/scrapers/news-filter";
import { enrichOpportunity } from "@/lib/scrapers/deep-scraper";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Admin access not configured." }, { status: 503 });
    }

    const cronSecret = process.env.CRON_SECRET;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (process.env.NODE_ENV === "production" && !cronSecret && !adminPassword) {
      return NextResponse.json({ error: "Fail-Secure: Server keys are missing." }, { status: 500 });
    }

    const isValidAuth =
      (cronSecret && request.headers.get("authorization") === `Bearer ${cronSecret}`) ||
      verifyAdmin(request);

    if (!isValidAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

      result.news = {
        total_fetched: articles.length,
        inserted: newsInserted,
        skipped: newsSkipped,
      };
    }

    if (mode === "opportunities" || mode === "all") {
      const { opportunities: scrapedOpps, results: scrapeResults, total } = await scrapeAllOpportunities();
      const rssOpps = await fetchOpportunitiesFromRSS();
      const allOpportunities = [...scrapedOpps, ...rssOpps];
      let oppInserted = 0;
      let oppSkipped = 0;
      const newOppIds: { id: string; source_url: string; title: string; organization: string }[] = [];

      for (const opp of allOpportunities) {
        if (!opp.source_url) {
          oppSkipped++;
          continue;
        }
        const cleanedTitle = cleanTitle(opp.title, opp.organization);
        const normalizedUrl = normalizeUrl(opp.source_url);

        const { data: existingUrl } = await supabaseAdmin
          .from("opportunities")
          .select("id")
          .or(`source_url.eq."${opp.source_url.replace(/"/g, '""')}",source_url.eq."${normalizedUrl.replace(/"/g, '""')}"`)
          .maybeSingle();

        const { data: existingTitle } = await supabaseAdmin
          .from("opportunities")
          .select("id")
          .ilike("title", cleanedTitle)
          .maybeSingle();

        if (existingUrl || existingTitle) {
          oppSkipped++;
          continue;
        }

            const { data, error } = await supabaseAdmin
              .from("opportunities")
              .insert([
                {
                  title: cleanedTitle,
                  organization: opp.organization,
                  category: opp.category,
                  location: opp.location,
                  stipend: opp.stipend,
                  deadline: opp.deadline,
                  eligibility: opp.eligibility,
                  description: opp.description,
                  apply_link: opp.apply_link,
                  source_url: normalizedUrl,
                  tags: opp.tags,
                  verification_status: "verified",
                  is_active: true,
                },
              ])
              .select("id, source_url, title, organization")
              .single();

        if (!error && data) {
          oppInserted++;
          newOppIds.push({ id: data.id, source_url: data.source_url, title: data.title, organization: data.organization });
        } else {
          oppSkipped++;
        }
      }

      // Deep scrape — enrich newly inserted opportunities with full detail page data
      let enrichedCount = 0;
      if (newOppIds.length > 0) {
        const batchSize = 5;
        for (const item of newOppIds.slice(0, batchSize)) {
          const original = allOpportunities.find((o) => o.source_url === item.source_url);
          if (!original) continue;

          try {
            const enriched = await enrichOpportunity(original, item.id);
            if (enriched.description || enriched.eligibility || enriched.stipend || enriched.apply_link_type) {
              await supabaseAdmin
                .from("opportunities")
                .update({
                  description: enriched.description,
                  eligibility: enriched.eligibility,
                  stipend: enriched.stipend,
                  deadline: enriched.deadline,
                  location: enriched.location,
                  tags: enriched.tags,
                  apply_link_type: enriched.apply_link_type,
                  official_page_url: enriched.official_page_url,
                })
                .eq("id", item.id);
              enrichedCount++;
            }
          } catch {
            // skip — detail page fetching failed, keep listing data
          }
        }
      }

      result.opportunities = {
        sources: scrapeResults,
        total_fetched: allOpportunities.length,
        inserted: oppInserted,
        skipped: oppSkipped,
        rss_sources: rssOpps.length,
        enriched: enrichedCount,
        enriched_pending: Math.max(0, oppInserted - enrichedCount),
      };
    }

    return NextResponse.json({
      message: `Scrape complete (${mode})`,
      ...result,
    });
  } catch (error) {
    console.error("Error in scrape endpoint:", error);
    return NextResponse.json(
      { error: "Failed to scrape" },
      { status: 500 }
    );
  }
}
