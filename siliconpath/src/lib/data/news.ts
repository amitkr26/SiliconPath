import { getDB } from "../db/index.js";

export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  source: string | null;
  summary: string | null;
  published_at: string | null;
  created_at: string;
}

export async function listNews(limit = 30): Promise<NewsArticle[]> {
  const { client } = getDB("core");
  const { data, error } = await client
    .from("news_articles")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw new Error(`[data] listNews: ${error.message}`);
  return (data ?? []) as NewsArticle[];
}
