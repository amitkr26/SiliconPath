import { NextResponse } from "next/server";
import { db1, db2 } from "@/lib/db";

export async function GET(request: Request) {
  if (!db1 || !db2) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: oldNews, error: fetchError } = await db1
    .from("news_articles")
    .select("*")
    .lt("created_at", thirtyDaysAgo.toISOString())
    .limit(100);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!oldNews || oldNews.length === 0) {
    return NextResponse.json({ archived: 0, errors: [] });
  }

  const errors: string[] = [];
  let archived = 0;

  for (const article of oldNews) {
    const { error: insertError } = await db2
      .from("news_archive")
      .insert({
        id: article.id,
        title: article.title,
        summary: article.summary,
        source: article.source,
        source_url: article.source_url,
        image_url: article.image_url,
        tags: article.tags,
        slug: article.slug,
        published_at: article.published_at,
        created_at: article.created_at,
      });

    if (insertError) {
      errors.push(`Insert failed for ${article.id}: ${insertError.message}`);
      continue;
    }

    const { error: deleteError } = await db1
      .from("news_articles")
      .delete()
      .eq("id", article.id);

    if (deleteError) {
      errors.push(`Delete failed for ${article.id}: ${deleteError.message}`);
    } else {
      archived++;
    }
  }

  return NextResponse.json({ archived, errors });
}
