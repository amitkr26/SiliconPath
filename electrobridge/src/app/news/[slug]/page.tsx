import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink, Clock, Calendar, Tag } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import NewsImage from "@/components/NewsImage";

export const revalidate = 1800;

export async function generateStaticParams() {
  if (!supabaseAdmin?.from) return [];
  const { data } = await supabaseAdmin
    .from("news_articles")
    .select("slug")
    .not("slug", "is", null)
    .limit(200);
  return (data || []).map((article: { slug: string }) => ({ slug: article.slug }));
}

interface Props {
  params: { slug: string };
}

const SOURCE_COLORS: Record<string, string> = {
  "IEEE Spectrum": "bg-blue-500",
  "Semiconductor Engineering": "bg-emerald-500",
  "EE Times": "bg-orange-500",
  "Electronics Weekly": "bg-red-500",
  "Chip Design Magazine": "bg-indigo-500",
  "SemiWiki": "bg-teal-500",
  "Electronics For You": "bg-green-500",
  "AnandTech": "bg-purple-500",
  "The Register — Hardware": "bg-gray-400",
  "Nature Electronics": "bg-rose-500",
  "Science Daily — Semiconductors": "bg-sky-500",
  "Science Daily — Electronics": "bg-sky-600",
  "Phys.org — Semiconductors": "bg-violet-500",
  "Phys.org — Electronics": "bg-violet-600",
  "India Semiconductor Mission": "bg-yellow-500",
  "IESA News": "bg-amber-500",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!supabaseAdmin?.from) return { title: "News | ElectroBridge" };

  let article = await lookupArticle(params.slug);
  if (!article) return { title: "Article Not Found" };

  return {
    title: `${article.title} | ElectroBridge News`,
    description: article.summary || `Latest news from ${article.source || "ElectroBridge"}`,
    alternates: { canonical: `https://electrobridge.vercel.app/news/${params.slug}` },
    openGraph: {
      title: article.title,
      description: article.summary || "",
      url: `https://electrobridge.vercel.app/news/${params.slug}`,
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
  const sourceDotColor = (article.source && SOURCE_COLORS[article.source]) || "bg-gray-500";

  const newsArticleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    url: `https://electrobridge.vercel.app/news/${params.slug}`,
    image: article.image_url,
    datePublished: article.published_at,
    dateModified: article.created_at || article.published_at,
    publisher: {
      "@type": "Organization",
      name: article.source || "ElectroBridge",
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
      { "@type": "ListItem", position: 1, name: "Home", item: "https://electrobridge.vercel.app" },
      { "@type": "ListItem", position: 2, name: "News", item: "https://electrobridge.vercel.app/news" },
      { "@type": "ListItem", position: 3, name: article.title, item: `https://electrobridge.vercel.app/news/${params.slug}` },
    ],
  };

  let relatedNews: any[] = [];
  let relatedOpportunities: any[] = [];

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

    if (tags.length > 0) {
      const { data: opps } = await supabaseAdmin
        .from("opportunities")
        .select("*")
        .eq("is_active", true)
        .contains("tags", [tags[0]])
        .order("created_at", { ascending: false })
        .limit(3);
      if (opps) relatedOpportunities = opps;
    }
  } catch (e) {}

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <Link
        href="/news"
        className="inline-flex items-center gap-1 text-[#94A3B8] hover:text-white transition-colors text-sm mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to News
      </Link>

      <article className="bg-[#1A2438] border border-[#1F2937] rounded-xl p-6 sm:p-8">
        {article.image_url && (
          <div className="mb-6 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 rounded-t-xl overflow-hidden">
            <NewsImage src={article.image_url} alt={article.title} />
          </div>
        )}

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0B1120] border border-[#1F2937]/50 rounded-full text-xs font-medium text-[#94A3B8]">
            <span className={`w-2.5 h-2.5 rounded-full ${sourceDotColor}`} />
            {article.source}
          </span>
          {article.published_at && (
            <span className="flex items-center gap-1.5 text-[#94A3B8] text-xs">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(article.published_at)}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[#94A3B8] text-xs">
            <Clock className="w-3.5 h-3.5" />
            {article.published_at ? timeAgo(article.published_at) : ""}
          </span>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
          {article.title}
        </h1>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.map((tag: string) => (
              <Link
                key={tag}
                href={`/news?tag=${encodeURIComponent(tag)}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#00E5FF]-900/20 text-[#00E5FF]-400 rounded-full text-xs font-medium border border-cyan-500/15 hover:bg-[#00E5FF]-900/30 transition-colors"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </Link>
            ))}
          </div>
        )}

        {article.summary && (
          <div className="prose prose-invert max-w-none mb-8">
            <p className="text-[#94A3B8] text-base leading-relaxed whitespace-pre-wrap">
              {article.summary}
            </p>
          </div>
        )}

        {article.source_url && (
          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#00E5FF] text-[#0B1120] font-semibold rounded-lg px-5 py-2.5 text-sm hover:bg-[#00E5FF]/90 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Read Original Article
          </a>
        )}
      </article>

      {/* Related News */}
      {relatedNews.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-white mb-4">Related News</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedNews.map((item: any) => (
              <Link
                key={item.id}
                href={`/news/${item.slug || item.id}`}
                className="bg-[#1A2438] border border-[#1F2937] rounded-lg p-4 hover:border-cyan/30 transition-all hover:translate-y-[-2px] block"
              >
                <h3 className="text-white text-sm font-semibold line-clamp-2 leading-snug">{item.title}</h3>
                <p className="text-[#94A3B8] text-xs mt-2 line-clamp-2">{item.summary}</p>
                <p className="text-[#00E5FF] text-xs mt-2 font-medium">Read More →</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Related Opportunities */}
      {relatedOpportunities.length > 0 && (
        <section className="mt-10 mb-10">
          <h2 className="font-display text-xl font-bold text-white mb-4">Related Opportunities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedOpportunities.map((opp: any) => (
              <Link
                key={opp.id}
                href={`/opportunities/${opp.slug}`}
                className="bg-[#1A2438] border border-[#1F2937] rounded-lg p-4 hover:border-cyan/30 transition-all hover:translate-y-[-2px] block"
              >
                <h3 className="text-white text-sm font-semibold line-clamp-2 leading-snug">{opp.title}</h3>
                <p className="text-[#94A3B8] text-xs mt-1">{opp.organization}</p>
                {opp.stipend && <p className="text-[#00E5FF] text-xs mt-1 font-medium">{opp.stipend}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
