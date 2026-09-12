"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search as SearchIcon, Users, Briefcase, Building2, Newspaper,
  BookOpen, MapPin, Loader2, ExternalLink, Calendar, CheckCircle2, ArrowRight
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { useSearch } from "@/hooks/useSearch";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { cn } from "@/lib/utils";

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

const CATEGORIES = ["JRF", "SRF", "PhD", "Govt Job", "Private Job", "Fellowship"];

const TABS = [
  { key: "opportunities", label: "Opportunities", icon: Briefcase },
  { key: "people", label: "People & Engineers", icon: Users },
  { key: "organizations", label: "Organizations", icon: Building2 },
  { key: "news", label: "Hardware News", icon: Newspaper },
  { key: "resources", label: "Research Guides", icon: BookOpen },
];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useUser();

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "opportunities");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "");
  const [locationFilter, setLocationFilter] = useState(searchParams.get("location") || "");
  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean>>({});

  const { data, isLoading: loading } = useSearch(
    query,
    1,
    activeTab === "opportunities" ? categoryFilter : undefined,
    activeTab === "opportunities" ? locationFilter || undefined : undefined
  );

  const opportunities = data?.opportunities || [];
  const people = data?.people || [];
  const organizations = (data as any)?.organizations || [];
  const news = (data as any)?.news || [];

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
    try {
      const res = await fetch("/api/network/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId }),
      });
      if (res.ok) {
        toast.success("Connection request sent!");
        setConnectionStatus((prev) => ({ ...prev, [userId]: true }));
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to connect");
      }
    } catch {
      toast.error("Failed to connect");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-black text-slate-900 tracking-tight">Global Search</h1>
        <p className="text-slate-600 text-xs sm:text-sm font-medium mt-1">
          Search across semiconductor jobs, research fellows, organizations, technical news, and research guides.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b-2 border-slate-900 pb-px no-scrollbar scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setCategoryFilter("");
                setLocationFilter("");
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm whitespace-nowrap font-black rounded-t-xl transition-all border-t-2 border-x-2 -mb-0.5",
                isActive
                  ? "bg-blue-600 text-white border-slate-900 shadow-brutal-sm"
                  : "bg-white text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              activeTab === "opportunities"
                ? "Search VLSI, RTL, ASIC, DRDO, JRF, or Physical Design..."
                : activeTab === "people"
                ? "Search engineers by name, skills (UVM, Verilog), or company..."
                : activeTab === "organizations"
                ? "Search companies and research institutes (ISRO, Intel, IIT)..."
                : activeTab === "news"
                ? "Search semiconductor news, fab policies, and breakings..."
                : "Search topics and keywords..."
            }
            className="pl-10 text-xs sm:text-sm font-bold border-2 border-slate-900 shadow-brutal-sm"
          />
        </div>

        {activeTab === "opportunities" && (
          <>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="sm:w-44 border-2 border-slate-900 text-xs font-bold shadow-brutal-sm"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Input
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Location (e.g. Bangalore)..."
              className="sm:w-40 border-2 border-slate-900 text-xs font-bold shadow-brutal-sm"
            />
          </>
        )}

        <Button type="submit" className="shrink-0 border-2 border-slate-900 shadow-brutal-sm">
          <SearchIcon className="w-4 h-4" /> Search
        </Button>
      </form>

      {/* Dynamic Results Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Searching platform entities...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 1. OPPORTUNITIES TAB */}
          {activeTab === "opportunities" && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500">{opportunities.length} opportunities found</p>
              {opportunities.map((opp: any) => (
                <Link
                  key={opp.id}
                  href={`/opportunities/${opp.slug || opp.id}`}
                  className="block bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-brutal hover:shadow-brutal-lg transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <h3 className="text-slate-900 font-black text-sm sm:text-base hover:text-blue-600 transition-colors truncate">
                        {opp.title}
                      </h3>
                      <p className="text-slate-600 text-xs font-bold">{opp.organization || "Semiconductor Organization"}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-semibold">
                        {opp.category && (
                          <span className={`px-2 py-0.5 rounded-full border-2 text-[10px] font-black ${getCategoryColor(opp.category)}`}>
                            {opp.category}
                          </span>
                        )}
                        {opp.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {opp.location}
                          </span>
                        )}
                        {opp.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {new Date(opp.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
              {opportunities.length === 0 && (
                <Card className="p-12 text-center border-2 border-slate-900 shadow-brutal-sm">
                  <p className="text-slate-900 font-black text-base">No opportunities matching &quot;{query}&quot;</p>
                  <p className="text-slate-500 text-xs mt-1 font-medium">Try broader keywords like &quot;VLSI&quot;, &quot;JRF&quot;, or &quot;DRDO&quot;.</p>
                </Card>
              )}
            </div>
          )}

          {/* 2. PEOPLE TAB */}
          {activeTab === "people" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {people.map((p: any) => (
                <Card key={p.id} className="p-5 border-2 border-slate-900 shadow-brutal-sm flex flex-col justify-between space-y-3">
                  <Link href={`/profile/${p.username || p.id}`} className="flex items-start gap-3 group">
                    <div className="w-12 h-12 rounded-xl border-2 border-slate-900 flex items-center justify-center font-black text-sm shrink-0 shadow-brutal-sm overflow-hidden relative">
                      <ImageWithFallback
                        src={p.avatar_url}
                        alt={p.display_name || "Candidate avatar"}
                        fallbackType="avatar"
                        fallbackName={p.display_name || "User"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-900 text-sm font-black group-hover:text-blue-600 transition-colors truncate">
                        {p.display_name}
                      </p>
                      {p.headline && <p className="text-slate-600 text-xs font-semibold line-clamp-1">{p.headline}</p>}
                      {p.current_org && <p className="text-slate-500 text-[11px] font-medium">{p.current_org}</p>}
                      {p.city && (
                        <p className="text-slate-500 text-[11px] font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {p.city}
                        </p>
                      )}
                    </div>
                  </Link>

                  {p.skills && p.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.skills.slice(0, 3).map((s: string) => (
                        <span key={s} className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {currentUser?.id !== p.id && (
                    <button
                      onClick={() => handleConnect(p.id)}
                      disabled={connectionStatus[p.id]}
                      className="w-full mt-2 py-1.5 bg-white hover:bg-blue-50 text-blue-600 border-2 border-slate-900 rounded-xl text-xs font-black shadow-brutal-sm disabled:opacity-50 transition-all text-center"
                    >
                      {connectionStatus[p.id] ? "Request Pending" : "Connect"}
                    </button>
                  )}
                </Card>
              ))}
              {people.length === 0 && (
                <div className="col-span-full">
                  <Card className="p-12 text-center border-2 border-slate-900 shadow-brutal-sm">
                    <p className="text-slate-900 font-black text-base">No engineers found matching &quot;{query}&quot;</p>
                    <p className="text-slate-500 text-xs mt-1 font-medium">Try searching by skill (e.g. &quot;UVM&quot;) or organization name.</p>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* 3. ORGANIZATIONS TAB */}
          {activeTab === "organizations" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {organizations.map((org: any) => (
                <Card key={org.id} className="p-5 border-2 border-slate-900 shadow-brutal-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl border-2 border-slate-900 flex items-center justify-center font-black text-sm shrink-0 shadow-brutal-sm overflow-hidden relative">
                      <ImageWithFallback
                        src={org.logo_url}
                        alt={`${org.name} logo`}
                        fallbackType="logo"
                        fallbackName={org.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-black text-slate-900">{org.name}</h3>
                        {org.is_verified && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{org.type || "Semiconductor Organization"}</p>
                      {org.location && <p className="text-[11px] text-slate-400">{org.location}</p>}
                    </div>
                  </div>
                  <Link
                    href={`/organizations/${org.slug || org.id}`}
                    className="block w-full py-1.5 bg-white text-slate-900 border-2 border-slate-900 rounded-xl text-xs font-black text-center shadow-brutal-sm hover:bg-slate-50"
                  >
                    View Organization Profile →
                  </Link>
                </Card>
              ))}
              {organizations.length === 0 && (
                <div className="col-span-full">
                  <Card className="p-12 text-center border-2 border-slate-900 shadow-brutal-sm">
                    <p className="text-slate-900 font-black text-base">No organizations found</p>
                    <p className="text-slate-500 text-xs mt-1">Try searching for &quot;ISRO&quot;, &quot;DRDO&quot;, &quot;IIT&quot;, or &quot;CSIR&quot;.</p>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* 4. NEWS TAB */}
          {activeTab === "news" && (
            <div className="space-y-3">
              {news.map((item: any) => (
                <Card key={item.id} className="p-4 border-2 border-slate-900 shadow-brutal-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <Link href={`/news/${item.slug || item.id}`} className="text-sm font-black text-slate-900 hover:text-blue-600">
                        {item.title}
                      </Link>
                      {item.summary && <p className="text-xs text-slate-600 line-clamp-2">{item.summary}</p>}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 font-semibold">
                        <span>{item.source_name || "BerojgarDegreeWala News"}</span>
                        {item.published_at && <span>{new Date(item.published_at).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    {item.image_url && (
                      <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden shrink-0 relative">
                        <ImageWithFallback
                          src={item.image_url}
                          alt={item.title || "News thumbnail"}
                          fallbackType="news"
                          fallbackName={item.source_name || "BerojgarDegreeWala News"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
              {news.length === 0 && (
                <Card className="p-12 text-center border-2 border-slate-900 shadow-brutal-sm">
                  <p className="text-slate-900 font-black text-base">No news articles found</p>
                  <p className="text-slate-500 text-xs mt-1">Check the <Link href="/news" className="text-blue-600 font-bold hover:underline">News Feed</Link> for daily semiconductor breakings.</p>
                </Card>
              )}
            </div>
          )}

          {/* 5. RESOURCES TAB */}
          {activeTab === "resources" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: "JRF vs SRF vs RA Fellowship Difference", href: "/resources/jrf-vs-srf-difference", desc: "Detailed breakdown of UGC/CSIR fellowship stipends, qualifications, and tenure." },
                { title: "DRDO Recruitment Guide for Electronics & VLSI", href: "/resources/drdo-recruitment-electronics", desc: "Complete guide on RAC scientist-B exam, GATE cutoffs, and interview process." },
                { title: "Fully Funded PhD in VLSI Abroad", href: "/resources/fully-funded-phd-vlsi-abroad", desc: "Admissions guide for US, Europe, and Singapore microelectronics doctoral positions." },
                { title: "VLSI Career Guide & Industry Roadmap", href: "/resources/vlsi-careers", desc: "Salary benchmarks, core domains (Frontend vs Backend), and essential EDA skillsets." },
              ].map((guide) => (
                <Card key={guide.title} className="p-5 border-2 border-slate-900 shadow-brutal-sm space-y-2 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{guide.title}</h3>
                    <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">{guide.desc}</p>
                  </div>
                  <Link
                    href={guide.href}
                    className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1 pt-2"
                  >
                    Read Guide <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
