"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, ExternalLink, ArrowRight, X, Newspaper } from "lucide-react";
import type { NewsArticle } from "@/types";
import ImageWithFallback from "@/components/ui/ImageWithFallback";

interface NewsCardProps {
  article: NewsArticle;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NewsCard({ article }: NewsCardProps) {
  const [showModal, setShowModal] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Close modal on Escape key
  useEffect(() => {
    if (!showModal) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    document.addEventListener("keydown", handleEscape);
    // Focus the close button when modal opens
    closeBtnRef.current?.focus();
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showModal]);

  const tags = article.tags || [];
  const sourceName = article.source || (article as any).source_name || "Official Source";
  const sourceUrl = article.source_url || (article as any).url || "https://semiengineering.com/";
  const articleContent = article.summary || (article as any).content || "Detailed research summary available on official publisher portal.";

  return (
    <>
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200 flex flex-col justify-between group h-full">
        <div>
          {/* TOP BANNER IMAGE OR EDITORIAL FALLBACK */}
          <div className="w-full h-36 rounded-lg overflow-hidden border border-slate-100 mb-4 relative bg-slate-100">
            <ImageWithFallback
              src={article.image_url}
              alt={article.title}
              name={sourceName}
              variant="editorial"
              width={600}
              height={240}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              editorialMeta={{
                sourceName,
                category: tags[0] ? `#${tags[0]}` : "Semiconductor",
                date: article.published_at ? timeAgo(article.published_at) : undefined,
              }}
            />
            {article.image_url && (
              <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-md text-[11px] font-semibold text-slate-800 shadow-xs">
                <Newspaper size={11} className="text-blue-600" />
                {sourceName}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <button
              onClick={() => setShowModal(true)}
              className="text-left w-full focus:outline-none"
            >
              <h3 className="text-slate-900 text-base font-bold line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                {article.title}
              </h3>
            </button>

            <div className="flex items-center gap-2.5 mt-2 flex-wrap text-xs">
              {article.published_at && (
                <span className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                  <Clock size={12} />
                  {timeAgo(article.published_at)}
                </span>
              )}
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
              {tags.slice(0, 3).map((tag: string, i: number) => (
                <span
                  key={`${tag}-${i}`}
                  className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[10px] font-medium border border-slate-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-semibold text-slate-700 hover:text-blue-600 transition flex items-center gap-1"
          >
            <span>Read Summary</span>
            <ArrowRight size={13} />
          </button>

          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors shadow-xs"
          >
            <span>Official Source</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* MODAL VIEW */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          role="dialog"
          aria-modal="true"
          aria-label={article.title}
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-5 sm:p-6 relative">
            <button
              ref={closeBtnRef}
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-md text-xs font-semibold text-blue-700">
                <Newspaper size={12} className="text-blue-600" />
                {sourceName}
              </span>
              {article.published_at && (
                <span className="text-slate-500 text-xs font-medium flex items-center gap-1">
                  <Clock size={12} />
                  {timeAgo(article.published_at)}
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-4 leading-snug">
              {article.title}
            </h2>

            {/* Modal Image */}
            <div className="w-full h-56 rounded-lg overflow-hidden border border-slate-100 mb-5">
              <ImageWithFallback
                src={article.image_url}
                alt={article.title}
                variant="editorial"
                editorialMeta={{
                  sourceName,
                  category: article.tags?.[0],
                  date: article.published_at ? timeAgo(article.published_at) : undefined,
                }}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="prose prose-slate max-w-none text-slate-700 text-sm font-normal leading-relaxed whitespace-pre-line mb-6">
              {articleContent}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors shadow-xs"
              >
                <span>Read Full Article on {sourceName}</span>
                <ExternalLink size={14} />
              </a>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
