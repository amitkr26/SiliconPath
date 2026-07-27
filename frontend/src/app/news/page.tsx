"use client";

import { useEffect, useState, useCallback } from "react";
import type { NewsArticle } from "@/types";
import NewsCard from "@/components/NewsCard";
import SearchBar from "@/components/SearchBar";
import { Loader2, RefreshCw, Newspaper, Sparkles, Zap, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const TABS = [
  { label: "All July 2026 News", value: "" },
  { label: "Semiconductor Fabs", value: "Semiconductor" },
  { label: "VLSI Design", value: "VLSI" },
  { label: "AI Chips", value: "AI Chips" },
  { label: "Academic Research", value: "Research" },
  { label: "India Mission", value: "India" },
  { label: "Industry Updates", value: "Industry" },
];

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (search) params.set("search", search);
      if (activeTag) params.set("tag", activeTag);

      const res = await fetch(`/api/news?${params}`);
      const data = await res.json();

      if (data && Array.isArray(data.articles)) {
        setArticles(data.articles);
        if (data.last_synced) setLastSynced(data.last_synced);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  }, [search, activeTag]);

  const handleForceSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/news/sync");
      const data = await res.json();
      if (data.success) {
        toast.success(`Synced ${data.scraped_count} fresh articles from IEEE, EE Times & SemiEngineering!`);
      }
      await fetchNews();
    } catch {
      toast.error("Failed to sync live RSS feeds.");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* JULY 2026 FEATURE BANNER */}
        <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs font-bold text-blue-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>July 2026 Major Coverage & Daily Live RSS Sync</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                July 2026 Semiconductor & VLSI Industry Digest
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Featuring major July 2026 updates: India Semiconductor Mission $15B Fabs, TSMC 2nm N2 GAA, Intel 18A EUV, ISRO RISC-V, Cadence/Synopsys AI EDA, and daily auto-synced feeds from IEEE Spectrum & EE Times.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-shrink-0">
              <button
                onClick={handleForceSync}
                disabled={syncing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg transition-all disabled:opacity-50"
              >
                {syncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                )}
                <span>{syncing ? "Syncing RSS..." : "Sync Live Daily Feeds"}</span>
              </button>

              <button
                onClick={fetchNews}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* NEWS HEADER & SEARCH */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-2xs">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Live Article Stream
              </h1>
              {lastSynced && (
                <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Auto-updated on {new Date(lastSynced).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          </div>

          <div className="max-w-md w-full">
            <SearchBar
              onSearch={setSearch}
              placeholder="Search July 2026, TSMC, ISRO, IEEE news..."
            />
          </div>
        </div>

        {/* CATEGORY TABS */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTag(tab.value)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTag === tab.value
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ARTICLES FEED */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm text-slate-600 font-medium">Fetching July 2026 & Live Semiconductor Feeds...</p>
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article) => (
              <NewsCard key={article.id || article.slug} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <Newspaper className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-slate-900 font-bold text-base">No Articles Found</h3>
            <p className="text-slate-500 text-xs mt-1">Try clearing your search query or selecting &quot;All July 2026 News&quot;.</p>
          </div>
        )}

      </div>
    </div>
  );
}
