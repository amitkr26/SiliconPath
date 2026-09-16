"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search, X, MapPin, ArrowRight, Building2, Sparkles, ChevronLeft,
  ChevronRight, Bookmark, BookmarkCheck, Mail, CheckCircle2, ChevronDown,
  Layers, Compass, Globe2
} from "lucide-react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface OrgItem {
  name: string;
  slug: string;
  type?: string;
  location?: string;
  website?: string | null;
  logo_url?: string | null;
  description?: string;
  count: number;
}

interface Props {
  initialOrganizations: OrgItem[];
}

const TYPE_OPTIONS = [
  { value: "All", label: "All Types" },
  { value: "Defence", label: "Government Defence & Space" },
  { value: "Academic", label: "Premier Academic Institution" },
  { value: "Semiconductor", label: "Semiconductor IDM & Fabless" },
  { value: "Research", label: "National Research Institute" },
];

const SECTOR_OPTIONS = [
  { value: "All", label: "All Sectors" },
  { value: "Space", label: "Space & Satellite Payloads" },
  { value: "Defence", label: "Defence & Strategic Systems" },
  { value: "VLSI", label: "VLSI & Digital ASIC" },
  { value: "Fabless", label: "Fabless Semiconductor" },
  { value: "AI", label: "AI Hardware & Architecture" },
];

const LOCATION_OPTIONS = [
  { value: "All", label: "All Locations" },
  { value: "Bengaluru", label: "Bengaluru, Karnataka" },
  { value: "Hyderabad", label: "Hyderabad, Telangana" },
  { value: "Pune", label: "Pune, Maharashtra" },
  { value: "Delhi", label: "Delhi / NCR" },
  { value: "Mumbai", label: "Mumbai, Maharashtra" },
  { value: "Chennai", label: "Chennai, Tamil Nadu" },
  { value: "International", label: "International / Global" },
];

const OPPORTUNITY_OPTIONS = [
  { value: "All", label: "All Opportunities" },
  { value: "Active", label: "Active Openings (1+)" },
  { value: "High", label: "High Volume (10+)" },
  { value: "VeryHigh", label: "Top Recruiters (20+)" },
];

function getLocalBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("BerojgarDegreeWala_org_bookmarks");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setLocalBookmarks(ids: string[]) {
  localStorage.setItem("BerojgarDegreeWala_org_bookmarks", JSON.stringify(ids));
}

export default function OrganizationsClient({ initialOrganizations }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sectorFilter, setSectorFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [oppFilter, setOppFilter] = useState("All");
  const [sort, setSort] = useState<"most" | "az" | "newest">("most");
  const [page, setPage] = useState(1);
  const PAGE_LIMIT = 12;

  // Bookmarks
  const [bookmarkedOrgs, setBookmarkedOrgs] = useState<Record<string, boolean>>({});

  // Newsletter
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterAgreed, setNewsletterAgreed] = useState(true);
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);

  // Initialize bookmarks
  useMemo(() => {
    const saved = getLocalBookmarks();
    const map: Record<string, boolean> = {};
    saved.forEach((slug) => {
      map[slug] = true;
    });
    setBookmarkedOrgs(map);
  }, []);

  const toggleBookmark = (slug: string, name: string) => {
    const current = getLocalBookmarks();
    let updated: string[];
    const isSaved = current.includes(slug);

    if (isSaved) {
      updated = current.filter((s) => s !== slug);
      setBookmarkedOrgs((prev) => {
        const next = { ...prev };
        delete next[slug];
        return next;
      });
      toast.success(`Removed ${name} from saved organizations.`);
    } else {
      updated = [...current, slug];
      setBookmarkedOrgs((prev) => ({ ...prev, [slug]: true }));
      toast.success(`Saved ${name}.`);
    }
    setLocalBookmarks(updated);
  };

  // Top 4 Featured Organizations
  const featuredOrgs = useMemo(() => {
    return initialOrganizations.slice(0, 4);
  }, [initialOrganizations]);

  // Filtered organizations
  const filtered = useMemo(() => {
    const list = initialOrganizations.filter((org) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        org.name.toLowerCase().includes(q) ||
        (org.type && org.type.toLowerCase().includes(q)) ||
        (org.location && org.location.toLowerCase().includes(q)) ||
        (org.description && org.description.toLowerCase().includes(q));

      let matchesType = true;
      if (typeFilter !== "All") {
        matchesType = (org.type || "").toLowerCase().includes(typeFilter.toLowerCase());
      }

      let matchesSector = true;
      if (sectorFilter !== "All") {
        matchesSector =
          (org.type || "").toLowerCase().includes(sectorFilter.toLowerCase()) ||
          (org.description || "").toLowerCase().includes(sectorFilter.toLowerCase());
      }

      let matchesLocation = true;
      if (locationFilter !== "All") {
        matchesLocation = (org.location || "").toLowerCase().includes(locationFilter.toLowerCase());
      }

      let matchesOpp = true;
      if (oppFilter === "Active") {
        matchesOpp = org.count > 0;
      } else if (oppFilter === "High") {
        matchesOpp = org.count >= 10;
      } else if (oppFilter === "VeryHigh") {
        matchesOpp = org.count >= 20;
      }

      return matchesSearch && matchesType && matchesSector && matchesLocation && matchesOpp;
    });

    if (sort === "most") {
      list.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    } else if (sort === "az") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [initialOrganizations, search, typeFilter, sectorFilter, locationFilter, oppFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_LIMIT));
  const paginatedOrgs = useMemo(() => {
    const start = (page - 1) * PAGE_LIMIT;
    return filtered.slice(start, start + PAGE_LIMIT);
  }, [filtered, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
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
        toast.success("Subscribed successfully! You will receive organization & partnership updates.");
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
    <div className="space-y-12">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION & SEARCH                                                 */}
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
                <span>Organizations</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Partnering for a <br />
                <span className="text-blue-600">Brighter Tomorrow</span>
              </h1>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl">
                Discover leading organizations offering internships, research opportunities, jobs, scholarships and more. Connect with trusted institutions that invest in your future.
              </p>
            </div>

            {/* Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative h-[260px] sm:h-[300px] lg:h-[340px] w-full rounded-2xl overflow-hidden shadow-elevated border border-slate-200 bg-slate-100">
                <Image
                  src="/images/hero-organizations-campus.png"
                  alt="Modern campus and tech research park"
                  fill
                  unoptimized
                  priority
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 500px"
                />

                {/* Floating Tagline Badge */}
                <div className="absolute right-4 top-4 bg-white/90 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-xs hidden sm:block">
                  <div className="font-serif italic text-xs font-bold text-slate-800 leading-tight">
                    Great Organizations <br />
                    <span className="text-blue-600">Build Greater Futures.</span>
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
                placeholder="Search organizations (e.g., Google, ISRO, Microsoft, TCS, DRDO, IIT)..."
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
              {/* 1. Organization Type */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Organization Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* 2. Sector */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Sector
                </label>
                <select
                  value={sectorFilter}
                  onChange={(e) => {
                    setSectorFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  {SECTOR_OPTIONS.map((opt) => (
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
                  value={locationFilter}
                  onChange={(e) => {
                    setLocationFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  {LOCATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* 4. Opportunities */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Opportunities
                </label>
                <select
                  value={oppFilter}
                  onChange={(e) => {
                    setOppFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  {OPPORTUNITY_OPTIONS.map((opt) => (
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
                  <span>Search</span>
                </button>
              </div>
            </div>
          </form>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 2. FEATURED ORGANIZATIONS                                                */}
      {/* ========================================================================= */}
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Featured Organizations
            </h2>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("all-organizations");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
            >
              <span>View all organizations</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* 4 Wide Featured Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {featuredOrgs.map((org) => {
              const sectorLabel = org.type || "Space & Research";
              const isSaved = !!bookmarkedOrgs[org.slug];

              return (
                <div
                  key={org.slug}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-lg hover:border-blue-200 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Logo & Featured Badge */}
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-white flex items-center justify-center">
                        <ImageWithFallback
                          src={org.logo_url}
                          alt={`${org.name} logo`}
                          name={org.name}
                          variant="logo"
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-xl object-contain p-1"
                        />
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider bg-purple-50 text-purple-700 border-purple-200">
                        Featured
                      </span>
                    </div>

                    {/* Organization Name */}
                    <Link href={`/opportunities?search=${encodeURIComponent(org.name)}`}>
                      <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-1 mb-2">
                        {org.name}
                      </h3>
                    </Link>

                    {/* Description */}
                    <p className="text-xs text-slate-500 font-normal line-clamp-2 leading-relaxed mb-4">
                      {org.description || `Pioneering R&D and career positions across Indian deep-tech sectors.`}
                    </p>

                    {/* Metadata */}
                    <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-1.5 truncate">
                        <Compass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{sectorLabel}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{org.location || "Multiple Locations"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate font-semibold text-slate-700">
                        <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{org.count} Opportunities</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/opportunities?search=${encodeURIComponent(org.name)}`}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group/link"
                    >
                      <span>View Profile</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>

                    <Link
                      href={`/opportunities?search=${encodeURIComponent(org.name)}`}
                      className="w-7 h-7 rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center transition-colors"
                      aria-label={`View ${org.name}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 3. ALL ORGANIZATIONS (6-COL RESPONSIVE GRID)                             */}
      {/* ========================================================================= */}
      <section id="all-organizations" className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header & Sort Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-6 border-t border-slate-200/80">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              All Organizations
            </h2>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span>Sort by</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="most">Most Opportunities</option>
                  <option value="az">Name (A&ndash;Z)</option>
                </select>
              </div>

              <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
                Showing {filtered.length > 0 ? (page - 1) * PAGE_LIMIT + 1 : 0}&ndash;
                {Math.min(page * PAGE_LIMIT, filtered.length)} of {filtered.length} organizations
              </span>
            </div>
          </div>

          {/* 6-Column Organizations Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No organizations found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No organizations match your current search and filter selections.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("All");
                  setSectorFilter("All");
                  setLocationFilter("All");
                  setOppFilter("All");
                  setPage(1);
                }}
                className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {paginatedOrgs.map((org) => {
                const isSaved = !!bookmarkedOrgs[org.slug];

                return (
                  <div
                    key={org.slug}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Logo and Bookmark */}
                      <div className="flex items-start justify-between gap-1.5 mb-2.5">
                        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-white flex items-center justify-center">
                          <ImageWithFallback
                            src={org.logo_url}
                            alt={`${org.name} logo`}
                            name={org.name}
                            variant="logo"
                            width={44}
                            height={44}
                            className="w-11 h-11 rounded-xl object-contain p-1"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleBookmark(org.slug, org.name)}
                          aria-label={isSaved ? "Remove bookmark" : "Bookmark organization"}
                          className="p-1 text-slate-300 hover:text-blue-600 transition-colors"
                        >
                          {isSaved ? (
                            <BookmarkCheck className="w-4 h-4 text-blue-600 fill-current" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Name */}
                      <Link href={`/opportunities?search=${encodeURIComponent(org.name)}`}>
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors truncate mb-1">
                          {org.name}
                        </h3>
                      </Link>

                      {/* Location */}
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate mb-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{org.location || "Multiple Locations"}</span>
                      </p>

                      {/* Count */}
                      <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 truncate">
                        <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{org.count} Opportunities</span>
                      </p>
                    </div>

                    {/* Bottom arrow circle */}
                    <div className="pt-3 mt-2 border-t border-slate-100 flex justify-end">
                      <Link
                        href={`/opportunities?search=${encodeURIComponent(org.name)}`}
                        className="w-6 h-6 rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center transition-colors"
                        aria-label={`View ${org.name}`}
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 pt-6 border-t border-slate-200/80 flex items-center justify-center sm:justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                      onClick={() => setPage(pNum)}
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
                      onClick={() => setPage(totalPages)}
                      className="w-9 h-9 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                  className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Page {page} of {totalPages}
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
                  Stay Updated with New Organizations
                </h3>
                <p className="text-slate-600 text-sm font-normal max-w-md">
                  Get the latest updates about new organizations, partnership announcements and exciting opportunities.
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
                    More Partners <br />
                    <span className="text-blue-600">More Opportunities for You!</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}

