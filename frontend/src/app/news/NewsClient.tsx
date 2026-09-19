"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { NewsArticle } from "@/types";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import {
  Sparkles,
  ListFilter,
  Megaphone,
  Lightbulb,
  Award,
  BarChart3,
  Calendar,
  Flame,
  Mail,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  X,
  Clock,
  Newspaper,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface NewsClientProps {
  initialArticles?: NewsArticle[];
  initialLastSynced?: string | null;
}

const CATEGORY_TABS = [
  { label: "All News", value: "", icon: ListFilter },
  { label: "Semiconductors & Fabs", value: "Semiconductor", icon: BarChart3 },
  { label: "VLSI & Chip Design", value: "VLSI", icon: Award },
  { label: "Embedded & Firmware", value: "Embedded", icon: Lightbulb },
  { label: "Defence & Space", value: "Defence", icon: Megaphone },
  { label: "Research & IEEE", value: "Research", icon: Calendar },
];

const TRENDING_TOPICS = [
  { id: 1, title: "India Semiconductor Mission", query: "Semiconductor" },
  { id: 2, title: "RISC-V Architecture", query: "RISC-V" },
  { id: 3, title: "VLSI Physical Design", query: "VLSI" },
  { id: 4, title: "ISRO Payload Systems", query: "ISRO" },
  { id: 5, title: "Silicon Photonics & AI Chips", query: "Chip" },
];

import { resolveHardwareNewsImage, resolveNewsDomainBadge } from "@/lib/hardware-images";

function getArticleImage(article: NewsArticle, index: number): string {
  return resolveHardwareNewsImage(article, index);
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

function getCategoryBadge(article: NewsArticle) {
  const badge = resolveNewsDomainBadge(article);
  return { label: badge.label, color: badge.badgeClass };
}

export default function NewsClient({
  initialArticles = [],
  initialLastSynced = null,
}: NewsClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Close modal on escape
  useEffect(() => {
    if (!selectedArticle) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedArticle(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    closeBtnRef.current?.focus();
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedArticle]);

  // Filter articles
  const filteredArticles = useMemo(() => {
    return initialArticles.filter((art) => {
      const matchesCategory =
        !selectedCategory ||
        art.tags?.some((t) => t.toLowerCase().includes(selectedCategory.toLowerCase())) ||
        art.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        (art.summary && art.summary.toLowerCase().includes(selectedCategory.toLowerCase()));

      const matchesSearch =
        !searchQuery ||
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (art.summary && art.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
        art.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [initialArticles, selectedCategory, searchQuery]);

  // Featured articles: top 3 articles
  const featuredArticles = useMemo(() => {
    if (filteredArticles.length >= 3) return filteredArticles.slice(0, 3);
    if (initialArticles.length >= 3) return initialArticles.slice(0, 3);
    return filteredArticles;
  }, [filteredArticles, initialArticles]);

  // Latest articles: remaining articles paginated 6 per page
  const latestArticlesList = useMemo(() => {
    const list = filteredArticles.length > 3 ? filteredArticles.slice(3) : filteredArticles;
    return list;
  }, [filteredArticles]);

  const itemsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(latestArticlesList.length / itemsPerPage));
  const displayedLatestArticles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return latestArticlesList.slice(start, start + itemsPerPage);
  }, [latestArticlesList, currentPage]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!agreeTerms) {
      toast.error("Please agree to receive updates.");
      return;
    }
    toast.success("Thank you for subscribing to BerojgarDegreeWala news!");
    setNewsletterEmail("");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>NEWS &amp; UPDATES</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
              Stay Informed.{" "}
              <span className="text-blue-600 block sm:inline">Stay Ahead.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl">
              Latest news, announcements, career tips and insights to help you make the most of every opportunity.
            </p>
          </div>

          {/* Right Column: Hero Image with Cursive Badge */}
          <div className="lg:col-span-5">
            <div className="relative w-full h-[280px] sm:h-[320px] lg:h-[350px] rounded-3xl overflow-hidden shadow-xl border border-slate-100 bg-slate-100">
              <Image
                src="/images/hardware/semiconductor-cleanroom-fab.jpg"
                alt="Silicon & Hardware Intelligence with BerojgarDegreeWala"
                fill
                priority
                unoptimized
                className="object-cover"
              />

              {/* Floating cursive accent badge */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-lg border border-white/60 text-right">
                <p className="font-serif italic text-blue-950 text-base sm:text-lg font-bold leading-tight">
                  Silicon Intelligence.
                </p>
                <p className="font-serif italic text-blue-600 text-base sm:text-lg font-bold leading-tight">
                  Deep-Tech Real-Time.
                </p>
                <div className="w-20 h-1 bg-amber-400 rounded-full mt-1.5 ml-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY TABS PILL BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedCategory === tab.value;
            return (
              <button
                key={tab.label}
                onClick={() => {
                  setSelectedCategory(tab.value);
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80 shadow-2xs"
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. FEATURED NEWS & TRENDING TOPICS SIDEBAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Featured News Section (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Featured News
              </h2>
              <button
                onClick={() => setSelectedCategory("")}
                className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
              >
                <span>View all featured</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {featuredArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Big Featured Card (7 cols on md) */}
                {featuredArticles[0] && (
                  <div
                    onClick={() => setSelectedArticle(featuredArticles[0])}
                    className="md:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="relative w-full h-56 rounded-xl overflow-hidden mb-4 bg-slate-100">
                        <ImageWithFallback
                          src={getArticleImage(featuredArticles[0], 0)}
                          alt={featuredArticles[0].title}
                          variant="editorial"
                          width={600}
                          height={280}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Date badge */}
                        <div className="absolute top-3 right-3 bg-slate-900/70 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(featuredArticles[0].published_at)}</span>
                        </div>
                        {/* Category pill */}
                        <div className="absolute bottom-3 left-3">
                          <span className={`text-white text-[11px] font-bold px-3 py-1 rounded-md backdrop-blur-xs uppercase tracking-wider shadow-sm ${getCategoryBadge(featuredArticles[0]).color}`}>
                            {getCategoryBadge(featuredArticles[0]).label}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-slate-900 text-lg sm:text-xl font-bold leading-snug group-hover:text-blue-600 transition-colors mb-2.5 line-clamp-2">
                        {featuredArticles[0].title}
                      </h3>

                      <p className="text-slate-600 text-xs sm:text-sm font-normal leading-relaxed line-clamp-3 mb-4">
                        {featuredArticles[0].summary ||
                          "Indian Space Research Organisation (ISRO) has launched a new fellowship program to support young researchers in space technology and hardware design."}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center text-blue-600 group-hover:text-blue-700 gap-1.5">
                        <span>Read Executive Briefing</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                      {(featuredArticles[0].source_url || (featuredArticles[0] as any).url) && (
                        <a
                          href={featuredArticles[0].source_url || (featuredArticles[0] as any).url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-2.5 py-1 rounded-md border border-slate-200 transition"
                          title="Open official publisher source"
                        >
                          <span>{featuredArticles[0].source || (featuredArticles[0] as any).source_name || "Official Source"}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* 2 Stacked Cards (5 cols on md) */}
                <div className="md:col-span-5 flex flex-col gap-6">
                  {/* Card 2 */}
                  {featuredArticles[1] && (
                    <div
                      onClick={() => setSelectedArticle(featuredArticles[1])}
                      className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group cursor-pointer flex-1"
                    >
                      <div>
                        <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3 bg-slate-100">
                          <ImageWithFallback
                            src={getArticleImage(featuredArticles[1], 1)}
                            alt={featuredArticles[1].title}
                            variant="editorial"
                            width={400}
                            height={180}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2.5 right-2.5 bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{formatDate(featuredArticles[1].published_at)}</span>
                          </div>
                          <div className="absolute bottom-2.5 left-2.5">
                            <span className={`text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md backdrop-blur-xs uppercase tracking-wider shadow-sm ${getCategoryBadge(featuredArticles[1]).color}`}>
                              {getCategoryBadge(featuredArticles[1]).label}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-slate-900 text-sm sm:text-base font-bold leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                          {featuredArticles[1].title}
                        </h3>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center text-blue-600 group-hover:text-blue-700 gap-1.5">
                          <span>Read Briefing</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                        {(featuredArticles[1].source_url || (featuredArticles[1] as any).url) && (
                          <a
                            href={featuredArticles[1].source_url || (featuredArticles[1] as any).url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-2 py-0.5 rounded-md border border-slate-200 transition"
                            title="Open official publisher source"
                          >
                            <span className="truncate max-w-[80px]">{featuredArticles[1].source || (featuredArticles[1] as any).source_name || "Source"}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Card 3 */}
                  {featuredArticles[2] && (
                    <div
                      onClick={() => setSelectedArticle(featuredArticles[2])}
                      className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group cursor-pointer flex-1"
                    >
                      <div>
                        <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3 bg-slate-100">
                          <ImageWithFallback
                            src={getArticleImage(featuredArticles[2], 2)}
                            alt={featuredArticles[2].title}
                            variant="editorial"
                            width={400}
                            height={180}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2.5 right-2.5 bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{formatDate(featuredArticles[2].published_at)}</span>
                          </div>
                          <div className="absolute bottom-2.5 left-2.5">
                            <span className={`text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md backdrop-blur-xs uppercase tracking-wider shadow-sm ${getCategoryBadge(featuredArticles[2]).color}`}>
                              {getCategoryBadge(featuredArticles[2]).label}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-slate-900 text-sm sm:text-base font-bold leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                          {featuredArticles[2].title}
                        </h3>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center text-blue-600 group-hover:text-blue-700 gap-1.5">
                          <span>Read Briefing</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                        {(featuredArticles[2].source_url || (featuredArticles[2] as any).url) && (
                          <a
                            href={featuredArticles[2].source_url || (featuredArticles[2] as any).url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-2 py-0.5 rounded-md border border-slate-200 transition"
                            title="Open official publisher source"
                          >
                            <span className="truncate max-w-[80px]">{featuredArticles[2].source || (featuredArticles[2] as any).source_name || "Source"}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Right: Sidebar Widgets (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Widget 1: Trending Topics */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                  <Flame className="w-4 h-4 fill-red-500 text-red-500" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Trending Topics</h3>
              </div>

              <div className="space-y-3">
                {TRENDING_TOPICS.map((topic, index) => (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setSearchQuery(topic.query);
                      setCurrentPage(1);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          index === 0
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {topic.id}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-blue-600 truncate transition-colors">
                        {topic.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Widget 2: Get the Latest Updates (Newsletter) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white mb-3 shadow-sm shadow-blue-600/20">
                <Mail className="w-5 h-5" />
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1">
                Get the Latest Updates
              </h3>
              <p className="text-xs text-slate-600 font-normal leading-relaxed mb-4">
                Subscribe to our newsletter and never miss an important update.
              </p>

              <form onSubmit={handleSubscribe} className="space-y-3">
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email address"
                    aria-label="Email address"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Subscribe
                </button>

                <label className="flex items-start gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-500 font-normal leading-tight">
                    I agree to receive updates from BerojgarDegreeWala.
                  </span>
                </label>
              </form>
            </div>

            {/* Widget 3: Inspirational Quote Card */}
            <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/50 border border-blue-100 rounded-2xl p-6 shadow-2xs relative overflow-hidden">
              <div className="text-4xl font-serif text-blue-600 font-bold leading-none mb-2">
                “
              </div>
              <p className="font-serif italic text-blue-950 text-sm sm:text-base font-semibold leading-relaxed mb-3">
                &ldquo;Knowledge is the bridge between today and a brighter tomorrow.&rdquo;
              </p>
              {/* Yellow brush stroke */}
              <div className="w-24 h-1 bg-amber-400 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. LATEST NEWS & UPDATES (3-COL GRID) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Latest News &amp; Updates
          </h2>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("");
            }}
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
          >
            <span>View all news</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {displayedLatestArticles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedLatestArticles.map((article, index) => {
              const badge = getCategoryBadge(article);
              return (
                <div
                  key={article.id || article.slug || index}
                  onClick={() => setSelectedArticle(article)}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    {/* Top Image */}
                    <div className="relative w-full h-44 rounded-xl overflow-hidden mb-3.5 bg-slate-100">
                      <ImageWithFallback
                        src={getArticleImage(article, index + 3)}
                        alt={article.title}
                        variant="editorial"
                        width={450}
                        height={220}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Meta Row: Category Badge + Date */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border uppercase tracking-wider ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        {formatDate(article.published_at)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-slate-900 text-sm sm:text-base font-bold leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                      {article.title}
                    </h3>

                    {/* Summary */}
                    {article.summary && (
                      <p className="text-slate-500 text-xs font-normal leading-relaxed line-clamp-2 mb-3">
                        {article.summary}
                      </p>
                    )}
                  </div>

                  {/* Read More Link & Official Source Link */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center text-blue-600 group-hover:text-blue-700 gap-1.5">
                      <span>Read Briefing</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                    {(article.source_url || (article as any).url) && (
                      <a
                        href={article.source_url || (article as any).url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-2 py-0.5 rounded-md border border-slate-200 transition"
                        title={`Open official publisher source: ${article.source || (article as any).source_name || "Official Source"}`}
                      >
                        <span className="truncate max-w-[90px]">{article.source || (article as any).source_name || "Source"}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
            <Newspaper className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">No articles found</h3>
            <p className="text-xs text-slate-500 mb-4">
              Try adjusting your category filter or search keywords.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("");
                setSearchQuery("");
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* 5. NUMBERED PAGINATION */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-10">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNum = i + 1;
              const isActive = currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {totalPages > 5 && (
              <>
                <span className="px-1 text-slate-400 text-xs">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition ${
                    currentPage === totalPages
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>
      {/* 6. HARDWARE RADAR CTA SECTION (No fake app store claims) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-gradient-to-r from-blue-50/90 via-sky-50/60 to-indigo-50/80 border border-blue-200/80 rounded-3xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="w-10 h-1 bg-blue-600 rounded-full" />
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                Track India&apos;s Silicon Revolution{" "}
                <span className="text-blue-600">In Real Time</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-lg">
                Verified research calls, fab hiring sprees, and hardware grants from ISRO, DRDO, Micron, and premier semiconductor labs — refreshed directly via automated scrapers.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/opportunities"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition shadow-md shadow-blue-600/20"
                >
                  <span>Explore Hardware Opportunities</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/resources"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 shadow-2xs transition"
                >
                  <span>VLSI &amp; Embedded Roadmaps</span>
                </Link>
              </div>
            </div>

            {/* Right: Real Intelligence Features card */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-xs bg-white rounded-3xl shadow-xl border border-slate-200/90 p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-xs text-white font-bold">
                      B
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block leading-tight">BDW Career Intelligence</span>
                      <span className="text-[10px] text-slate-400">Deep-Tech Hardware Verified</span>
                    </div>
                  </div>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 text-xs font-semibold text-blue-900 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Direct ATS Scrapers (ISRO, DRDO, CSIR)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-medium text-slate-700 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Real-time Semiconductor &amp; VLSI Openings</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-medium text-slate-700 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Zero Spam &bull; Zero Dead Links</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-center">
                  <p className="font-serif italic text-blue-600 text-xs font-bold">
                    Built for India&apos;s Hardware Engineers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. ARTICLE DETAIL READING MODAL */}
      {selectedArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedArticle(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={selectedArticle.title}
        >
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto p-6 sm:p-8 relative">
            <button
              ref={closeBtnRef}
              onClick={() => setSelectedArticle(null)}
              className="absolute top-5 right-5 p-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-2.5 mb-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg text-xs font-bold text-blue-700">
                <Newspaper className="w-3.5 h-3.5 text-blue-600" />
                <span>{selectedArticle.source || "Official Source"}</span>
              </span>

              {selectedArticle.published_at && (
                <span className="text-slate-500 text-xs font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(selectedArticle.published_at)}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 leading-snug">
              {selectedArticle.title}
            </h2>

            {/* Modal Image */}
            <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden mb-6 bg-slate-100">
              <ImageWithFallback
                src={getArticleImage(selectedArticle, 0)}
                alt={selectedArticle.title}
                variant="editorial"
                width={700}
                height={350}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Article Content / Summary */}
            <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-line mb-6">
              {selectedArticle.summary ||
                "Detailed report and official announcement circulars published through accredited education and technology channels."}
            </div>

            {/* Tags */}
            {selectedArticle.tags && selectedArticle.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {selectedArticle.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Modal Actions */}
            {(() => {
              const modalSourceUrl = selectedArticle.source_url || (selectedArticle as any).url;
              const modalSourceName = selectedArticle.source || (selectedArticle as any).source_name || "Official Source";
              return (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-5 border-t border-slate-100">
                  {modalSourceUrl ? (
                    <a
                      href={modalSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-md shadow-blue-600/20"
                    >
                      <span>Read Full Article on {modalSourceName}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <span />
                  )}
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-center"
                  >
                    Close
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
