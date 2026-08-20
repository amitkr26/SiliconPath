"use client";

import { useState } from "react";
import { Clock, ExternalLink, ArrowRight, X, Newspaper } from "lucide-react";
import type { NewsArticle } from "@/types";

interface NewsCardProps {
  article: NewsArticle;
}

const SOURCE_COLORS: Record<string, string> = {
  "IEEE Spectrum": "bg-blue-600",
  "EE Times": "bg-emerald-600",
  "Semiconductor Engineering": "bg-purple-600",
  "India Semiconductor Mission": "bg-orange-600",
  "Electronics Weekly": "bg-red-600",
  "AnandTech": "bg-indigo-600",
};

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
  const [imgError, setImgError] = useState(false);

  const tags = article.tags || [];
  const sourceName = article.source || (article as any).source_name || "Official Source";
  const sourceUrl = article.source_url || (article as any).url || "https://semiengineering.com/";
  const sourceDotColor = SOURCE_COLORS[sourceName] || "bg-blue-600";
  const articleContent = article.summary || (article as any).content || "Detailed research summary available on official publisher portal.";

  return (
    <>
      <div className="bg-white rounded-2xl p-5 border-2 border-slate-900 shadow-brutal hover:shadow-brutal-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group h-full">
        <div>
          {/* TOP BANNER IMAGE */}
          <div className="w-full h-36 rounded-xl overflow-hidden border-2 border-slate-900 shadow-brutal-sm mb-4 relative bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={!imgError && article.image_url ? article.image_url : "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80"}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
            />
            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border-2 border-slate-900 rounded-lg text-[11px] font-bold text-slate-900 shadow-brutal-sm">
              <span className={`w-2 h-2 rounded-full ${sourceDotColor}`} />
              {sourceName}
            </span>
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
                <span className="flex items-center gap-1 text-slate-600 text-[11px] font-bold">
                  <Clock size={12} className="" />
                  {timeAgo(article.published_at)}
                </span>
              )}
            </div>
          </div>

          {/* Article Summary */}
          {article.summary && (
            <p className="text-slate-700 text-xs mt-3 line-clamp-2 leading-relaxed font-medium">
              {article.summary}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-blue-50 text-blue-900 rounded-md text-[10px] font-bold border border-slate-900 shadow-[1px_1px_0px_0px_#0F172A]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t-2 border-slate-900">
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-bold text-slate-900 hover:text-blue-600 transition flex items-center gap-1"
          >
            <span>Read Summary</span>
            <ArrowRight size={13} className="" />
          </button>

          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-xl border-2 border-slate-900 transition shadow-brutal-sm"
          >
            <span>Official Source</span>
            <ExternalLink size={13} className="" />
          </a>
        </div>
      </div>

      {/* MODAL VIEW */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-brutal-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl border-2 border-slate-900 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold transition shadow-brutal-sm"
              aria-label="Close modal"
            >
              <X size={18} className="" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border-2 border-slate-900 rounded-lg text-xs font-bold text-slate-900 shadow-brutal-sm">
                <span className={`w-2 h-2 rounded-full ${sourceDotColor}`} />
                {sourceName}
              </span>
              {article.published_at && (
                <span className="text-slate-600 text-xs font-bold flex items-center gap-1">
                  <Clock size={12} className="" />
                  {timeAgo(article.published_at)}
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-4 leading-snug">
              {article.title}
            </h2>

            {/* Modal Image */}
            <div className="w-full h-56 rounded-xl overflow-hidden border-2 border-slate-900 shadow-brutal mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={!imgError && article.image_url ? article.image_url : "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="prose prose-slate max-w-none text-slate-800 text-sm font-medium leading-relaxed whitespace-pre-line mb-6">
              {articleContent}
            </div>

            <div className="flex items-center justify-between pt-4 border-t-2 border-slate-900">
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0F172A] transition"
              >
                <span>Read Full Article on {sourceName}</span>
                <ExternalLink size={14} className="" />
              </a>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-900 border-2 border-slate-900 rounded-xl hover:bg-slate-100 transition shadow-brutal-sm"
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
