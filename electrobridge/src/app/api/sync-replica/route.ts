import { NextResponse } from "next/server";
import { db1, neonSecondary } from "@/lib/db";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: opportunities, error: oppError } = await db1
    .from("opportunities")
    .select("*")
    .eq("is_active", true);

  if (oppError) {
    return NextResponse.json({ error: oppError.message }, { status: 500 });
  }

  let oppsSynced = 0;
  if (opportunities && opportunities.length > 0) {
    for (const opp of opportunities) {
      await neonSecondary`
        INSERT INTO opportunities_mirror (
          id, title, organization, category, location, stipend, deadline,
          eligibility, description, apply_link, tags, slug, verification_status,
          is_active, apply_clicks, posted_at, created_at, synced_at
        ) VALUES (
          ${opp.id}, ${opp.title}, ${opp.organization}, ${opp.category},
          ${opp.location}, ${opp.stipend}, ${opp.deadline ? opp.deadline.split('T')[0] : null},
          ${opp.eligibility}, ${opp.description}, ${opp.apply_link},
          ${opp.tags}, ${opp.slug}, ${opp.verification_status},
          ${opp.is_active}, ${opp.apply_clicks || 0}, ${opp.posted_at},
          ${opp.created_at}, now()
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          organization = EXCLUDED.organization,
          category = EXCLUDED.category,
          location = EXCLUDED.location,
          stipend = EXCLUDED.stipend,
          deadline = EXCLUDED.deadline::date,
          eligibility = EXCLUDED.eligibility,
          description = EXCLUDED.description,
          apply_link = EXCLUDED.apply_link,
          tags = EXCLUDED.tags,
          verification_status = EXCLUDED.verification_status,
          is_active = EXCLUDED.is_active,
          apply_clicks = EXCLUDED.apply_clicks,
          posted_at = EXCLUDED.posted_at,
          synced_at = now()
      `;
      oppsSynced++;
    }
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: news, error: newsError } = await db1
    .from("news_articles")
    .select("*")
    .gte("created_at", sevenDaysAgo.toISOString());

  if (newsError) {
    return NextResponse.json({ error: newsError.message }, { status: 500 });
  }

  let newsSynced = 0;
  if (news && news.length > 0) {
    for (const article of news) {
      await neonSecondary`
        INSERT INTO news_mirror (
          id, title, summary, source, source_url, tags, slug,
          published_at, created_at, synced_at
        ) VALUES (
          ${article.id}, ${article.title}, ${article.summary},
          ${article.source}, ${article.source_url}, ${article.tags},
          ${article.slug}, ${article.published_at}, ${article.created_at}, now()
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          summary = EXCLUDED.summary,
          source = EXCLUDED.source,
          source_url = EXCLUDED.source_url,
          tags = EXCLUDED.tags,
          slug = EXCLUDED.slug,
          published_at = EXCLUDED.published_at,
          synced_at = now()
      `;
      newsSynced++;
    }
  }

  return NextResponse.json({ opps_synced: oppsSynced, news_synced: newsSynced });
}
