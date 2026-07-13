"use client";

import { useState } from "react";
import Link from "next/link";
import { Search as SearchIcon, Users, Briefcase, MapPin, Loader2, ExternalLink, Clock, Calendar } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { useSearch } from "@/hooks/useSearch";

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
}

function getCategoryColor(cat: string) {
  const map: Record<string, string> = {
    "JRF": "bg-blue-500/20 text-blue-400",
    "SRF": "bg-purple-500/20 text-purple-400",
    "PhD": "bg-green-500/20 text-green-400",
    "Govt Job": "bg-orange-500/20 text-orange-400",
    "Private Job": "bg-pink-500/20 text-pink-400",
    "Fellowship": "bg-teal-500/20 text-teal-400",
  };
  return map[cat] || "bg-accent/20 text-accent";
}

const CATEGORIES = ["JRF", "SRF", "PhD", "Govt Job", "Private Job", "Fellowship"];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useUser();

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "opportunities");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "");
  const [locationFilter, setLocationFilter] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean>>({});

  const { data, isLoading: loading } = useSearch(query, 1);

  const results = activeTab === "opportunities"
    ? (data?.opportunities || [])
    : (data?.people || []);
  const totalCount = data?.total_count ?? 0;

  const currentUserId = currentUser?.id ?? null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (activeTab) params.set("tab", activeTab);
    router.replace(`/search?${params}`);
  };

  const handleConnect = async (userId: string) => {
    const res = await fetch("/api/network/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: userId }),
    });
    if (res.ok) {
      toast.success("Request sent!");
      setConnectionStatus((prev) => ({ ...prev, [userId]: true }));
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-6">Search</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border">
        {[
          { key: "opportunities", label: "Opportunities", icon: Briefcase },
          { key: "people", label: "People", icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setCategoryFilter(""); setLocationFilter(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-accent text-accent"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={activeTab === "opportunities" ? "Search opportunities..." : "Search people by name, skills, or organization..."}
            className="w-full bg-surface border border-border text-text-primary text-sm rounded-lg pl-10 pr-4 py-2.5 outline-none"
          />
        </div>
        {activeTab === "opportunities" && (
          <>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 outline-none"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Location..."
              className="bg-surface border border-border text-text-primary text-sm rounded-lg px-3 py-2.5 outline-none w-32"
            />
          </>
        )}
        <button type="submit" className="bg-accent text-text-inverted px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
          Search
        </button>
      </form>

      {/* Results count */}
      <p className="text-text-muted text-sm mb-4">{totalCount} result{totalCount !== 1 ? "s" : ""}</p>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>
      ) : (
        <>
          {activeTab === "opportunities" && (
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
                        {opp.stipend && <span className="flex items-center gap-1">{opp.stipend}</span>}
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
              {results.length === 0 && query && (
                <div className="text-center py-12">
                  <p className="text-text-secondary">No opportunities found</p>
                  <p className="text-text-muted text-sm mt-1">Try different keywords or browse by category.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "people" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((p: any) => (
                <div key={p.id} className="bg-surface border border-border rounded-xl p-4">
                  <Link href={`/people/${p.username || p.id}`} className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-accent">{getInitials(p.full_name || "")}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-text-primary text-sm font-medium truncate">{p.full_name}</p>
                      {p.headline && <p className="text-text-muted text-xs truncate">{p.headline}</p>}
                      {p.current_org && <p className="text-text-muted text-[10px] mt-0.5">{p.current_org}</p>}
                      {p.city && <p className="text-text-muted text-[10px] flex items-center gap-1"><MapPin className="w-3 h-3" />{p.city}</p>}
                      {p.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.skills.slice(0, 3).map((s: string) => (
                            <span key={s} className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                  {currentUserId && currentUserId !== p.id && (
                    <button
                      onClick={() => handleConnect(p.id)}
                      disabled={connectionStatus[p.id]}
                      className="w-full mt-3 flex items-center justify-center gap-1 bg-accent/20 text-accent border border-accent/30 rounded-lg py-1.5 text-xs font-medium hover:bg-accent/30 disabled:opacity-50 transition-colors"
                    >
                      {connectionStatus[p.id] ? "Request Sent" : "Connect"}
                    </button>
                  )}
                </div>
              ))}
              {results.length === 0 && query && (
                <div className="col-span-full text-center py-12">
                  <p className="text-text-secondary">No people found</p>
                  <p className="text-text-muted text-sm mt-1">Try a different name or skill.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
