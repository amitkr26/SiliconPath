"use client";

import { useEffect, useState, useCallback } from "react";
import type { NewsArticle } from "@/types";
import NewsCard from "@/components/NewsCard";
import SearchBar from "@/components/SearchBar";
import { Loader2, RefreshCw, Newspaper } from "lucide-react";

const TABS = [
  { label: "All", value: "" },
  { label: "Semiconductor", value: "Semiconductor" },
  { label: "VLSI", value: "VLSI" },
  { label: "AI Chips", value: "AI Chips" },
  { label: "Research", value: "Research" },
  { label: "India", value: "India" },
  { label: "Industry", value: "Industry" },
  { label: "Jobs", value: "Jobs" },
];

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");

  const fetchNews = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (search) params.set("search", search);
      if (activeTag) params.set("tag", activeTag);

      const res = await fetch(`/api/news?${params}`);
      const data = await res.json();

      if (data.articles) {
        setArticles(data.articles);
      } else {
        setArticles([]);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [search, activeTag]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">
              Semiconductor & Electronics News
            </h1>
            <p className="text-text-secondary mt-0.5 text-sm">
              Latest industry updates and research breakthroughs.
            </p>
          </div>
        </div>
        <button
          onClick={fetchNews}
          className="inline-flex items-center gap-2 text-accent text-sm font-medium hover:underline"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTag(tab.value)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeTag === tab.value
                ? "bg-accent text-bg-primary"
                : "bg-surface text-text-secondary border border-border/50 hover:border-accent/30"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-8 max-w-md">
        <SearchBar
          onSearch={setSearch}
          placeholder="Search news articles..."
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-surface/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Newspaper className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-text-secondary text-lg mb-2">No news articles yet.</p>
          <p className="text-text-secondary text-sm">
            News will appear here once fetched from RSS feeds.
          </p>
          <button
            onClick={fetchNews}
            className="mt-4 inline-flex items-center gap-2 bg-accent text-bg-primary font-semibold rounded-lg px-4 py-2 text-sm hover:bg-accent-hover transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
