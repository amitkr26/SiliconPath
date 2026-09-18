"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Opportunity } from "@/types";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import {
  Search, X, MapPin, Calendar, ArrowRight, Bookmark, BookmarkCheck,
  ChevronLeft, ChevronRight, LayoutGrid, List, Microscope, Briefcase,
  UserCheck, GraduationCap, Star, Globe, Trophy, Zap, Mail, Shield,
  Users, Loader2, CheckCircle2, Sparkles, Building2, Clock, IndianRupee, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORY_TABS = [
  { id: "All", label: "All", icon: LayoutGrid },
  { id: "vlsi", label: "VLSI & ASIC", icon: Sparkles },
  { id: "embedded", label: "Embedded", icon: Briefcase },
  { id: "semiconductor", label: "Semiconductors", icon: Building2 },
  { id: "jrf", label: "Research & JRF", icon: Microscope },
  { id: "job", label: "Core Jobs", icon: UserCheck },
  { id: "internship", label: "Internships", icon: Star },
  { id: "govt-job", label: "Govt & Defence", icon: Trophy },
];

const TYPE_OPTIONS = [
  { value: "All", label: "All Types" },
  { value: "internship", label: "Internships" },
  { value: "job", label: "Full-time Jobs" },
  { value: "jrf", label: "Research / JRF" },
  { value: "srf", label: "Senior Research / SRF" },
  { value: "phd", label: "PhD Research" },
  { value: "scholarship", label: "Scholarships" },
  { value: "fellowship", label: "Fellowships" },
  { value: "govt-job", label: "Government / PSU" },
];

const FIELD_OPTIONS = [
  { value: "All", label: "All Fields" },
  { value: "vlsi", label: "VLSI & Digital Design" },
  { value: "semiconductor", label: "Semiconductor Fabrication" },
  { value: "embedded", label: "Embedded Systems & Firmware" },
  { value: "verification", label: "Design Verification (UVM)" },
  { value: "analog", label: "Analog & Mixed Signal" },
  { value: "research", label: "Applied Research & JRF" },
];

const LOCATION_OPTIONS = [
  { value: "All", label: "All Locations" },
  { value: "Bengaluru", label: "Bengaluru, India" },
  { value: "Hyderabad", label: "Hyderabad, India" },
  { value: "Pune", label: "Pune, India" },
  { value: "Delhi / NCR", label: "Delhi / NCR, India" },
  { value: "Mumbai", label: "Mumbai, India" },
  { value: "Chennai", label: "Chennai, India" },
  { value: "Remote", label: "Remote / Work From Home" },
];

const ELIGIBILITY_OPTIONS = [
  { value: "All", label: "All Eligibility" },
  { value: "B.Tech", label: "B.Tech / B.E." },
  { value: "M.Tech", label: "M.Tech / M.E." },
  { value: "PhD", label: "PhD / Doctoral" },
  { value: "B.Sc", label: "B.Sc / BCA" },
  { value: "M.Sc", label: "M.Sc / MCA" },
  { value: "Diploma", label: "Diploma Holders" },
  { value: "Any Graduate", label: "Any Graduate" },
];

function getLocalBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("BerojgarDegreeWala_bookmarks");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setLocalBookmarks(ids: string[]) {
  localStorage.setItem("BerojgarDegreeWala_bookmarks", JSON.stringify(ids));
}

function formatPostedDate(dateStr?: string | null): string {
  if (!dateStr) return "Recently Posted";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently Posted";
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Posted Today";
    if (diffDays === 1) return "Posted 1d ago";
    if (diffDays < 7) return `Posted ${diffDays}d ago`;
    return `Posted ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  } catch {
    return "Recently Posted";
  }
}

function formatDeadline(deadlineStr?: string | null): { text: string; isUrgent: boolean; isRolling: boolean } {
  if (!deadlineStr) {
    return { text: "Rolling Applications", isUrgent: false, isRolling: true };
  }
  try {
    const d = new Date(deadlineStr);
    if (isNaN(d.getTime())) {
      return { text: "Rolling Applications", isUrgent: false, isRolling: true };
    }
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (diffDays > 0 && diffDays <= 5) {
      return { text: `Apply by ${formatted} (${diffDays}d left)`, isUrgent: true, isRolling: false };
    }
    return { text: `Apply by ${formatted}`, isUrgent: false, isRolling: false };
  } catch {
    return { text: "Rolling Applications", isUrgent: false, isRolling: true };
  }
}

export default function OpportunitiesClient({ initialData }: { initialData: Opportunity[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [oppType, setOppType] = useState("All");
  const [field, setField] = useState("All");
  const [location, setLocation] = useState("All");
  const [eligibility, setEligibility] = useState("All");
  const [sort, setSort] = useState("fresher");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(initialData.length);
  const [totalPages, setTotalPages] = useState(Math.max(1, Math.ceil(initialData.length / 8)));
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Bookmarks
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});

  // Newsletter
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterAgreed, setNewsletterAgreed] = useState(true);
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);

  const requestToken = useRef(0);
  const PAGE_LIMIT = 8;

  // Initialize bookmarks from storage
  useEffect(() => {
    const saved = getLocalBookmarks();
    const map: Record<string, boolean> = {};
    saved.forEach((id) => {
      map[id] = true;
    });
    setBookmarkedIds(map);
  }, []);

  const toggleBookmark = (id: string, title?: string) => {
    const current = getLocalBookmarks();
    let updated: string[];
    const isSaved = current.includes(id);

    if (isSaved) {
      updated = current.filter((item) => item !== id);
      setBookmarkedIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast.success(`Removed "${title || "Opportunity"}" from bookmarks.`);
    } else {
      updated = [...current, id];
      setBookmarkedIds((prev) => ({ ...prev, [id]: true }));
      toast.success(`Bookmarked "${title || "Opportunity"}".`);
    }
    setLocalBookmarks(updated);
  };

  const fetchOpportunities = useCallback(
    async (pageNum = 1) => {
      const token = ++requestToken.current;
      setLoading(true);

      try {
        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("limit", String(PAGE_LIMIT));

        // Priority for type/category/field
        if (oppType !== "All") {
          params.set("category", oppType);
        } else if (category !== "All") {
          if (["vlsi", "embedded", "semiconductor"].includes(category)) {
            params.set("field", category);
          } else {
            params.set("category", category);
          }
        }

        if (field !== "All") params.set("field", field);
        if (eligibility !== "All") params.set("eligibility", eligibility);
        if (location !== "All") params.set("location", location);
        if (sort) params.set("sort", sort);

        const combinedSearch = search.trim();
        if (combinedSearch) {
          params.set("search", combinedSearch);
        }

        const res = await fetch(`/api/opportunities?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch opportunities");
        const data = await res.json();

        if (token !== requestToken.current) return;

        if (data.opportunities) {
          setOpportunities(data.opportunities);
          setTotalCount(data.total_count || data.opportunities.length);
          setTotalPages(Math.max(1, Math.ceil((data.total_count || data.opportunities.length) / PAGE_LIMIT)));
          setPage(data.page || pageNum);
        }
      } catch (err) {
        if (token !== requestToken.current) return;
        console.error("Opportunities search error:", err);
      } finally {
        if (token === requestToken.current) {
          setLoading(false);
        }
      }
    },
    [category, oppType, field, location, eligibility, sort, search]
  );

  // Trigger search on filter changes
  useEffect(() => {
    setPage(1);
    fetchOpportunities(1);
  }, [category, oppType, field, location, eligibility, sort, fetchOpportunities]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOpportunities(1);
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!newsletterAgreed) {
      toast.error("Please agree to receive updates.");
      return;
    }

    setNewsletterSubmitting(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Subscribed successfully! You will receive opportunity updates.");
        setNewsletterEmail("");
      } else {
        toast.error(data.error || "Subscription failed. Please try again.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION & INTEGRATED SEARCH                                      */}
      {/* ========================================================================= */}
      <section className="relative pt-6 pb-12 sm:pt-10 sm:pb-16 bg-white border-b border-slate-200/80 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/60 rounded-full blur-3xl pointer-events-none -mr-40 -mt-20" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-8 sm:mb-12">
            
            {/* Hero Text */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Opportunities</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Find Your Next <br />
                <span className="text-blue-600">Big Opportunity</span>
              </h1>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl">
                Explore internships, research positions, jobs, scholarships and fellowships from top organizations across India and worldwide.
              </p>
            </div>

            {/* Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative h-[260px] sm:h-[300px] lg:h-[340px] w-full rounded-2xl overflow-hidden shadow-elevated border border-slate-200 bg-slate-100">
                <Image
                  src="/images/hero-student-campus.png"
                  alt="Student on campus exploring opportunities"
                  fill
                  unoptimized
                  priority
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 500px"
                />

                {/* Overlay Floating Tagline */}
                <div className="absolute right-4 top-4 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs hidden sm:block">
                  <div className="font-serif italic text-xs font-bold text-slate-800 leading-tight">
                    Learn &bull; Explore <br />
                    <span className="text-blue-600">Grow &bull; Succeed</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Search & Filter Container (Integrated Box) */}
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-elevated space-y-3.5"
          >
            {/* Top Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search opportunities (e.g., internships, AI, ISRO, scholarships...)"
                className="w-full pl-11 pr-10 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-normal"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdown Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* 1. Opportunity Type */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Opportunity Type
                </label>
                <select
                  value={oppType}
                  onChange={(e) => setOppType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* 2. Field of Interest */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Field of Interest
                </label>
                <select
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  {FIELD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* 3. Location */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Location
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  {LOCATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* 4. Eligibility */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Eligibility
                </label>
                <select
                  value={eligibility}
                  onChange={(e) => setEligibility(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  {ELIGIBILITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* 5. Search Action Button */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer h-[38px]"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Opportunities</span>
                </button>
              </div>
            </div>
          </form>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 2. CATEGORY FILTER TABS ROW                                              */}
      {/* ========================================================================= */}
      <section className="py-6 border-b border-slate-200/80 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = category === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setCategory(tab.id);
                    setPage(1);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer",
                    isActive
                      ? "bg-white border-blue-600 text-blue-600 shadow-sm ring-1 ring-blue-600"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-2xs"
                  )}
                >
                  <Icon className={cn("w-5 h-5 mb-1.5", isActive ? "text-blue-600" : "text-slate-500")} />
                  <span className="text-xs font-bold leading-tight truncate w-full">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 3. OPPORTUNITIES DIRECTORY & GRID                                        */}
      {/* ========================================================================= */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Results Bar & View Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {totalCount.toLocaleString()} Opportunities Found
              </h2>
              {loading && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
            </div>

            <div className="flex items-center gap-3">
              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span>Sort by</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="fresher">Fresher &amp; Entry Level First</option>
                  <option value="newest">Most Recent First</option>
                  <option value="closing_soon">Closing Soon</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-slate-200 rounded-lg bg-white p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    viewMode === "grid" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Opportunities Cards */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-700">Loading opportunities...</p>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-8">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No opportunities found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No active positions match your current search and filter selections. Try clearing filters or broadening your terms.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                  setOppType("All");
                  setField("All");
                  setLocation("All");
                  setEligibility("All");
                  setSort("fresher");
                  setPage(1);
                }}
                className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* 4-COLUMN RESPONSIVE GRID */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {opportunities.map((opp, idx) => {
                const oppId = (opp.id || opp.slug || `opp-${idx}`).toString();
                const oppTitle = opp.title || "Opportunity";
                const isSaved = !!bookmarkedIds[oppId];
                const catLabel = opp.category ? opp.category.toUpperCase() : "OPPORTUNITY";
                const deadlineInfo = formatDeadline(opp.deadline);
                const postedDateText = formatPostedDate((opp as any).posted_date || (opp as any).posted_at || opp.created_at);

                return (
                  <div
                    key={oppId}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-lg hover:border-blue-200 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Row: Logo & Category Badge & Bookmark */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50 flex items-center justify-center">
                            <ImageWithFallback
                              src={opp.organization_logo_url}
                              alt={`${opp.organization || "Organization"} logo`}
                              name={opp.organization}
                              variant="logo"
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-xl object-contain p-1"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider truncate max-w-[130px]">
                                {opp.organization || "Verified Org"}
                              </p>
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Verified</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleBookmark(oppId, oppTitle)}
                            aria-label={isSaved ? "Remove bookmark" : "Bookmark opportunity"}
                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            {isSaved ? (
                              <BookmarkCheck className="w-4 h-4 text-blue-600 fill-current" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Category Pill */}
                      <div className="mb-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider bg-blue-50 text-blue-700 border-blue-200">
                          {catLabel}
                        </span>
                      </div>

                      {/* Role Title */}
                      <Link href={`/opportunities/${opp.slug || oppId}`}>
                        <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                          {oppTitle}
                        </h3>
                      </Link>

                      {/* Snippet */}
                      <p className="text-xs text-slate-500 font-normal line-clamp-2 leading-relaxed mb-3">
                        {opp.description ||
                          `Explore verified opening at ${opp.organization || "top institution"} with direct application channels.`}
                      </p>

                      {/* Complete Date & Telemetry Block */}
                      <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 mb-3 space-y-2">
                        <div className="flex items-center justify-between text-[11px] gap-1">
                          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{postedDateText}</span>
                          </div>
                          <div className={`flex items-center gap-1 font-semibold text-[11px] truncate max-w-[130px] ${deadlineInfo.isUrgent ? 'text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200' : 'text-slate-600'}`}>
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{deadlineInfo.text}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/60 gap-1">
                          <div className="flex items-center gap-1 text-slate-600 truncate max-w-[125px]">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{opp.location || "Multiple Locations"}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-700 font-semibold truncate max-w-[135px]">
                            <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{opp.salary_range || (opp as any).stipend || "Industry Standard"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Eligibility / Education */}
                      {opp.eligibility && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-3">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{opp.eligibility}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions: View Details + Direct Apply */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Link
                        href={`/opportunities/${opp.slug || oppId}`}
                        className="text-xs font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1 transition-colors"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      {(opp.apply_url || (opp as any).apply_link) && (
                        <a
                          href={opp.apply_url || (opp as any).apply_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                        >
                          <span>Apply</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="space-y-3">
              {opportunities.map((opp, idx) => {
                const oppId = (opp.id || opp.slug || `opp-list-${idx}`).toString();
                const oppTitle = opp.title || "Opportunity";
                const isSaved = !!bookmarkedIds[oppId];
                const deadlineInfo = formatDeadline(opp.deadline);
                const postedDateText = formatPostedDate((opp as any).posted_date || (opp as any).posted_at || opp.created_at);

                return (
                  <div
                    key={oppId}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50 flex items-center justify-center">
                        <ImageWithFallback
                          src={opp.organization_logo_url}
                          alt={`${opp.organization || "Organization"} logo`}
                          name={opp.organization}
                          variant="logo"
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-xl object-contain p-1"
                        />
                      </div>

                      <div className="min-w-0 space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            {opp.organization || "Verified Organization"}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider bg-blue-50 text-blue-700 border-blue-200">
                            {opp.category || "OPPORTUNITY"}
                          </span>
                        </div>

                        <Link href={`/opportunities/${opp.slug || oppId}`}>
                          <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors truncate">
                            {oppTitle}
                          </h3>
                        </Link>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {postedDateText}
                          </span>
                          <span className={`flex items-center gap-1 font-semibold ${deadlineInfo.isUrgent ? 'text-amber-700' : 'text-slate-600'}`}>
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {deadlineInfo.text}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {opp.location || "Multiple Locations"}
                          </span>
                          <span className="flex items-center gap-1 text-slate-700 font-semibold">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            {opp.salary_range || (opp as any).stipend || "Industry Standard"}
                          </span>
                          {opp.eligibility && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate max-w-[200px]">{opp.eligibility}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => toggleBookmark(oppId, oppTitle)}
                        aria-label={isSaved ? "Remove bookmark" : "Bookmark opportunity"}
                        className="p-2 text-slate-400 hover:text-blue-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-4 h-4 text-blue-600 fill-current" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>

                      <Link
                        href={`/opportunities/${opp.slug || oppId}`}
                        className="px-3.5 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-lg transition-colors"
                      >
                        Details
                      </Link>

                      {(opp.apply_url || (opp as any).apply_link) && (
                        <a
                          href={opp.apply_url || (opp as any).apply_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>Apply</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-10 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Numeric Pagination */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (page > 1) {
                      setPage(page - 1);
                      fetchOpportunities(page - 1);
                    }
                  }}
                  disabled={page <= 1}
                  aria-label="Previous page"
                  className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pNum = i + 1;
                  if (totalPages > 5 && page > 3) {
                    pNum = page - 3 + i;
                    if (pNum > totalPages) pNum = totalPages - 4 + i;
                  }
                  const isCurrent = pNum === page;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => {
                        setPage(pNum);
                        fetchOpportunities(pNum);
                      }}
                      className={cn(
                        "w-9 h-9 rounded-lg text-xs font-bold transition-all shadow-2xs",
                        isCurrent
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      {pNum}
                    </button>
                  );
                })}

                {totalPages > 5 && page < totalPages - 2 && (
                  <>
                    <span className="px-1 text-slate-400 text-xs">...</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPage(totalPages);
                        fetchOpportunities(totalPages);
                      }}
                      className="w-9 h-9 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (page < totalPages) {
                      setPage(page + 1);
                      fetchOpportunities(page + 1);
                    }
                  }}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                  className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Showing stats */}
              <p className="text-xs text-slate-500 font-medium">
                Showing {totalCount > 0 ? (page - 1) * PAGE_LIMIT + 1 : 0}&ndash;
                {Math.min(page * PAGE_LIMIT, totalCount)} of {totalCount.toLocaleString()} opportunities
              </p>
            </div>
          )}

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 4. NEWSLETTER / SUBSCRIBE BANNER                                          */}
      {/* ========================================================================= */}
      <section className="py-8 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-linear-to-r from-blue-50/90 via-sky-50/60 to-blue-100/50 border border-blue-200/80 p-8 sm:p-12 overflow-hidden shadow-xs">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              {/* Left Copy */}
              <div className="lg:col-span-6 space-y-2">
                <div className="w-10 h-1 rounded-full bg-blue-600 mb-4" />
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Stay Updated with New Opportunities
                </h3>
                <p className="text-slate-600 text-sm font-normal max-w-md">
                  Get the latest internships, jobs, scholarships and research opportunities delivered to your inbox.
                </p>
              </div>

              {/* Right Form & Graphic */}
              <div className="lg:col-span-6 flex flex-col sm:flex-row items-center justify-end gap-6">
                <form onSubmit={handleNewsletterSubmit} className="w-full sm:max-w-md space-y-2.5">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        placeholder="Enter your email address"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={newsletterSubmitting}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shrink-0 shadow-2xs disabled:opacity-60 cursor-pointer"
                    >
                      {newsletterSubmitting ? "..." : "Subscribe"}
                    </button>
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={newsletterAgreed}
                      onChange={(e) => setNewsletterAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] text-slate-500 font-normal leading-tight">
                      I agree to receive updates from BerojgarDegreeWala.
                    </span>
                  </label>
                </form>

                {/* Floating Note Badge */}
                <div className="hidden sm:block text-center font-serif italic text-blue-800 rotate-6 shrink-0">
                  <div className="text-xl sm:text-2xl font-bold leading-tight">
                    Don&apos;t <br />
                    <span className="text-blue-600">Miss Out!</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 5. VALUE / TRUST STRIP                                                   */}
      {/* ========================================================================= */}
      <section className="py-12 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-3 shadow-2xs">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Be the First to Know</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Get early access to verified notifications &amp; deadlines.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-3 shadow-2xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Curated for You</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Only relevant and verified career opportunities.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center mb-3 shadow-2xs">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">No Spam</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                We value your inbox. Zero marketing clutter.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mb-3 shadow-2xs">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Join Our Community</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Students &amp; scholars actively advancing.
              </p>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}

