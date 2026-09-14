"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Opportunity } from "@/types";
import OpportunityCard from "@/components/OpportunityCard";
import CategoryBadge from "@/components/CategoryBadge";
import DeadlineCountdown from "@/components/DeadlineCountdown";
import VerificationBadge from "@/components/VerificationBadge";
import { Loader2, Search, X, MapPin, IndianRupee, ExternalLink, ShieldCheck, Filter, ChevronDown } from "lucide-react";
import { cn, getDaysUntilDeadline, isExpired } from "@/lib/utils";

const QUICK_FILTERS = [
  { label: "Fresher First", experience: "Fresher" },
  { label: "Closing Soon", sort: "closing_soon" },
  { label: "VLSI RTL", search: "RTL" },
  { label: "Research/JRF", category: "jrf" },
  { label: "Govt/PSU", category: "government" },
];

const DOMAIN_OPTIONS = [
  { value: "All", label: "All Domains" },
  { value: "RTL", label: "VLSI RTL Design" },
  { value: "Verification", label: "Verification (UVM)" },
  { value: "Physical Design", label: "Physical Design" },
  { value: "Embedded", label: "Embedded Systems" },
  { value: "Analog", label: "Analog/Mixed-Signal" },
  { value: "DFT", label: "DFT" },
];

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function getLocalBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("BerojgarDegreeWala_bookmarks");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export default function OpportunitiesClient({ initialData }: { initialData: Opportunity[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearchParam = searchParams.get("search") || "";
  const initialCategoryParam = searchParams.get("category") || "All";
  const initialExperienceParam = searchParams.get("experience") || "All";

  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState(initialCategoryParam);
  const [eligibility, setEligibility] = useState("All");
  const [location, setLocation] = useState("All");
  const [deadline, setDeadline] = useState("All");
  const [experience, setExperience] = useState(initialExperienceParam);
  const [sort, setSort] = useState("fresher");
  const [search, setSearch] = useState(initialSearchParam);
  const [showUnverified, setShowUnverified] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(initialData.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const requestToken = useRef(0);
  const [matchInfo, setMatchInfo] = useState<{ type?: string; query?: string }>({});

  useEffect(() => {
    const s = searchParams.get("search") || "";
    const c = searchParams.get("category") || "All";
    const e = searchParams.get("experience") || "All";
    setSearch(s);
    setCategory(c);
    setExperience(e);
  }, [searchParams]);

  const fetchOpportunities = useCallback(async (pageNum = 1, append = false) => {
    const token = ++requestToken.current;
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      if (category && category !== "All") params.set("category", category);
      if (eligibility && eligibility !== "All") params.set("eligibility", eligibility);
      if (location && location !== "All") params.set("location", location);
      if (deadline && deadline !== "All") params.set("deadline", deadline);
      if (experience && experience !== "All") params.set("experience", experience);
      if (sort && sort !== "fresher") params.set("sort", sort);
      if (search) params.set("search", search);
      if (showUnverified) params.set("verified", "all");
      if (pageNum > 1) params.set("page", String(pageNum));

      const res = await fetch(`/api/opportunities?${params}`);
      const data = await res.json();
      if (token !== requestToken.current) return;

      if (data.opportunities) {
        setOpportunities((prev) =>
          append
            ? Array.from(new Map([...prev, ...data.opportunities].map((o: Opportunity) => [o.id, o])).values())
            : data.opportunities
        );
        setTotalPages(data.total_pages || 1);
        setTotalCount(data.total_count || data.opportunities.length);
        setPage(data.page || pageNum);
        setMatchInfo({ type: data.match_type, query: data.matched_query });
      } else {
        setOpportunities([]);
        setTotalPages(1);
        setTotalCount(0);
        setMatchInfo({});
      }
    } catch (error) {
      if (token !== requestToken.current) return;
      console.error("Error fetching opportunities:", error);
      setOpportunities([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [category, eligibility, location, deadline, experience, sort, search, showUnverified]);

  useEffect(() => {
    fetchOpportunities(1);
  }, [category, eligibility, location, deadline, experience, sort, search, showUnverified, fetchOpportunities]);

  useEffect(() => {
    if (page > 1) fetchOpportunities(page, true);
  }, [page, fetchOpportunities]);

  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = { All: opportunities.length };
    for (const opp of opportunities) {
      const tags = opp.tags || [];
      for (const tag of tags) {
        const normalized = tag.toLowerCase();
        if (normalized.includes("rtl") || normalized.includes("verilog") || normalized.includes("vhdl")) {
          counts["RTL"] = (counts["RTL"] || 0) + 1;
        }
        if (normalized.includes("verification") || normalized.includes("uvm")) {
          counts["Verification"] = (counts["Verification"] || 0) + 1;
        }
        if (normalized.includes("physical") || normalized.includes("layout")) {
          counts["Physical Design"] = (counts["Physical Design"] || 0) + 1;
        }
        if (normalized.includes("embedded") || normalized.includes("firmware")) {
          counts["Embedded"] = (counts["Embedded"] || 0) + 1;
        }
      }
      const cat = (opp.category || "").toLowerCase();
      if (cat.includes("jrf") || cat.includes("research")) {
        counts["Research/JRF"] = (counts["Research/JRF"] || 0) + 1;
      }
    }
    return counts;
  }, [opportunities]);

  const activeQuickFilter = useMemo(() => {
    if (experience === "Fresher") return "Fresher First";
    if (sort === "closing_soon") return "Closing Soon";
    if (search.toLowerCase() === "rtl") return "VLSI RTL";
    if (category === "jrf") return "Research/JRF";
    if (category === "government") return "Govt/PSU";
    return null;
  }, [experience, sort, search, category]);

  const handleQuickFilter = (filter: (typeof QUICK_FILTERS)[number]) => {
    if (activeQuickFilter === filter.label) {
      setExperience("All");
      setSort("fresher");
      setSearch("");
      setCategory("All");
    } else {
      if (filter.experience) setExperience(filter.experience);
      else setExperience("All");
      if (filter.sort) setSort(filter.sort);
      else setSort("fresher");
      if (filter.search) setSearch(filter.search);
      else setSearch("");
      if (filter.category) setCategory(filter.category);
      else if (!filter.search) setCategory("All");
    }
  };

  const resetAll = () => {
    setCategory("All");
    setEligibility("All");
    setLocation("All");
    setDeadline("All");
    setExperience("All");
    setSort("fresher");
    setSearch("");
  };

  const hasActiveFilters = category !== "All" || eligibility !== "All" || location !== "All" || deadline !== "All" || experience !== "All" || search;

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Opportunities</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse verified semiconductor, VLSI, and research opportunities across Indian deep-tech labs &amp; industries.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search opportunities by title, organization, or keyword..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {QUICK_FILTERS.map((filter) => (
                <button
                  key={filter.label}
                  onClick={() => handleQuickFilter(filter)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    activeQuickFilter === filter.label
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-xs"
                  )}
                >
                  {filter.label}
                </button>
              ))}
              {hasActiveFilters && (
                <button
                  onClick={resetAll}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="lg:hidden flex items-center justify-between w-full px-3 py-2 mb-4 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs"
            >
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" /> Filters
              </span>
              <ChevronDown className={cn("w-4 h-4 transition-transform text-slate-400", mobileFiltersOpen && "rotate-180")} />
            </button>

            {/* Mobile Filters Panel */}
            {mobileFiltersOpen && (
              <div className="lg:hidden bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-4 shadow-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Domain</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    {DOMAIN_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Sort by</label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="fresher">Fresher Relevance</option>
                    <option value="closing_soon">Closing Soon</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>
              </div>
            )}

            {/* Results Count */}
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              {loading ? "Loading opportunities..." : `${totalCount} verified active positions`}
            </p>

            {/* Opportunity Cards Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
              </div>
            ) : opportunities.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-card">
                <p className="text-slate-900 font-bold text-base">No opportunities match your current filters</p>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your filters, location, or search keywords</p>
                <button
                  onClick={resetAll}
                  className="mt-4 px-4 py-2 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opportunities.map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} compact />
                ))}
              </div>
            )}

            {/* Load More */}
            {!loading && page < totalPages && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loadingMore}
                  className="px-6 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-xs transition-all disabled:opacity-50"
                >
                  {loadingMore ? "Loading more..." : "Load more opportunities"}
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Quick Filters */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">Quick Filters</h3>
                <div className="space-y-1">
                  {QUICK_FILTERS.map((filter) => (
                    <button
                      key={filter.label}
                      onClick={() => handleQuickFilter(filter)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                        activeQuickFilter === filter.label
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Domain Stats */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">Domain Distribution</h3>
                <div className="space-y-2">
                  {Object.entries(domainCounts)
                    .filter(([, count]) => count > 0)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([domain, count]) => (
                      <div key={domain} className="flex items-center justify-between">
                        <span className="text-xs text-slate-600 font-medium">{domain}</span>
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Refine Filters */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Refine Search</h3>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Eligibility</label>
                  <select
                    value={eligibility}
                    onChange={(e) => setEligibility(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="All">All Eligibility</option>
                    <option value="B.Tech">B.Tech</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="PhD">PhD</option>
                    <option value="M.Sc">M.Sc</option>
                    <option value="B.Sc">B.Sc</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Any Graduate">Any Graduate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Location</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="All">All Locations</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Pune">Pune</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi / NCR">Delhi / NCR</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Remote / WFH">Remote / WFH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Deadline Window</label>
                  <select
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="All">Any Deadline</option>
                    <option value="Within 7 days">Within 7 days</option>
                    <option value="Within 14 days">Within 14 days</option>
                    <option value="Within 30 days">Within 30 days</option>
                  </select>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
