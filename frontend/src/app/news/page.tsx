import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { NewsArticle } from "@/types";
import NewsClient from "./NewsClient";

export const metadata: Metadata = {
  title: "Semiconductor Industry News & Hardware Intelligence",
  description:
    "Daily verified semiconductor news, Fab announcements, IEEE research breakthroughs, and VLSI industry circulars aggregated from certified publishers.",
  alternates: {
    canonical: "https://berojgardegreewala.vercel.app/news",
  },
  openGraph: {
    title: "Semiconductor & VLSI Industry News | BerojgarDegreeWala",
    description:
      "Daily aggregated semiconductor intelligence, India Semiconductor Mission updates, IEEE research, and chip design news.",
    url: "https://berojgardegreewala.vercel.app/news",
    type: "website",
  },
};

export const revalidate = 1800; // 30 minutes cache for news feed

async function getInitialNews(): Promise<{ articles: NewsArticle[]; lastSynced: string | null }> {
  if (!supabaseAdmin?.from) return { articles: [], lastSynced: null };

  try {
    const { data } = await supabaseAdmin
      .from("news_articles")
      .select("*")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(40);

    if (!data || data.length === 0) return { articles: [], lastSynced: null };

    const lastArticle = data[0];
    const lastSynced = lastArticle?.published_at || lastArticle?.created_at || null;

    return {
      articles: data as NewsArticle[],
      lastSynced,
    };
  } catch (err) {
    console.error("[News Page Fetch Error]:", err);
    return { articles: [], lastSynced: null };
  }
}

export default async function NewsPage() {
  const { articles, lastSynced } = await getInitialNews();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://berojgardegreewala.vercel.app" },
      { "@type": "ListItem", position: 2, name: "Semiconductor News", item: "https://berojgardegreewala.vercel.app/news" },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Semiconductor & Hardware Industry News",
    itemListElement: articles.slice(0, 20).map((art, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: art.title,
      url: `https://berojgardegreewala.vercel.app/news/${art.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <NewsClient initialArticles={articles} initialLastSynced={lastSynced} />
    </>
  );
}