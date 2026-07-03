import { NextResponse } from "next/server";
import { db1, db2, neonPrimary, neonSecondary } from "@/lib/db";

async function checkSupabase(client: any, tableName = "opportunities"): Promise<"ok" | "error"> {
  if (!client) return "error";
  try {
    const { error } = await client.from(tableName).select("*", { count: "exact", head: true });
    return error ? "error" : "ok";
  } catch {
    return "error";
  }
}

async function checkNeon(client: any): Promise<"ok" | "error"> {
  if (!client) return "error";
  try {
    await client`SELECT 1`;
    return "ok";
  } catch {
    return "error";
  }
}

export async function GET() {
  const [supabasePrimary, supabaseSecondary, neonPrimaryStatus, neonSecondaryStatus] =
    await Promise.all([
      checkSupabase(db1, "opportunities"),
      checkSupabase(db2, "news_archive"),
      checkNeon(neonPrimary),
      checkNeon(neonSecondary),
    ]);

  const databases = {
    supabase_primary: supabasePrimary,
    supabase_secondary: supabaseSecondary,
    neon_primary: neonPrimaryStatus,
    neon_secondary: neonSecondaryStatus,
  };

  const allOk = Object.values(databases).every((s) => s === "ok");

  let lastScrape: string | null = null;
  let lastNews: string | null = null;
  let opportunitiesCount = 0;
  let newsCount = 0;

  if (db1) {
    try {
      const { data: opp } = await db1
        .from("opportunities")
        .select("created_at", { count: "exact", head: true })
        .order("created_at", { ascending: false })
        .limit(1);
      if (opp && opp.length > 0) lastScrape = opp[0].created_at;

      const { count: oppCount } = await db1
        .from("opportunities")
        .select("*", { count: "exact", head: true });
      opportunitiesCount = oppCount || 0;

      const { data: news } = await db1
        .from("news_articles")
        .select("created_at", { count: "exact", head: true })
        .order("created_at", { ascending: false })
        .limit(1);
      if (news && news.length > 0) lastNews = news[0].created_at;

      const { count: newsCountResult } = await db1
        .from("news_articles")
        .select("*", { count: "exact", head: true });
      newsCount = newsCountResult || 0;
    } catch {
      // non-fatal if stats queries fail
    }
  }

  return NextResponse.json({
    status: allOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    databases,
    last_scrape: lastScrape,
    last_news: lastNews,
    opportunities_count: opportunitiesCount,
    news_count: newsCount,
  });
}
