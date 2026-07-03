"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Opportunity } from "@/types";
import OpportunityCard from "@/components/OpportunityCard";
import FilterBar from "@/components/FilterBar";
import SearchBar from "@/components/SearchBar";
import { Loader2, ShieldCheck, Eye, EyeOff, Sparkles, X } from "lucide-react";

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [eligibility, setEligibility] = useState("All");
  const [location, setLocation] = useState("All");
  const [deadline, setDeadline] = useState("All");
  const [search, setSearch] = useState("");
  const [showUnverified, setShowUnverified] = useState(false);
  const [aiChips, setAiChips] = useState<Record<string, string>>({});
  const [aiSearching, setAiSearching] = useState(false);
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
    fetchOpportunities();
  }, [fetchOpportunities]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Left Sidebar — Filters (280px) */}
        <aside className="hidden lg:block w-[280px] flex-shrink-0">
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
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-text-primary">All Opportunities</h1>
            <p className="text-text-secondary mt-1 text-sm">Browse JRF, PhD, government, and private sector opportunities.</p>
          </div>

          {/* Search + toggle row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <SearchBar onSearch={handleSearch} />
              {aiSearching && (
                <div className="flex items-center gap-1 mt-1 text-[10px] text-accent">
                  <Sparkles className="w-3 h-3" />
                  AI analyzing query...
                </div>
              )}
            </div>
            <button onClick={() => setShowUnverified(!showUnverified)}
              className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
                showUnverified
                  ? "bg-warning/10 border-warning/30 text-warning"
                  : "bg-surface/50 border-border text-text-secondary hover:text-text-primary"
              }`}
            >
              {showUnverified ? <EyeOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              {showUnverified ? "Hiding unverified" : "Show unverified"}
            </button>
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
  );
}
