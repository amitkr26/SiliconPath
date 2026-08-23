"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { Opportunity } from "@/types";
import OpportunityCard from "@/components/OpportunityCard";
import OpportunityRow from "@/components/OpportunityRow";
import FilterBar from "@/components/FilterBar";
import SearchBar from "@/components/SearchBar";
import { Loader2, Sparkles, X, Filter, LayoutGrid, List, ArrowDownUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function OpportunitiesClient({ initialData }: { initialData: Opportunity[] }) {
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

  useEffect(() => {
    const s = searchParams.get("search") || "";
    const c = searchParams.get("category") || "All";
    const e = searchParams.get("experience") || "All";
    setSearch(s);
    setCategory(c);
    setExperience(e);
  }, [searchParams]);

  const [showUnverified, setShowUnverified] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "row">("row");
  const [aiChips, setAiChips] = useState<Record<string, string>>({});
  const [aiSearching, setAiSearching] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(initialData.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const lastAISearch = useRef("");

  const [matchInfo, setMatchInfo] = useState<{ type?: string; query?: string }>({});
  const requestToken = useRef(0);

  const fetchOpportunities = useCallback(async (pageNum = 1, append = false) => {
    const token = ++requestToken.current;
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams();
      if (category && category !== "All") params.set("category", category);
      if (eligibility && eligibility !== "All") params.set("eligibility", eligibility);
      if (location && location !== "All") params.set("location", location);
      if (deadline && deadline !== "All") params.set("deadline", deadline);
      if (experience && experience !== "All") params.set("experience", experience);
      if (sort && sort !== "fresher") params.set("sort", sort);
      if (search) params.set("search", search);
      if (showUnverified) {
        params.set("verified", "all");
      }
      if (pageNum > 1) params.set("page", String(pageNum));

      const res = await fetch(`/api/opportunities?${params}`);
      const data = await res.json();

      // Ignore stale responses
      if (token !== requestToken.current) return;

      if (data.opportunities) {
        setOpportunities((prev) =>
          append ? Array.from(new Map([...prev, ...data.opportunities].map((o: Opportunity) => [o.id, o])).values()) : data.opportunities
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

  const handleSearch = useCallback(async (query: string) => {
    setSearch(query);

    if (query.length > 5 && query !== lastAISearch.current) {
      lastAISearch.current = query;
      setAiSearching(true);
      try {
        const res = await fetch("/api/ai/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        if (res.ok) {
          const data = await res.json();
          const chips: Record<string, string> = {};
          if (data.filters?.category) chips.category = data.filters.category;
          if (data.filters?.location) chips.location = data.filters.location;
          if (data.filters?.eligibility) chips.eligibility = data.filters.eligibility;
          if (data.filters?.organization_hint) chips.organization = data.filters.organization_hint;
          setAiChips(chips);
        }
      } catch {
        // AI fallback
      } finally {
        setAiSearching(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchOpportunities(1);
  }, [category, eligibility, location, deadline, experience, sort, search, showUnverified, fetchOpportunities]);

  useEffect(() => {
    if (page > 1) fetchOpportunities(page, true);
  }, [page, fetchOpportunities]);

  return (
    <div className="min-h-screen bg-bg-primary py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HEADER SECTION */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Currently Active &amp; Verified Semiconductor &amp; VLSI Openings</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Jobs &amp; Opportunities</h1>
          <p className="text-slate-600 mt-1 text-xs sm:text-sm font-medium">Browse verified JRF, SRF, PhD admissions, DRDO, ISRO, CSIR, and premier VLSI industry roles with active application deadlines.</p>
        </div>

        <div className="flex gap-8">
          
          {/* DESKTOP SIDEBAR FILTERS */}
          <aside className="hidden lg:block w-[280px] flex-shrink-0">
            <div className="sticky top-20 z-10">
              <FilterBar
                selectedCategory={category}
                selectedEligibility={eligibility}
                selectedLocation={location}
                selectedDeadline={deadline}
                selectedExperience={experience}
                onCategoryChange={setCategory}
                onEligibilityChange={setEligibility}
                onLocationChange={setLocation}
                onDeadlineChange={setDeadline}
                onExperienceChange={setExperience}
              />
            </div>
          </aside>

          {/* MOBILE FILTER DRAWER */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowMobileFilters(false)} />
              <div className="absolute inset-y-0 right-0 w-[300px] bg-white border-l-2 border-slate-900 shadow-brutal-lg flex flex-col">
                <div className="flex items-center justify-between p-4 border-b-2 border-slate-900">
                  <h2 className="text-slate-900 font-bold text-base">Filter Opportunities</h2>
                  <button onClick={() => setShowMobileFilters(false)} className="text-slate-500 hover:text-slate-900">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                  <FilterBar
                    selectedCategory={category}
                    selectedEligibility={eligibility}
                    selectedLocation={location}
                    selectedDeadline={deadline}
                    selectedExperience={experience}
                    onCategoryChange={setCategory}
                    onEligibilityChange={setEligibility}
                    onLocationChange={setLocation}
                    onDeadlineChange={setDeadline}
                    onExperienceChange={setExperience}
                  />
                </div>
                <div className="p-4 border-t-2 border-slate-900">
                  <Button onClick={() => setShowMobileFilters(false)} className="w-full">
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* MAIN RESULTS FEED */}
          <div className="flex-1 min-w-0">
            
            {/* SEARCH & CONTROLS BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div className="flex-1">
                <SearchBar value={search} onChange={setSearch} onSearch={handleSearch} />
                {aiSearching && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-blue-600 font-medium">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>AI parsing query parameters...</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* SORT DROPDOWN */}
                <div className="flex items-center gap-1 bg-white border-2 border-slate-900 rounded-xl px-3 py-1.5 shadow-brutal-sm text-xs font-bold">
                  <ArrowDownUp className="w-3.5 h-3.5 text-blue-600" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    aria-label="Sort opportunities"
                    className="bg-transparent text-slate-900 font-bold focus:outline-hidden cursor-pointer"
                  >
                    <option value="fresher">Fresher Relevance</option>
                    <option value="closing_soon">Closing Soon</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border-2 border-slate-900 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex-1 justify-center shadow-brutal-sm"
                >
                  <Filter className="w-4 h-4 text-blue-600" />
                  Filters
                </button>
                <button
                  onClick={() => setViewMode(viewMode === "card" ? "row" : "card")}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border-2 border-slate-900 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-brutal-sm"
                  title="Toggle Grid / List View"
                >
                  {viewMode === "card" ? <List className="w-4 h-4 text-blue-600" /> : <LayoutGrid className="w-4 h-4 text-blue-600" />}
                </button>
              </div>
            </div>

            {/* DOMAIN & FRESHER SHORTCUT PILLS */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              <span className="text-[11px] font-black uppercase text-slate-500 shrink-0 mr-1">
                Domain:
              </span>
              {[
                { name: "All", searchVal: "", catVal: "All", expVal: "All" },
                { name: "🎓 Fresher First", searchVal: "", catVal: "All", expVal: "Fresher" },
                { name: "⚡ VLSI RTL", searchVal: "RTL", catVal: "All", expVal: "All" },
                { name: "🧪 Verification (UVM)", searchVal: "Verification", catVal: "All", expVal: "All" },
                { name: "📐 Physical Design", searchVal: "Physical Design", catVal: "All", expVal: "All" },
                { name: "🔌 Embedded Systems", searchVal: "Embedded", catVal: "All", expVal: "All" },
                { name: "🔬 JRF / Fellowships", searchVal: "", catVal: "jrf", expVal: "All" },
                { name: "💼 Internships", searchVal: "", catVal: "internship", expVal: "All" },
              ].map((pill) => {
                const isActive =
                  (pill.name === "🎓 Fresher First" && experience === "Fresher") ||
                  (pill.name === "🔬 JRF / Fellowships" && category === "jrf") ||
                  (pill.name === "💼 Internships" && category === "internship") ||
                  (pill.searchVal && search.toLowerCase() === pill.searchVal.toLowerCase()) ||
                  (!pill.searchVal && !search && category === "All" && experience === "All" && pill.name === "All");

                return (
                  <button
                    key={pill.name}
                    type="button"
                    onClick={() => {
                      if (pill.expVal !== "All") setExperience(pill.expVal);
                      if (pill.catVal !== "All") setCategory(pill.catVal);
                      if (pill.searchVal !== undefined) setSearch(pill.searchVal);
                      if (pill.name === "All") {
                        setCategory("All");
                        setExperience("All");
                        setSearch("");
                      }
                    }}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border-2 border-slate-900 transition-all ${
                      isActive
                        ? "bg-blue-600 text-white shadow-brutal-sm scale-105"
                        : "bg-white text-slate-700 hover:bg-slate-100 hover:-translate-y-0.5"
                    }`}
                  >
                    {pill.name}
                  </button>
                );
              })}
            </div>

            {/* AI FILTER CHIPS */}
            {Object.keys(aiChips).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(aiChips).map(([key, value]) => (
                  <Badge key={key} tone="accent" className="pr-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    {key}: {value}
                    <button onClick={() => { const newChips = { ...aiChips }; delete newChips[key]; setAiChips(newChips); }} className="hover:text-blue-100 ml-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* RELEVANT MATCH BANNER */}
            {search && matchInfo.type === "relevant" && (
              <div className="mb-4 p-3.5 bg-blue-50 border-2 border-slate-900 rounded-xl text-xs font-medium text-slate-900 flex items-center gap-2.5 shadow-brutal-sm">
                <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 stroke-[2.5]" />
                <span>Showing relevant postings for <strong>&quot;{matchInfo.query}&quot;</strong> matching your search <strong>&quot;{search}&quot;</strong>.</span>
              </div>
            )}

            {/* RESULTS STATS HEADER */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-slate-800">
                {loading ? "Fetching active opportunities..." : `Showing ${totalCount} Active & Verified Opportunities`}
              </p>
            </div>

            {/* CONTENT GRID / LIST */}
            {loading ? (
              <Card tone="flat" className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                <p className="text-sm text-slate-600 font-medium">Loading verified openings...</p>
              </Card>
            ) : opportunities.length === 0 ? (
              <Card tone="flat" className="text-center py-16 p-8">
                <p className="text-slate-900 font-bold text-lg mb-2">No matching active opportunities found</p>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">Try broadening your filter criteria or searching for different keywords.</p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCategory("All");
                    setEligibility("All");
                    setLocation("All");
                    setDeadline("All");
                    setExperience("All");
                    setSearch("");
                  }}
                  className="px-6 rounded-full"
                >
                  Reset All Filters
                </Button>
              </Card>
            ) : viewMode === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {opportunities.map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {opportunities.map((opp) => (
                  <OpportunityRow key={opp.id} opportunity={opp} />
                ))}
              </div>
            )}

            {/* LOAD MORE / PAGINATION */}
            {!loading && page < totalPages && (
              <div className="flex flex-col items-center gap-3 mt-10">
                <Button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loadingMore}
                  size="lg"
                >
                  {loadingMore ? <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" /> : <Sparkles className="w-4 h-4 stroke-[2.5]" />}
                  {loadingMore ? "Loading more..." : "Load More Opportunities"}
                </Button>
                <p className="text-xs font-semibold text-slate-500">
                  Showing page {page} of {totalPages} — {totalCount} active opportunities
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}