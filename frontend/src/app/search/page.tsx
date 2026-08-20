"use client";

import { useState } from "react";
import Link from "next/link";
import { Search as SearchIcon, Users, Briefcase, MapPin, Loader2, ExternalLink, Clock, Calendar } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { useSearch } from "@/hooks/useSearch";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
}

function getCategoryColor(cat: string) {
  const map: Record<string, string> = {
    "JRF": "bg-blue-50 text-blue-700 border-blue-600",
    "SRF": "bg-purple-50 text-purple-700 border-purple-600",
    "PhD": "bg-emerald-50 text-emerald-700 border-emerald-600",
    "Govt Job": "bg-amber-50 text-amber-700 border-amber-600",
    "Private Job": "bg-pink-50 text-pink-700 border-pink-600",
    "Fellowship": "bg-teal-50 text-teal-700 border-teal-600",
  };
  return map[cat] || "bg-blue-50 text-blue-700 border-blue-600";
}

// Display label -> canonical DB category (canonical vocabulary in lib/categories.ts)
// Display label -> constraint-backed category value (see lib/categories.ts;
// the live DB CHECK constraint accepts: jrf srf phd government fellowship
// internship industry).
const CATEGORY_LABEL_TO_CANONICAL: Record<string, string> = {
  "JRF": "jrf",
  "SRF": "srf",
  "PhD": "phd",
  "Govt Job": "government",
  "Private Job": "industry",
  "Fellowship": "fellowship",
};

const CATEGORIES = ["JRF", "SRF", "PhD", "Govt Job", "Private Job", "Fellowship"];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useUser();

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "opportunities");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "");
  const [locationFilter, setLocationFilter] = useState(searchParams.get("location") || "");
  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean>>({});

  const canonicalCategory = CATEGORY_LABEL_TO_CANONICAL[categoryFilter] || categoryFilter || "All";
  const { data, isLoading: loading } = useSearch(
    query,
    1,
    activeTab === "opportunities" ? canonicalCategory : undefined,
    activeTab === "opportunities" ? locationFilter || undefined : undefined
  );

  const results = activeTab === "opportunities"
    ? (data?.opportunities || [])
    : (data?.people || []);
  const totalCount = activeTab === "opportunities"
    ? (data?.total_count ?? 0)
    : (data?.people?.length ?? 0);

  const currentUserId = currentUser?.id ?? null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (activeTab) params.set("tab", activeTab);
    if (activeTab === "opportunities" && categoryFilter) params.set("category", categoryFilter);
    if (activeTab === "opportunities" && locationFilter) params.set("location", locationFilter);
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
      <h1 className="font-display text-3xl font-black text-slate-900 tracking-tight mb-6">Search</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b-2 border-slate-200">
        {[
          { key: "opportunities", label: "Opportunities", icon: Briefcase },
          { key: "people", label: "People", icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setCategoryFilter(""); setLocationFilter(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-0.5 transition-colors font-semibold ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-4 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={activeTab === "opportunities" ? "Search opportunities..." : "Search people by name, skills, or organization..."}
            className="pl-10"
          />
        </div>
        {activeTab === "opportunities" && (
          <>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="sm:w-44"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Input
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Location..."
              className="sm:w-32"
            />
          </>
        )}
        <Button type="submit" className="shrink-0">
          <SearchIcon className="w-4 h-4" />
          Search
        </Button>
      </form>

      {/* Results count */}
      <p className="text-slate-500 text-sm font-medium mb-4">{totalCount} result{totalCount !== 1 ? "s" : ""}</p>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
      ) : (
        <>
          {activeTab === "opportunities" && (
            <div className="space-y-3">
              {results.map((opp: any) => (
                <Link key={opp.id} href={`/opportunities/${opp.slug || opp.id}`}
                  className="block bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-brutal hover:shadow-brutal-lg hover:-translate-y-0.5 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-slate-900 font-bold truncate">{opp.title}</h3>
                      <p className="text-slate-500 text-sm font-medium">{opp.organization}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 font-medium">
                        {opp.category && <span className={`px-2 py-0.5 rounded-full border-2 text-[10px] font-bold ${getCategoryColor(opp.category)}`}>{opp.category}</span>}
                        {opp.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {opp.location}</span>}
                        {opp.stipend && <span className="flex items-center gap-1">{opp.stipend}</span>}
                        {opp.deadline && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(opp.deadline).toLocaleDateString()}</span>}
                      </div>
                      {opp.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {opp.tags.slice(0, 4).map((t: string) => <span key={t} className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full">{t}</span>)}
                        </div>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </div>
                </Link>
              ))}
              {results.length === 0 && query && (
                <div className="text-center py-12">
                  <p className="text-slate-700 font-semibold">No opportunities found</p>
                  <p className="text-slate-500 text-sm font-medium mt-1">Try different keywords or browse by category.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "people" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((p: any) => (
                <Card key={p.id} className="p-4">
                  <Link href={`/people/${p.username || p.id}`} className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-50 border-2 border-slate-900 flex items-center justify-center flex-shrink-0 shadow-brutal-sm">
                      <span className="text-sm font-black text-blue-700">{getInitials(p.display_name || "")}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-900 text-sm font-bold truncate">{p.display_name}</p>
                      {p.headline && <p className="text-slate-500 text-xs font-medium truncate">{p.headline}</p>}
                      {p.current_org && <p className="text-slate-500 text-[10px] mt-0.5">{p.current_org}</p>}
                      {p.city && <p className="text-slate-500 text-[10px] flex items-center gap-1"><MapPin className="w-3 h-3" />{p.city}</p>}
                      {p.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.skills.slice(0, 3).map((s: string) => (
                            <span key={s} className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                  {currentUserId && currentUserId !== p.id && (
                    <button
                      onClick={() => handleConnect(p.id)}
                      disabled={connectionStatus[p.id]}
                      className="w-full mt-3 flex items-center justify-center gap-1 bg-white text-blue-600 border-2 border-slate-900 rounded-xl py-1.5 text-xs font-bold hover:bg-blue-50 disabled:opacity-50 transition-all shadow-brutal-sm"
                    >
                      {connectionStatus[p.id] ? "Request Sent" : "Connect"}
                    </button>
                  )}
                </Card>
              ))}
              {results.length === 0 && query && (
                <div className="col-span-full text-center py-12">
                  <p className="text-slate-700 font-semibold">No people found</p>
                  <p className="text-slate-500 text-sm font-medium mt-1">Try a different name or skill.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
