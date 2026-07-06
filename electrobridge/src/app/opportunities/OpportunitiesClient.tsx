"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Opportunity } from "@/types";
import OpportunityCard from "@/components/OpportunityCard";
import FilterBar from "@/components/FilterBar";
import SearchBar from "@/components/SearchBar";
import { Loader2, ShieldCheck, Eye, EyeOff, Sparkles, X, Filter } from "lucide-react";

export default function OpportunitiesClient({ initialData }: { initialData: Opportunity[] }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialData);
  const [loading, setLoading] = useState(false); // Default false since we have initial data
  const [category, setCategory] = useState("All");
  const [eligibility, setEligibility] = useState("All");
  const [location, setLocation] = useState("All");
  const [deadline, setDeadline] = useState("All");
  const [search, setSearch] = useState("");
  const [showUnverified, setShowUnverified] = useState(false);
  const [aiChips, setAiChips] = useState<Record<string, string>>({});
  const [aiSearching, setAiSearching] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const lastAISearch = useRef("");

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (category && category !== "All") params.set("category", category);
      if (eligibility && eligibility !== "All") params.set("eligibility", eligibility);
      if (location && location !== "All") params.set("location", location);
      if (deadline && deadline !== "All") params.set("deadline", deadline);
      if (search) params.set("search", search);
      if (!showUnverified) params.set("verified", "true");

      const res = await fetch(`/api/opportunities?${params}`);
      const data = await res.json();

      if (data.opportunities) {
        setOpportunities(data.opportunities);
      } else {
        setOpportunities([]);
      }
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      setOpportunities([]);
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
        // AI search failed, fall back to normal search
      } finally {
        setAiSearching(false);
      }
    }
  }, []);

  useEffect(() => {
    // Only fetch if filters are applied
    if (category !== "All" || eligibility !== "All" || location !== "All" || deadline !== "All" || search || !showUnverified) {
      fetchOpportunities();
    }
  }, [fetchOpportunities, category, eligibility, location, deadline, search, showUnverified]);

  return (
    <div className="relative min-h-screen overflow-hidden py-10">
      {/* BACKGROUND DECORATIONS (GLOWING CYBER BLOBS) */}
      <div className="absolute top-[20%] left-[-15%] w-[45vw] h-[45vw] rounded-full bg-accent/5 cyber-blob animate-blob-slow" />
      <div className="absolute bottom-[20%] right-[-15%] w-[40vw] h-[40vw] rounded-full bg-blue-500/5 cyber-blob animate-blob-slower" />

      <div className="max-w-[1440px] mx-auto px-4 relative z-10">
        <div className="flex gap-8">
        {/* Left Sidebar — Filters (280px) Desktop */}
        <aside className="hidden lg:block w-[280px] flex-shrink-0">
          <div className="glass-premium rounded-xl p-6 sticky top-24 z-10">
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

        {/* Mobile Filter Drawer */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
            <div className="absolute inset-y-0 right-0 w-[280px] bg-surface border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-text-primary font-bold">Filters</h2>
                <button onClick={() => setShowMobileFilters(false)} className="text-text-muted hover:text-text-primary">
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
              <div className="p-4 border-t border-border">
                <button onClick={() => setShowMobileFilters(false)} className="w-full py-2 bg-accent text-bg-primary font-medium rounded-lg hover:bg-accent-hover transition-colors">
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-text-primary">All Opportunities</h1>
            <p className="text-text-secondary mt-1 text-sm">Browse JRF, PhD, government, and private sector opportunities.</p>
          </div>

          {/* Search + toggle row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="flex-1">
              <SearchBar onSearch={handleSearch} />
              {aiSearching && (
                <div className="flex items-center gap-1 mt-1 text-[10px] text-accent">
                  <Sparkles className="w-3 h-3" />
                  AI analyzing query...
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowMobileFilters(true)}
                className="lg:hidden inline-flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border bg-surface/50 border-border text-text-secondary hover:text-text-primary transition-colors flex-1 justify-center"
              >
                <Filter className="w-3.5 h-3.5" />
                Filters
              </button>
              <button onClick={() => setShowUnverified(!showUnverified)}
                className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border transition-colors flex-1 sm:flex-none justify-center ${
                  showUnverified
                    ? "bg-warning/10 border-warning/30 text-warning"
                    : "bg-surface/50 border-border text-text-secondary hover:text-text-primary"
                }`}
              >
                {showUnverified ? <EyeOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                {showUnverified ? "Hiding unverified" : "Show unverified"}
              </button>
            </div>
          </div>

          {/* AI chips row */}
          {Object.keys(aiChips).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(aiChips).map(([key, value]) => (
                <span key={key} className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded text-xs border border-accent/20">
                  <Sparkles className="w-3 h-3" />
                  {key}: {value}
                  <button onClick={() => { const newChips = { ...aiChips }; delete newChips[key]; setAiChips(newChips); }} className="hover:text-text-primary"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}

          {/* Results count + sort */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text-secondary">
              {loading ? "Searching..." : `${opportunities.length} opportunities found`}
            </p>
          </div>

          {/* Loading / Empty / Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-surface/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-text-muted" />
              </div>
              <p className="text-text-secondary text-lg mb-2">No opportunities found.</p>
              <p className="text-text-secondary text-sm">Try adjusting your filters or check back later.</p>
              <button onClick={() => { setCategory("All"); setEligibility("All"); setLocation("All"); setDeadline("All"); setSearch(""); setShowUnverified(true); }}
                className="mt-4 inline-flex items-center gap-2 bg-accent text-bg-primary font-semibold rounded-lg px-4 py-2 text-sm hover:bg-accent-hover transition-colors"
              >
                Reset & Show All
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <div className="lg:hidden mt-4">
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
      </div>
    </div>
  );
}
