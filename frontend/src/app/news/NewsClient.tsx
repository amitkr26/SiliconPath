"use client";

import { useEffect, useState, useCallback } from "react";
import type { NewsArticle } from "@/types";
import NewsCard from "@/components/NewsCard";
import SearchBar from "@/components/SearchBar";
import { Loader2, RefreshCw, Newspaper, Sparkles, Zap, CheckCircle2, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const CATEGORY_TABS = [
  { label: "All News", value: "" },
  { label: "Semiconductor Fabs", value: "Semiconductor" },
  { label: "VLSI & RTL Design", value: "VLSI" },
  { label: "AI Chips & Hardware", value: "AI Chips" },
  { label: "Academic Research & JRF", value: "Research" },
  { label: "India Mission ($15B)", value: "India" },
];

interface NewsClientProps {
  initialArticles?: NewsArticle[];
  initialLastSynced?: string | null;
}

export default function NewsClient({
  initialArticles = [],
  initialLastSynced = null,
}: NewsClientProps) {
  const [articles, setArticles] = useState<NewsArticle[]>(initialArticles);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
  const [lastSynced, setLastSynced] = useState<string | null>(initialLastSynced);

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

  // Only re-fetch if user interacts with search or tag
  useEffect(() => {
    if (search || activeTag) {
      fetchNews();
    }
  }, [search, activeTag, fetchNews]);

  const filteredArticles = articles.filter((art) => {
    if (viewMode === "monthly") {
      return (
        art.summary?.toLowerCase().includes("digest") ||
        art.summary?.toLowerCase().includes("analysis") ||
        (art as any).is_breaking
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-bg-primary py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HERO BANNER */}
        <div className="p-6 sm:p-8 rounded-2xl bg-blue-600 border-2 border-slate-900 text-white shadow-brutal-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white border-2 border-slate-900 text-slate-900 rounded-lg text-xs font-black shadow-brutal-sm">
                <Sparkles className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                <span>DAILY &amp; MONTHLY LIVE AGGREGATION ENGINE</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Semiconductor &amp; VLSI Industry Intelligence
              </h1>
              <p className="text-blue-50 text-xs sm:text-sm font-medium leading-relaxed">
                Live automated feeds from IEEE Spectrum, EE Times, and Semiconductor Engineering. Real-time updates on India Semiconductor Mission ($15B Fabs), TSMC 2nm N2 GAA, Intel 18A, and academic research circulars.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
              <Button
                variant="secondary"
                onClick={handleForceSync}
                disabled={syncing}
              >
                {syncing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-400 stroke-[2]" />
                )}
                <span>{syncing ? "Syncing Live RSS..." : "Sync Daily Live Feeds"}</span>
              </Button>

              <Button
                variant="secondary"
                className="bg-blue-700 hover:bg-blue-800 text-white"
                onClick={fetchNews}
              >
                <RefreshCw className="w-4 h-4 text-white stroke-[2.5]" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* FREQUENCY VIEW SWITCHER & SEARCH */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* VIEW MODE TOGGLE BUTTONS */}
            <div className="inline-flex items-center gap-1 p-1.5 bg-slate-100 border-2 border-slate-900 rounded-full shadow-brutal-sm">
              <button
                onClick={() => setViewMode("daily")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all",
                  viewMode === "daily"
                    ? "bg-blue-600 text-white border-2 border-slate-900 shadow-brutal-sm"
                    : "text-slate-700 hover:text-slate-900"
                )}
              >
                <Clock className="w-4 h-4 stroke-[2.5]" /> Daily Live Feed
              </button>
              <button
                onClick={() => setViewMode("monthly")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all",
                  viewMode === "monthly"
                    ? "bg-blue-600 text-white border-2 border-slate-900 shadow-brutal-sm"
                    : "text-slate-700 hover:text-slate-900"
                )}
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

          {/* MOBILE CATEGORY SELECT */}
          <div className="mt-5 sm:hidden">
            <label htmlFor="news-category-select" className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Filter by Category
            </label>
            <select
              id="news-category-select"
              value={activeTag}
              onChange={(e) => setActiveTag(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 shadow-brutal-sm outline-none"
            >
              {CATEGORY_TABS.map((tab) => (
                <option key={tab.value} value={tab.value}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>

          {/* DESKTOP CATEGORY TABS */}
          <div className="hidden sm:flex gap-2.5 mt-6 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTag(tab.value)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border-2 border-slate-900 transition-all",
                  activeTag === tab.value
                    ? "bg-blue-600 text-white shadow-brutal-sm"
                    : "bg-white text-slate-800 hover:bg-slate-100"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {lastSynced && (
            <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-600 font-semibold border-t-2 border-slate-100 pt-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
              <span>
                Auto-synced with live IEEE Spectrum, EE Times &amp; SemiEngineering feeds on{" "}
                {new Date(lastSynced).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </Card>

        {/* ARTICLES FEED */}
        {loading ? (
          <Card className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3 stroke-[3]" />
            <p className="text-sm text-slate-900 font-black">Fetching Live Semiconductor Intelligence...</p>
          </Card>
        ) : filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredArticles.map((article) => (
              <NewsCard key={article.id || article.slug} article={article} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-16 p-8">
            <Newspaper className="w-10 h-10 text-slate-400 mx-auto mb-3 stroke-[2.5]" />
            <h3 className="text-slate-900 font-black text-lg">No Articles Found</h3>
            <p className="text-slate-600 text-xs mt-1 font-medium">
              Try clearing your search query or selecting &quot;All News&quot;.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
