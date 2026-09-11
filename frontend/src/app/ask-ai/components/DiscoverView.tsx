import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Building2,
  GraduationCap,
  Sparkles,
  Loader2,
  ShieldCheck,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { OpportunityCard } from "./OpportunityCard";
import { GroundedRecord } from "@/lib/ai/grounding";
import { INSTITUTIONAL_SOURCES } from "@/lib/sources/source-registry";

interface DiscoverViewProps {
  savedIds: string[];
  onToggleSave: (id: string) => void;
  onSelectForAI: (query: string) => void;
}

export function DiscoverView({
  savedIds,
  onToggleSave,
  onSelectForAI,
}: DiscoverViewProps) {
  const [query, setQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedOrg, setSelectedOrg] = useState("all");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [freshnessFilter, setFreshnessFilter] = useState<"all" | "expiring_soon" | "include_expired">("all");

  const [opportunities, setOpportunities] = useState<GroundedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build search query combining selected filters
      const searchTerms = [
        query,
        selectedRole !== "all" ? selectedRole : "",
        selectedOrg !== "all" ? selectedOrg : "",
        selectedDomain !== "all" ? selectedDomain : "",
      ]
        .filter(Boolean)
        .join(" ");

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: searchTerms || "JRF semiconductor VLSI electronics opportunities" }],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load opportunities");

      let results: GroundedRecord[] = data.opportunities || [];

      if (freshnessFilter === "expiring_soon") {
        results = results.filter((r) => r.status === "EXPIRING_SOON");
      }

      setOpportunities(results);
    } catch (err: any) {
      setError(err.message || "Failed to fetch live opportunities");
    } finally {
      setLoading(false);
    }
  }, [query, selectedRole, selectedOrg, selectedDomain, freshnessFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOpportunities();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchOpportunities]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="max-w-2xl space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Verified Institutional Intelligence
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Discover Live Research &amp; Semiconductor Vacancies
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            Active, non-expired JRF, PhD, Scientist, and VLSI engineering roles from DRDO, ISRO, CSIR labs, IITs, and IISc.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mt-6 flex gap-2 relative z-10">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keywords (e.g. SystemVerilog, GaN, Neuromorphic, DRDO, IIT Delhi)..."
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-400 text-xs rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Filter Chips & Controls */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
        {/* Role Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Role:</span>
          {[
            { id: "all", label: "All Roles" },
            { id: "jrf", label: "JRF (Junior Research Fellow)" },
            { id: "srf", label: "SRF" },
            { id: "phd", label: "PhD Fellow" },
            { id: "scientist", label: "Scientist / Engineer" },
            { id: "internship", label: "Research Internship" },
            { id: "fellowship", label: "Fellowship" },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                selectedRole === r.id
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Institution Dropdown & Domain Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Organization:</span>
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-1.5 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Institutions (DRDO, ISRO, IITs, IISc...)</option>
              {INSTITUTIONAL_SOURCES.map((s) => (
                <option key={s.id} value={s.shortCode}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Freshness:</span>
            <select
              value={freshnessFilter}
              onChange={(e) => setFreshnessFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-1.5 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Active Only (Non-Expired)</option>
              <option value="expiring_soon">Expiring Soon (≤ 7 Days)</option>
              <option value="include_expired">Include Historical / Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Verified Opportunities ({opportunities.length})
          </p>
          {loading && (
            <span className="flex items-center gap-1.5 text-xs text-blue-600 font-bold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching live records...
            </span>
          )}
        </div>

        {error ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-red-600 mx-auto" />
            <p className="text-xs font-bold text-red-900">{error}</p>
            <button
              onClick={fetchOpportunities}
              className="text-xs font-bold text-red-700 bg-white border border-red-200 px-3 py-1.5 rounded-xl hover:bg-red-50"
            >
              Retry Search
            </button>
          </div>
        ) : opportunities.length === 0 && !loading ? (
          <div className="p-10 bg-white border border-slate-200/90 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              No matching active opportunities found
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Try broadening your search query or ask the AI Career Assistant to monitor this research topic.
            </p>
            <button
              onClick={() => onSelectForAI(`Are there any upcoming recruitment drives or notifications for ${query || "VLSI JRF"}?`)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl transition inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Ask AI to Investigate
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opportunities.map((opp) => (
              <OpportunityCard
                key={opp.id || opp.slug || opp.title}
                opportunity={opp}
                isSaved={savedIds.includes(opp.id || "")}
                onToggleSave={onToggleSave}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
