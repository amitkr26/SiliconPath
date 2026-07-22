import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink, Clock, Calendar, Tag, Newspaper, Sparkles } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import NewsImage from "@/components/NewsImage";

export const revalidate = 1800;

export async function generateStaticParams() {
  if (!supabaseAdmin?.from) return [];
  const { data } = await supabaseAdmin
    .from("news_articles")
    .select("slug")
    .not("slug", "is", null)
    .limit(100);
  return (data || [])
    .filter((a: { slug: string }) => a.slug.length <= 80)
    .map((article: { slug: string }) => ({ slug: article.slug }));
}

interface Props {
  params: { slug: string };
}

const SOURCE_COLORS: Record<string, string> = {
  "IEEE Spectrum": "bg-blue-600",
  "Semiconductor Engineering": "bg-emerald-600",
  "EE Times": "bg-orange-600",
  "Electronics Weekly": "bg-red-600",
  "Chip Design Magazine": "bg-indigo-600",
  "SemiWiki": "bg-teal-600",
  "Electronics For You": "bg-green-600",
  "AnandTech": "bg-purple-600",
  "The Register — Hardware": "bg-slate-600",
  "Nature Electronics": "bg-rose-600",
  "Science Daily — Semiconductors": "bg-sky-600",
  "Science Daily — Electronics": "bg-sky-600",
  "Phys.org — Semiconductors": "bg-violet-600",
  "Phys.org — Electronics": "bg-violet-600",
  "India Semiconductor Mission": "bg-amber-600",
  "IESA News": "bg-amber-600",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!supabaseAdmin?.from) return { title: "News | BerojgarDegreeWala" };

  let article = await lookupArticle(params.slug);
  if (!article) return { title: "Article Not Found" };

  return {
    title: `${article.title} | BerojgarDegreeWala News`,
    description: article.summary || `Latest news from ${article.source || "BerojgarDegreeWala"}`,
    alternates: { canonical: `https://berojgardegreewala.vercel.app/news/${params.slug}` },
    openGraph: {
      title: article.title,
      description: article.summary || "",
      url: `https://berojgardegreewala.vercel.app/news/${params.slug}`,
      images: article.image_url ? [{ url: article.image_url }] : [],
      type: "article",
      publishedTime: article.published_at || undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      images: article.image_url ? [article.image_url] : [],
    },
  };
}

async function lookupArticle(slug: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  if (isUuid) {
    const { data } = await supabaseAdmin.from("news_articles").select("*").eq("id", slug).single();
    return data;
  }
  const { data } = await supabaseAdmin.from("news_articles").select("*").eq("slug", slug).single();
  return data;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export default async function NewsDetailPage({ params }: Props) {
  if (!supabaseAdmin?.from) notFound();

  const article = await lookupArticle(params.slug);
  if (!article) notFound();

  const tags: string[] = article.tags || [];
  const sourceDotColor = (article.source && SOURCE_COLORS[article.source]) || "bg-blue-600";

  const newsArticleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    url: `https://berojgardegreewala.vercel.app/news/${params.slug}`,
    image: article.image_url,
    datePublished: article.published_at,
    dateModified: article.created_at || article.published_at,
    publisher: {
      "@type": "Organization",
      name: article.source || "BerojgarDegreeWala",
    },
    sourceOrganization: article.source ? {
      "@type": "Organization",
      name: article.source,
    } : undefined,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://berojgardegreewala.vercel.app" },
      { "@type": "ListItem", position: 2, name: "News", item: "https://berojgardegreewala.vercel.app/news" },
      { "@type": "ListItem", position: 3, name: article.title, item: `https://berojgardegreewala.vercel.app/news/${params.slug}` },
    ],
  };

  let relatedNews: any[] = [];
  try {
    if (tags.length > 0) {
      const { data: news } = await supabaseAdmin
        .from("news_articles")
        .select("*")
        .neq("id", article.id)
        .contains("tags", [tags[0]])
        .order("published_at", { ascending: false })
        .limit(3);
      if (news) relatedNews = news;
    }
  } catch (e) {}

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm font-semibold mb-6"
        >
          <ArrowLeft className="w-4 h-4 text-blue-600" />
          Back to Semiconductor News
        </Link>

        <article className="glass-premium rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
          {article.image_url && (
            <div className="mb-6 -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 rounded-t-3xl overflow-hidden">
              <NewsImage src={article.image_url} alt={article.title} />
            </div>
          )}

          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-blue-700">
              <span className={`w-2 h-2 rounded-full ${sourceDotColor}`} />
              {article.source || "Official Source"}
            </span>
            {article.published_at && (
              <span className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(article.published_at)}
              </span>
            )}
            <span className="flex items-center gap-1 text-slate-500 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {article.published_at ? timeAgo(article.published_at) : ""}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-6">
            {article.title}
          </h1>

          {/* OFFICIAL SOURCE ACTION BANNER */}
          {article.source_url && (
            <div className="mb-8 p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Newspaper className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Original Publication</p>
                  <p className="text-xs text-slate-600">{article.source || "Official Publisher"}</p>
                </div>
              </div>
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 btn-glow font-semibold text-xs rounded-full flex-shrink-0"
              >
                Visit Official Article Source <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* DETAILED ARTICLE SUMMARY */}
          <div className="space-y-4 text-slate-700 text-base leading-relaxed border-t border-slate-200 pt-6">
            <h3 className="font-bold text-slate-900 text-lg">Executive Briefing & Key Highlights</h3>
            <p className="whitespace-pre-wrap">{article.summary || article.content || "Detailed article content available at original source link."}</p>
          </div>

          {/* TAGS */}
          {tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200 flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500">Topics:</span>
              {tags.map((t) => (
                <span key={t} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold border border-slate-200">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* BOTTOM OFFICIAL SOURCE LINK */}
          {article.source_url && (
            <div className="mt-8 pt-6 border-t border-slate-200 text-center">
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3.5 btn-glow font-semibold text-sm rounded-full"
              >
                Read Full Article at {article.source || "Official Source"} <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

        </article>
      </div>
    </div>
  );
}
