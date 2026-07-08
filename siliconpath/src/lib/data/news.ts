import { getDB } from "../db/index.js";
import type { NewsArticle } from "../types.js";

export async function listNews(limit = 30): Promise<NewsArticle[]> {
  const { client } = getDB("core");
  const { data, error } = await client
    .from("news_articles")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(Math.min(limit, 100));
  if (error) throw new Error(`[data] listNews failed: ${error.message}`);
  return (data ?? []) as NewsArticle[];
}
