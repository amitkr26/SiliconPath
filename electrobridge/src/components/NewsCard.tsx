"use client";

import { useState } from "react";
import { ExternalLink, Clock, Newspaper } from "lucide-react";
import type { NewsArticle } from "@/types";

interface NewsCardProps {
  article: NewsArticle;
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

const SOURCE_DOT: Record<string, string> = {};
for (const key of Object.keys(SOURCE_COLORS)) {
  SOURCE_DOT[key] = SOURCE_COLORS[key];
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
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function NewsCard({ article }: NewsCardProps) {
  const [imgError, setImgError] = useState(false);
  const tags = (article as any).tags || [];
  const sourceDotColor = (article.source && SOURCE_COLORS[article.source]) || "bg-gray-500";

  return (
    <a
      href={article.source_url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-surface border border-border rounded-xl p-4 hover:border-accent/30 transition-all duration-200 hover:-translate-y-0.5 block group"
    >
      <div className="flex items-start gap-3">
        {article.image_url && !imgError ? (
          <img
            src={article.image_url}
            alt=""
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent/10 to-purple/10 flex items-center justify-center flex-shrink-0">
            <Newspaper className="w-6 h-6 text-accent/60" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-text-primary text-sm font-semibold line-clamp-2 leading-snug group-hover:text-accent">
            {article.title}
          </h3>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-bg-primary border border-border/50 rounded text-[10px] font-medium text-text-secondary">
              <span className={`w-2 h-2 rounded-full ${sourceDotColor}`} />
              {article.source}
            </span>
            {article.published_at && (
              <span className="flex items-center gap-1 text-text-secondary text-[10px]">
                <Clock className="w-3 h-3" />
                {timeAgo(article.published_at)}
              </span>
            )}
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.slice(0, 2).map((tag: string) => (
                <span
                  key={tag}
                    className="px-1.5 py-0.5 bg-accent/20 text-accent rounded text-[9px] font-medium border border-accent/15"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="text-[9px] text-text-secondary">+{tags.length - 2}</span>
              )}
            </div>
          )}
          {article.summary && (
            <p className="text-text-secondary text-xs mt-2 line-clamp-2">
              {article.summary}
            </p>
          )}
          <div className="flex items-center gap-1 mt-2 text-accent text-[10px] font-medium opacity-0 group-hover:opacity-100">
            Read More <ExternalLink className="w-3 h-3" />
          </div>
        </div>
      </div>
    </a>
  );
}
