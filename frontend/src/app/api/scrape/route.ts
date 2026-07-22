import { NextRequest } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { fetchAllNews, fetchOpportunitiesFromRSS } from "@/lib/scrapers/rss-parser";
import { scrapeAllOpportunities } from "@/lib/scrapers/opportunity-scraper";
import { cleanTitle, slugify, normalizeUrl, GARBAGE_TITLE_PATTERNS } from "@/lib/scrapers/utils";
import { isElectronicsNews, autoTagArticle } from "@/lib/scrapers/news-filter";
import { enrichOpportunity } from "@/lib/scrapers/deep-scraper";
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

        if (!article.source_url) {
          newsSkipped++;
          continue;
        }

        const normalizedUrl = normalizeUrl(article.source_url);
        // Check for existing by URL (live schema: column is `url`, not `source_url`)
        const { data: existingUrl } = await supabaseAdmin
          .from("news_articles")
          .select("id")
          .or(`url.eq.${JSON.stringify(article.source_url)},url.eq.${JSON.stringify(normalizedUrl)}`)
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

        // Live schema: news_articles has url, source_name — NO slug, NO source, NO source_url
        const { error: newsError } = await supabaseAdmin
          .from("news_articles")
          .insert([{
            title: article.title,
            url: normalizedUrl,            // live column: url (UNIQUE, NOT NULL)
            source_name: article.source,   // live column: source_name (NOT NULL)
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

        // Filter out obvious navigation or non-job garbage titles
        if (
          cleanedTitle.length < 10 ||
          GARBAGE_TITLE_PATTERNS.test(cleanedTitle) ||
          GARBAGE_TITLE_PATTERNS.test(opp.title)
        ) {
          oppSkipped++;
          continue;
        }

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

        // Resolve or create organization record (live schema: opportunities uses organization_id uuid FK)
        let orgId: string | null = null;
        if (opp.organization) {
          const orgSlug = opp.organization.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, 80);
          const { data: existingOrg } = await supabaseAdmin
            .from("organizations")
            .select("id")
            .eq("name", opp.organization)
            .maybeSingle();
          if (existingOrg) {
            orgId = existingOrg.id;
          } else {
            const orgType = opp.tags?.includes("government") || ["ISRO","DRDO","CSIR"].includes(opp.organization)
              ? "government"
              : opp.tags?.includes("academic") || opp.organization.includes("IIT") || opp.organization.includes("NIT")
              ? "academic"
              : "private";
            const { data: newOrg } = await supabaseAdmin
              .from("organizations")
              .insert([{ name: opp.organization, slug: orgSlug, type: orgType }])
              .select("id")
              .single();
            orgId = newOrg?.id ?? null;
          }
        }

        // Normalize category to live CHECK constraint values (all lowercase)
        const CAT_MAP: Record<string, string> = {
          "jrf": "jrf", "JRF": "jrf",
          "srf": "srf", "SRF": "srf",
          "phd": "phd", "PhD": "phd", "PHD": "phd",
          "postdoc": "postdoc", "PostDoc": "postdoc", "Research Associate": "postdoc",
          "fellowship": "fellowship", "Fellowship": "fellowship", "Research Fellow": "fellowship",
          "internship": "internship", "Internship": "internship",
          "government": "government", "Govt Job": "government",
          "industry": "industry", "Tech Job": "industry", "Electronics": "industry",
          "Engineering": "industry", "Private Job": "industry"
        };
        const normalizedCategory = CAT_MAP[opp.category] ?? "government";

        // Generate slug from title (required NOT NULL UNIQUE in live schema)
        let oppSlug = slugify(cleanedTitle);
        if (!oppSlug) oppSlug = `opportunity-${Date.now()}`;
        // Ensure uniqueness by appending timestamp if slug already exists
        const { data: existingSlug } = await supabaseAdmin
          .from("opportunities")
          .select("id")
          .eq("slug", oppSlug)
          .maybeSingle();
        if (existingSlug) oppSlug = `${oppSlug}-${Date.now()}`;

        // Build deadline: live schema expects date type (YYYY-MM-DD) or null
        let deadlineDate: string | null = null;
        if (opp.deadline) {
          // Try to parse common formats: DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD
          const dd = opp.deadline.match(/(\d{2})[.\/](\d{2})[.\/](\d{4})/);
          if (dd) deadlineDate = `${dd[3]}-${dd[2]}-${dd[1]}`;
          else if (/^\d{4}-\d{2}-\d{2}$/.test(opp.deadline)) deadlineDate = opp.deadline;
        }

        // Live schema: apply_url (NOT NULL), salary_range, organization_id — NO apply_link, NO stipend, NO organization (text)
        const { data: oppData, error: oppError } = await supabaseAdmin
          .from("opportunities")
          .insert([
            {
              title: cleanedTitle,
              slug: oppSlug,
              organization_id: orgId,
              category: normalizedCategory,
              location: opp.location,
              salary_range: opp.stipend,     // renamed: stipend → salary_range
              deadline: deadlineDate,
              eligibility: opp.eligibility,
              description: opp.description,
              apply_url: opp.apply_link || normalizedUrl,  // renamed: apply_link → apply_url
              source_url: normalizedUrl,
              tags: opp.tags,
              verification_status: "verified",
              is_active: true,
              source_type: "scraped",
            },
          ])
          .select("id, source_url, title")
          .single();

        if (!oppError && oppData) {
          oppInserted++;
          newOppIds.push({ id: oppData.id, source_url: oppData.source_url, title: oppData.title, organization: opp.organization });
        } else {
          if (oppError) console.error("opportunities insert error:", oppError.message);
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
            // Only update columns that exist in live schema; removed apply_link_type and official_page_url (don't exist)
            if (enriched.description || enriched.eligibility || enriched.stipend) {
              await supabaseAdmin
                .from("opportunities")
                .update({
                  description: enriched.description,
                  eligibility: enriched.eligibility,
                  salary_range: enriched.stipend,    // stipend → salary_range
                  deadline: enriched.deadline,
                  location: enriched.location,
                  tags: enriched.tags,
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
