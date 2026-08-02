"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon, Briefcase, MapPin, Loader2, ExternalLink, Calendar } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

function getCategoryColor(cat: string) {
  const map: Record<string, string> = {
    "JRF": "bg-blue-500/20 text-blue-400",
    "SRF": "bg-purple-500/20 text-purple-400",
    "PhD": "bg-green-500/20 text-green-400",
    "government": "bg-orange-500/20 text-orange-400",
    "Private Job": "bg-pink-500/20 text-pink-400",
    "fellowship": "bg-teal-500/20 text-teal-400",
    "internship": "bg-pink-500/20 text-pink-400",
  };
  return map[cat] || "bg-accent/20 text-accent";
}

const CATEGORIES = ["jrf", "srf", "phd", "government", "fellowship", "internship"];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "");
  const [results, setResults] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (categoryFilter) params.set("category", categoryFilter);
    router.replace(`/search?${params}`);
  };

  useEffect(() => {
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    if (!q && !category) return;
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    params.set("limit", "50");
    fetch(`/api/search/opportunities?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setResults(data.opportunities || []);
        setTotalCount(data.count ?? 0);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [searchParams]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-6">Search Opportunities</h1>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search opportunities by title, organization, or tag..."
            className="w-full bg-surface border border-border text-text-primary text-sm rounded-lg pl-10 pr-4 py-2.5 outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 outline-none"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" className="bg-accent text-text-inverted px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
          Search
        </button>
      </form>

      {/* Results count */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>
      ) : (
        <>
          <p className="text-text-muted text-sm mb-4">{totalCount} result{totalCount !== 1 ? "s" : ""}</p>
          <div className="space-y-3">
            {results.map((opp: any) => (
              <Link key={opp.id} href={`/opportunities/${opp.slug || opp.id}`}
                className="block bg-surface border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-text-primary font-semibold truncate">{opp.title}</h3>
                    <p className="text-text-muted text-sm">{opp.organization}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-text-muted">
                      {opp.category && <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getCategoryColor(opp.category)}`}>{opp.category}</span>}
                      {opp.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {opp.location}</span>}
                      {opp.deadline && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(opp.deadline).toLocaleDateString()}</span>}
                    </div>
                    {opp.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {opp.tags.slice(0, 4).map((t: string) => <span key={t} className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">{t}</span>)}
                      </div>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-text-muted flex-shrink-0" />
                </div>
              </Link>
            ))}
            {results.length === 0 && (query || categoryFilter) && (
              <div className="text-center py-12">
                <p className="text-text-secondary">No opportunities found</p>
                <p className="text-text-muted text-sm mt-1">Try different keywords or browse by category.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
