import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Calendar, Tag, Newspaper } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import NewsImage from "@/components/NewsImage";

export const revalidate = 1800;

// QA audit P2: the detail page must render the STORED database title — it
// must never reverse-engineer a title from the slug, and there is no
// fallback article fabrication (see CONTENT_UPGRADE_PLAN.md P0).

const SOURCE_COLORS: Record<string, string> = {
  "IEEE Spectrum": "bg-purple-600",
  "Semiconductor Engineering": "bg-blue-600",
  "EE Times": "bg-cyan-600",
  "Electronics Weekly": "bg-emerald-600",
};

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  source: string | null;
  source_url: string | null;
  published_at: string | null;
  summary: string | null;
  content: string | null;
  tags: string[] | null;
  image_url: string | null;
}

async function lookupArticle(slug: string): Promise<NewsArticle | null> {
  if (!supabaseAdmin?.from) return null;
  const { data, error } = await supabaseAdmin
    .from("news_articles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data as NewsArticle;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await lookupArticle(slug);
  if (!article) return { title: "Article not found" };
  const articleUrl = `https://berojgardegreewala.vercel.app/news/${article.slug}`;
  return {
    // No "— BerojgarDegreeWala" suffix: the root layout title template
    // already appends "| BerojgarDegreeWala" (prevents duplicated site name).
    title: article.title,
    description: (article.summary || "").slice(0, 155),
    openGraph: {
      title: article.title,
      description: (article.summary || "").slice(0, 155),
      url: articleUrl,
      type: "article",
      images: [{ url: "/api/og", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      images: ["/api/og"],
    },
    alternates: { canonical: articleUrl },
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await lookupArticle(slug);
  if (!article) notFound();
  const tags: string[] = article.tags || [];
  const sourceDotColor = (article.source && SOURCE_COLORS[article.source]) || "bg-blue-600";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm font-semibold mb-6"
        >
          <ArrowLeft className="w-4 h-4 text-blue-600" />
          Back to Semiconductor News
        </Link>

        <article className="glass-premium rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm bg-white">
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
          </div>

          {/* STORED DB TITLE — never derived from the slug */}
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-6">
            {article.title}
          </h1>

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
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-full flex-shrink-0 transition-colors"
              >
                Visit Official Article Source <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          <div className="space-y-4 text-slate-700 text-base leading-relaxed border-t border-slate-200 pt-6">
            <h3 className="font-bold text-slate-900 text-lg">Executive Briefing & Key Highlights</h3>
            <p className="whitespace-pre-wrap">{article.summary || article.content || "Detailed article content available at original source link."}</p>
          </div>

          {tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200 flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500">Topics:</span>
              {tags.map((t: string) => (
                <span key={t} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold border border-slate-200">
                  {t}
                </span>
              ))}
            </div>
          )}

        </article>
      </div>
    </div>
  );
}
