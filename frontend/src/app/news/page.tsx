"use client";

import { useEffect, useState, useCallback } from "react";
import type { NewsArticle } from "@/types";
import NewsCard from "@/components/NewsCard";
import SearchBar from "@/components/SearchBar";
import { Loader2, RefreshCw, Newspaper, Sparkles, Zap, CheckCircle2, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_TABS = [
  { label: "All News", value: "" },
  { label: "Semiconductor Fabs", value: "Semiconductor" },
  { label: "VLSI & RTL Design", value: "VLSI" },
  { label: "AI Chips & Hardware", value: "AI Chips" },
  { label: "Academic Research & JRF", value: "Research" },
  { label: "India Mission ($15B)", value: "India" },
];

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
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

  const filteredArticles = articles.filter((art) => {
    if (viewMode === "monthly") {
      // Show monthly digests or featured July 2026 updates
      return art.summary?.toLowerCase().includes("july 2026") || art.summary?.toLowerCase().includes("digest") || art.is_breaking;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* NEO-BRUTALIST HERO BANNER */}
        <div className="p-6 sm:p-8 rounded-2xl bg-blue-600 border-3 border-slate-900 text-white shadow-[6px_6px_0px_0px_#0F172A] relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white border-2 border-slate-900 text-slate-900 rounded-lg text-xs font-black shadow-[2px_2px_0px_0px_#0F172A]">
                <Sparkles className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                <span>DAILY &amp; MONTHLY LIVE AGGREGATION ENGINE</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Semiconductor &amp; VLSI Industry Intelligence
              </h1>
              <p className="text-blue-50 text-xs sm:text-sm font-semibold leading-relaxed">
                Live automated feeds from IEEE Spectrum, EE Times, and Semiconductor Engineering. Real-time updates on India Semiconductor Mission ($15B Fabs), TSMC 2nm N2 GAA, Intel 18A, and academic research circulars.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
              <button
                onClick={handleForceSync}
                disabled={syncing}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-black border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0F172A] hover:shadow-[5px_5px_0px_0px_#0F172A] transition-all disabled:opacity-50"
              >
                {syncing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-400 stroke-[2]" />
                )}
                <span>{syncing ? "Syncing Live RSS..." : "Sync Daily Live Feeds"}</span>
              </button>

              <button
                onClick={fetchNews}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-slate-900 bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold shadow-[3px_3px_0px_0px_#0F172A] transition-all"
              >
                <RefreshCw className="w-4 h-4 text-white stroke-[2.5]" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* FREQUENCY VIEW SWITCHER & SEARCH */}
        <div className="bg-white border-3 border-slate-900 rounded-2xl p-6 shadow-[5px_5px_0px_0px_#0F172A]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* VIEW MODE TOGGLE BUTTONS */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_0px_#0F172A]">
              <button
                onClick={() => setViewMode("daily")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                  viewMode === "daily"
                    ? "bg-blue-600 text-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A]"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                <Clock className="w-4 h-4 stroke-[2.5]" /> Daily Live Feed
              </button>
              <button
                onClick={() => setViewMode("monthly")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                  viewMode === "monthly"
                    ? "bg-blue-600 text-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A]"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                <Calendar className="w-4 h-4 stroke-[2.5]" /> Monthly Digest &amp; Analysis
              </button>
            </div>

            {/* SEARCH INPUT */}
            <div className="max-w-md w-full">
              <SearchBar
                onSearch={setSearch}
                placeholder="Search July 2026, TSMC, ISRO, IEEE news..."
              />
            </div>
          </div>

          {/* CATEGORY TABS */}
          <div className="flex gap-2.5 mt-6 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTag(tab.value)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-extrabold border-2 border-slate-900 transition-all ${
                  activeTag === tab.value
                    ? "bg-blue-600 text-white shadow-[2.5px_2.5px_0px_0px_#0F172A]"
                    : "bg-white text-slate-800 hover:bg-slate-100 hover:shadow-[2.5px_2.5px_0px_0px_#0F172A]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {lastSynced && (
            <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-600 font-bold border-t-2 border-slate-100 pt-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
              <span>Auto-synced with live IEEE Spectrum, EE Times &amp; SemiEngineering feeds on {new Date(lastSynced).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          )}
        </div>

        {/* ARTICLES FEED */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-3 border-slate-900 shadow-[5px_5px_0px_0px_#0F172A]">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3 stroke-[3]" />
            <p className="text-sm text-slate-900 font-black">Fetching Live Semiconductor Intelligence...</p>
          </div>
        ) : filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredArticles.map((article) => (
              <NewsCard key={article.id || article.slug} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border-3 border-slate-900 p-8 shadow-[5px_5px_0px_0px_#0F172A]">
            <Newspaper className="w-10 h-10 text-slate-400 mx-auto mb-3 stroke-[2.5]" />
            <h3 className="text-slate-900 font-black text-lg">No Articles Found</h3>
            <p className="text-slate-600 text-xs mt-1 font-semibold">Try clearing your search query or selecting &quot;All News&quot;.</p>
          </div>
        )}

      </div>
    </div>
  );
}
