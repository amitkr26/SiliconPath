"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Search, Trash2, ExternalLink, Loader2, ArrowLeft, Briefcase } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import Link from "next/link";

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
    <div className="min-h-screen bg-[#FAF9F6] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="bg-white border-3 border-slate-900 rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_#0F172A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-slate-900 text-xs font-black rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A]">
              <Bookmark className="w-4 h-4 fill-slate-900 stroke-[2]" />
              <span>SAVED BOOKMARKS</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
              My Saved Opportunities
            </h1>
            <p className="text-slate-600 text-xs font-semibold mt-1">
              Quick access to bookmarked JRF research fellowships, semiconductor jobs, and internships.
            </p>
          </div>

          <Link
            href="/opportunities"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0F172A] transition-all flex items-center gap-1.5"
          >
            <Briefcase className="w-4 h-4" /> Explore All Opportunities
          </Link>
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
              className="w-full pl-11 pr-4 py-3 bg-white border-3 border-slate-900 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 shadow-[4px_4px_0px_0px_#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        )}

        {/* CONTENT GRID */}
        {savedItems.length === 0 ? (
          <div className="bg-white border-3 border-slate-900 rounded-2xl p-12 text-center shadow-[6px_6px_0px_0px_#0F172A]">
            <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-black text-slate-900">No saved opportunities yet</h3>
            <p className="text-slate-600 text-xs mt-1 mb-6">
              When you bookmark positions in the aggregator, they will appear here for easy reference and tracking.
            </p>
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0F172A] transition-all"
            >
              <Search className="w-4 h-4" /> Browse Verified Opportunities
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border-3 border-slate-900 rounded-2xl p-8 text-center shadow-[4px_4px_0px_0px_#0F172A]">
            <p className="text-slate-600 text-xs font-semibold">No saved opportunities match your search query &apos;{searchQuery}&apos;.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((item) => {
              const opp = item.opportunities!;
              return (
                <div
                  key={item.id}
                  className="bg-white border-3 border-slate-900 rounded-2xl p-6 shadow-[5px_5px_0px_0px_#0F172A] flex flex-col justify-between space-y-4 hover:shadow-[7px_7px_0px_0px_#0F172A] transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider border border-blue-300 rounded-md mb-1.5">
                          {opp.category || "JRF / Research"}
                        </span>
                        <h3 className="font-black text-base text-slate-900 leading-snug">{opp.title}</h3>
                        <p className="text-xs font-bold text-slate-600">{opp.organization || "India Semiconductor Initiative"}</p>
                      </div>
                      <button
                        onClick={() => removeBookmark(item.id, item.opportunity_id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition-all"
                        title="Remove Bookmark"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-700 font-medium line-clamp-2 leading-relaxed">
                      {opp.description || opp.eligibility || "High-impact VLSI & microelectronics research position."}
                    </p>

                    {opp.salary_range && (
                      <p className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-block">
                        💰 {opp.salary_range}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold text-slate-500">
                      📍 {opp.location || "India"}
                    </span>

                    <a
                      href={opp.apply_url || `/opportunities/${opp.slug || opp.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0F172A] transition-all flex items-center gap-1.5"
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
