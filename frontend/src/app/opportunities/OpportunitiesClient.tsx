"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Opportunity } from "@/types";
import OpportunityRow from "@/components/OpportunityRow";
import OpportunityCard from "@/components/OpportunityCard";
import FilterBar from "@/components/FilterBar";
import SearchBar from "@/components/SearchBar";
import { Loader2, ShieldCheck, EyeOff, Sparkles, X, Filter, LayoutGrid, List } from "lucide-react";

export default function OpportunitiesClient({ initialData }: { initialData: Opportunity[] }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("All");
  const [eligibility, setEligibility] = useState("All");
  const [location, setLocation] = useState("All");
  const [deadline, setDeadline] = useState("All");
  const [search, setSearch] = useState("");
  const [showUnverified, setShowUnverified] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "row">("card");
  const [aiChips, setAiChips] = useState<Record<string, string>>({});
  const [aiSearching, setAiSearching] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(initialData.length);
  const lastAISearch = useRef("");

  const fetchOpportunities = useCallback(async (pageNum = 1) => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (category && category !== "All") params.set("category", category);
      if (eligibility && eligibility !== "All") params.set("eligibility", eligibility);
      if (location && location !== "All") params.set("location", location);
      if (deadline && deadline !== "All") params.set("deadline", deadline);
      if (search) params.set("search", search);
      if (showUnverified) {
        params.set("verified", "all");
      }
      if (pageNum > 1) params.set("page", String(pageNum));

      const res = await fetch(`/api/opportunities?${params}`);
      const data = await res.json();

      if (data.opportunities) {
        setOpportunities(data.opportunities);
        setTotalPages(data.total_pages || 1);
        setTotalCount(data.total_count || data.opportunities.length);
        setPage(data.page || pageNum);
      } else {
        setOpportunities([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      setOpportunities([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [category, eligibility, location, deadline, search, showUnverified]);

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
  }, [category, eligibility, location, deadline, search, showUnverified, fetchOpportunities]);

  useEffect(() => {
    if (page > 1) fetchOpportunities(page);
  }, [page, fetchOpportunities]);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HEADER SECTION */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Verified Official Openings Ingestion Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">All Opportunities</h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">Browse JRF, PhD, DRDO, ISRO, CSIR, and premier VLSI industry openings.</p>
        </div>

        <div className="flex gap-8">
          
          {/* DESKTOP SIDEBAR FILTERS */}
          <aside className="hidden lg:block w-[280px] flex-shrink-0">
            <div className="glass-premium rounded-2xl p-6 sticky top-20 z-10 border border-slate-200">
              <FilterBar
                selectedCategory={category}
                selectedEligibility={eligibility}
                selectedLocation={location}
                selectedDeadline={deadline}
                onCategoryChange={setCategory}
                onEligibilityChange={setEligibility}
                onLocationChange={setLocation}
                onDeadlineChange={setDeadline}
              />
            </div>
          </aside>

          {/* MOBILE FILTER DRAWER */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowMobileFilters(false)} />
              <div className="absolute inset-y-0 right-0 w-[300px] bg-white border-l border-slate-200 shadow-2xl flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
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
                    onCategoryChange={setCategory}
                    onEligibilityChange={setEligibility}
                    onLocationChange={setLocation}
                    onDeadlineChange={setDeadline}
                  />
                </div>
                <div className="p-4 border-t border-slate-200">
                  <button onClick={() => setShowMobileFilters(false)} className="w-full py-2.5 btn-glow font-semibold rounded-xl text-sm">
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MAIN RESULTS FEED */}
          <div className="flex-1 min-w-0">
            
            {/* SEARCH & TOGGLES */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
              <div className="flex-1">
                <SearchBar onSearch={handleSearch} />
                {aiSearching && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-blue-600 font-medium">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>AI parsing query parameters...</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex-1 justify-center shadow-2xs"
                >
                  <Filter className="w-4 h-4 text-blue-600" />
                  Filters
                </button>
                <button
                  onClick={() => setViewMode(viewMode === "card" ? "row" : "card")}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  title="Toggle Grid / List View"
                >
                  {viewMode === "card" ? <List className="w-4 h-4 text-blue-600" /> : <LayoutGrid className="w-4 h-4 text-blue-600" />}
                </button>
              </div>
            </div>

            {/* AI FILTER CHIPS */}
            {Object.keys(aiChips).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(aiChips).map(([key, value]) => (
                  <span key={key} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                    <Sparkles className="w-3.5 h-3.5" />
                    {key}: {value}
                    <button onClick={() => { const newChips = { ...aiChips }; delete newChips[key]; setAiChips(newChips); }} className="hover:text-blue-900 ml-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* RESULTS STATS HEADER */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-700">
                {loading ? "Fetching opportunities..." : `${totalCount} verified opportunities found`}
              </p>
            </div>

            {/* CONTENT GRID / LIST */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                <p className="text-sm text-slate-600 font-medium">Loading live postings...</p>
              </div>
            ) : opportunities.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
                <p className="text-slate-900 font-bold text-lg mb-2">No matching opportunities found</p>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">Try broadening your filter criteria or searching for different keywords.</p>
                <button
                  onClick={() => { setCategory("All"); setEligibility("All"); setLocation("All"); setDeadline("All"); setSearch(""); }}
                  className="px-6 py-2.5 btn-glow text-xs font-semibold rounded-full"
                >
                  Reset All Filters
                </button>
              </div>
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

          </div>

        </div>

      </div>
    </div>
  );
}
