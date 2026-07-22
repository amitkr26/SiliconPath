"use client";

import { useState } from "react";
import { ExternalLink, Clock, Newspaper, ArrowRight, X, Sparkles, BookOpen } from "lucide-react";
import Link from "next/link";
import type { NewsArticle } from "@/types";

interface NewsCardProps {
  article: NewsArticle;
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

function timeAgo(dateString: string): string {
  if (!dateString) return "Recently";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function NewsCard({ article }: NewsCardProps) {
  const [imgError, setImgError] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const tags = (article as any).tags || [];
  const sourceName = article.source || (article as any).source_name || "Official Source";
  const sourceUrl = article.source_url || (article as any).url || "https://semiengineering.com/";
  const sourceDotColor = SOURCE_COLORS[sourceName] || "bg-blue-600";
  const internalSlug = article.slug || article.id;
  const articleContent = article.summary || (article as any).content || "Detailed research summary available on official publisher portal.";

  return (
    <>
      <div className="glass-premium rounded-2xl p-5 border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all duration-300 flex flex-col justify-between group h-full">
        <div>
          <div className="flex items-start gap-3.5">
            {article.image_url && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.image_url}
                alt=""
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-slate-200"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center flex-shrink-0">
                <Newspaper size={22} />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <button
                onClick={() => setShowModal(true)}
                className="text-left w-full focus:outline-none"
              >
                <h3 className="text-slate-900 text-sm font-bold line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                  {article.title}
                </h3>
              </button>

              <div className="flex items-center gap-2.5 mt-2 flex-wrap text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 border border-blue-100 rounded-full text-[11px] font-semibold text-blue-700">
                  <span className={`w-2 h-2 rounded-full ${sourceDotColor}`} />
                  {sourceName}
                </span>
                {article.published_at && (
                  <span className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                    <Clock size={12} />
                    {timeAgo(article.published_at)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Article Summary */}
          {article.summary && (
            <p className="text-slate-600 text-xs mt-3 line-clamp-2 leading-relaxed font-normal">
              {article.summary}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-semibold border border-slate-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition flex items-center gap-1"
          >
            <span>Read Summary</span>
            <ArrowRight size={13} />
          </button>

          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-full border border-blue-200 transition shadow-2xs"
          >
            <span>Official Source</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* DETAILED POPUP MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-3">
              <Sparkles className="w-4 h-4" />
              <span>Semiconductor Executive Briefing</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug mb-4">
              {article.title}
            </h2>

            <div className="flex items-center gap-3 mb-6 flex-wrap text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full font-semibold text-blue-700">
                <span className={`w-2 h-2 rounded-full ${sourceDotColor}`} />
                {sourceName}
              </span>
              {article.published_at && (
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {timeAgo(article.published_at)}
                </span>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" /> Executive Summary
              </h4>
              {articleContent}
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {tags.map((t: string) => (
                  <span key={t} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold border border-slate-200">
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <Link
                href={`/news/${internalSlug}`}
                onClick={() => setShowModal(false)}
                className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
              >
                View Full Dedicated News Page →
              </Link>
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 btn-glow font-semibold text-xs rounded-full shadow-md"
              >
                Visit Official Source Article <ExternalLink className="w-4 h-4" />
              </a>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
