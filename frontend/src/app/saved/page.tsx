"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Search, Trash2, ExternalLink, Loader2, Briefcase } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface SavedItem {
  id: string;
  user_id: string;
  opportunity_id: string;
  created_at: string;
  opportunities: {
    id: string;
    title: string;
    organization?: string | null;
    category?: string | null;
    location?: string | null;
    country?: string | null;
    salary_range?: string | null;
    apply_url?: string | null;
    eligibility?: string | null;
    description?: string | null;
    tags?: string[] | null;
    slug?: string | null;
  } | null;
}

export default function SavedOpportunitiesPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login?redirectTo=/saved");
      return;
    }
    if (user) {
      fetchSaved();
    }
  }, [user, userLoading, router]);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookmarks?limit=50");
      if (res.ok) {
        const data = await res.json();
        setSavedItems(data.bookmarks || []);
      }
    } catch {
      toast.error("Failed to load saved opportunities");
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (bookmarkId: string, opportunityId: string) => {
    try {
      const res = await fetch(`/api/bookmarks/${opportunityId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Opportunity removed from saved list");
        setSavedItems((prev) => prev.filter((item) => item.id !== bookmarkId && item.opportunity_id !== opportunityId));
      }
    } catch {
      toast.error("Failed to remove bookmark");
    }
  };

  const filtered = savedItems.filter((item) => {
    if (!item.opportunities) return false;
    const q = searchQuery.toLowerCase();
    const title = (item.opportunities.title || "").toLowerCase();
    const org = (item.opportunities.organization || "").toLowerCase();
    const cat = (item.opportunities.category || "").toLowerCase();
    return title.includes(q) || org.includes(q) || cat.includes(q);
  });

  if (userLoading || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-slate-600 text-xs font-semibold">Loading saved opportunities...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-full border border-amber-200/60">
              <Bookmark className="w-3.5 h-3.5 fill-amber-500 stroke-amber-700" />
              <span>SAVED BOOKMARKS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-2">
              My Saved Opportunities
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm font-medium mt-1">
              Quick access to bookmarked JRF research fellowships, semiconductor jobs, and internships.
            </p>
          </div>

          <Button href="/opportunities" size="sm" className="shrink-0 shadow-sm">
            <Briefcase className="w-4 h-4" /> Explore All Opportunities
          </Button>
        </div>

        {/* SEARCH BAR */}
        {savedItems.length > 0 && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search saved opportunities by title or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
        )}

        {/* CONTENT GRID */}
        {savedItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-card">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
              <Bookmark className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No saved opportunities yet</h3>
            <p className="text-slate-500 text-xs mt-1 mb-6 max-w-md mx-auto">
              When you bookmark positions in the aggregator, they will appear here for easy reference and tracking.
            </p>
            <Button href="/opportunities" size="md" className="shadow-sm">
              <Search className="w-4 h-4" /> Browse Verified Opportunities
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
            <p className="text-slate-600 text-xs font-medium">No saved opportunities match your search query &apos;{searchQuery}&apos;.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((item) => {
              const opp = item.opportunities!;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Badge tone="accent" className="mb-1.5 text-[11px] font-medium">
                          {opp.category || "JRF / Research"}
                        </Badge>
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                          {opp.title}
                        </h3>
                        <p className="text-xs font-semibold text-slate-600 mt-0.5">
                          {opp.organization || "India Semiconductor Initiative"}
                        </p>
                      </div>
                      <button
                        onClick={() => removeBookmark(item.id, item.opportunity_id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-100 hover:border-rose-100 transition-all shrink-0"
                        title="Remove Bookmark"
                        aria-label="Remove Bookmark"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 font-normal line-clamp-2 leading-relaxed">
                      {opp.description || opp.eligibility || "High-impact VLSI & microelectronics research position."}
                    </p>

                    {opp.salary_range && (
                      <Badge tone="success" className="text-[11px] font-medium">
                        💰 {opp.salary_range}
                      </Badge>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-medium text-slate-500">
                      📍 {opp.location || "India"}
                    </span>

                    <a
                      href={opp.apply_url || `/opportunities/${opp.slug || opp.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <span>Apply Now</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
