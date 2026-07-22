"use client";

import { useEffect, useState, useCallback } from "react";
import type { NewsArticle } from "@/types";
import NewsCard from "@/components/NewsCard";
import SearchBar from "@/components/SearchBar";
import { Loader2, RefreshCw, Newspaper, Sparkles } from "lucide-react";

const TABS = [
  { label: "All News", value: "" },
  { label: "Semiconductor Fabs", value: "Semiconductor" },
  { label: "VLSI Design", value: "VLSI" },
  { label: "AI Chips", value: "AI Chips" },
  { label: "Academic Research", value: "Research" },
  { label: "India Mission", value: "India" },
  { label: "Industry Updates", value: "Industry" },
];

const FALLBACK_ARTICLES: NewsArticle[] = [
  {
    id: "fb-1",
    title: "India Semiconductor Mission Approves $15B Chip Fab Projects in Gujarat and Assam",
    slug: "india-semiconductor-mission-approves-15b-chip-fab-projects-2026",
    source: "India Semiconductor Mission",
    source_url: "https://ism.gov.in/news",
    published_at: new Date().toISOString(),
    summary: "The Cabinet approves major semiconductor fabrication and packaging plants led by Tata Electronics, CG Power, and Micron to accelerate India silicon self-reliance.",
    tags: ["India", "Semiconductor", "Industry", "Jobs"],
  },
  {
    id: "fb-2",
    title: "TSMC Begins Risk Production for 2nm N2 Node featuring Nanosheet GAA Transistors",
    slug: "tsmc-begins-risk-production-2nm-n2-node-gaa-2026",
    source: "Semiconductor Engineering",
    source_url: "https://semiengineering.com/2nm-nanosheet-gaa-manufacturing-challenges/",
    published_at: new Date(Date.now() - 86400000).toISOString(),
    summary: "TSMC confirms N2 process node yield milestones, delivering 15% speed performance improvement and 30% power reduction over 3nm FinFET.",
    tags: ["Semiconductor", "VLSI", "AI Chips", "Research"],
  },
  {
    id: "fb-3",
    title: "ISRO and IIT Madras Release Open-Source RISC-V Microprocessor for Space Payloads",
    slug: "isro-iit-madras-release-open-source-risc-v-microprocessor-space",
    source: "IEEE Spectrum",
    source_url: "https://spectrum.ieee.org/risc-v-space-processors",
    published_at: new Date(Date.now() - 172800000).toISOString(),
    summary: "The SHAKTI processor team at IIT Madras partners with ISRO SAC to deploy fault-tolerant RISC-V cores in upcoming Earth observation satellites.",
    tags: ["India", "VLSI", "Research", "Jobs"],
  },
  {
    id: "fb-4",
    title: "Cadence and Synopsys Launch Generative AI EDA Tools for Automated Physical Layout & STA",
    slug: "cadence-synopsys-launch-generative-ai-eda-tools-layout-sta",
    source: "EE Times",
    source_url: "https://www.eetimes.com/ai-driven-eda-tools-redefine-chip-layout/",
    published_at: new Date(Date.now() - 259200000).toISOString(),
    summary: "New AI-assisted electronic design automation software slashes Place & Route execution time by 40% and automates DRC/LVS error fixing.",
    tags: ["VLSI", "AI Chips", "Industry"],
  },
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

      if (data && Array.isArray(data.articles) && data.articles.length > 0) {
        setArticles(data.articles);
      } else {
        setArticles(FALLBACK_ARTICLES);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      setArticles(FALLBACK_ARTICLES);
    } finally {
      setLoading(false);
    }
  }, [search, activeTag]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* NEWS HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-2xs">
              <Newspaper className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Semiconductor & VLSI News
              </h1>
              <p className="text-slate-600 text-sm mt-0.5">
                Daily updates from IEEE Spectrum, EE Times, and Semiconductor Engineering.
              </p>
            </div>
          </div>
          <button
            onClick={fetchNews}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            Refresh Feed
          </button>
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
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

        {/* SEARCH BAR */}
        <div className="mb-8 max-w-md">
          <SearchBar
            onSearch={setSearch}
            placeholder="Search IEEE, TSMC, ISRO news..."
          />
        </div>

        {/* ARTICLES FEED */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm text-slate-600 font-medium">Loading IEEE & Semiconductor feed...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(articles.length > 0 ? articles : FALLBACK_ARTICLES).map((article) => (
              <NewsCard key={article.id || article.slug} article={article} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
