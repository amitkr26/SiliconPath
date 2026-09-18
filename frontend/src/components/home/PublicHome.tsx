"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search, ArrowRight, Microscope, Briefcase, UserCheck, GraduationCap,
  Star, Globe, Trophy, Bookmark, BookmarkCheck, Calendar, MapPin,
  Bell, Mail, Play, CheckCircle2, Clock, AlertCircle,
  ExternalLink, Sparkles, Building2, Users, Zap
} from "lucide-react";
import type { Opportunity, NewsArticle } from "@/types";
import { toast } from "sonner";
import { FOOTER_SOCIAL_LINKS } from "@/config/socials";
import { SocialIcon } from "@/components/ui/SocialIcons";
import { resolveHardwareNewsImage, resolveNewsDomainBadge } from "@/lib/hardware-images";

interface PublicHomeProps {
  stats: {
    total: number;
    jrf: number;
    phd: number;
    govt: number;
    verified: number;
    orgs?: number;
  };
  latestOpenings: Opportunity[];
  latestNews?: NewsArticle[];
}

const CATEGORIES = [
  {
    name: "VLSI & ASIC Design",
    href: "/opportunities?field=vlsi",
    icon: Sparkles,
    iconBg: "bg-indigo-50 text-indigo-600",
  },
  {
    name: "Embedded & Firmware",
    href: "/opportunities?field=embedded",
    icon: Briefcase,
    iconBg: "bg-blue-50 text-blue-600",
  },
  {
    name: "Semiconductor & Fab",
    href: "/opportunities?field=semiconductor",
    icon: Building2,
    iconBg: "bg-emerald-50 text-emerald-600",
  },
  {
    name: "Analog & RF Circuits",
    href: "/opportunities?field=analog",
    icon: Zap,
    iconBg: "bg-amber-50 text-amber-600",
  },
  {
    name: "Research (JRF & PhD)",
    href: "/opportunities?category=jrf",
    icon: Microscope,
    iconBg: "bg-teal-50 text-teal-600",
  },
  {
    name: "Govt & Space Electronics",
    href: "/opportunities?category=govt-job",
    icon: Star,
    iconBg: "bg-purple-50 text-purple-600",
  },
];

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

export default function PublicHome({ stats, latestOpenings, latestNews = [] }: PublicHomeProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterAgreed, setNewsletterAgreed] = useState(true);
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/opportunities?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/opportunities");
    }
  };

  const toggleBookmark = (id: string, title: string) => {
    setBookmarkedIds((prev) => {
      const next = !prev[id];
      if (next) {
        toast.success(`Saved "${title.slice(0, 30)}..." to your bookmarks.`);
      } else {
        toast.info("Opportunity removed from bookmarks.");
      }
      return { ...prev, [id]: next };
    });
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newsletterEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!newsletterAgreed) {
      toast.error("Please agree to receive opportunity updates.");
      return;
    }

    setNewsletterSubmitting(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Subscribed successfully! Check your inbox for weekly alerts.");
        setNewsletterEmail("");
      } else if (res.status === 409) {
        toast.info("This email is already subscribed to updates.");
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

  // Use only real data from DB — no fake fallbacks
  const displayOpportunities = (latestOpenings && latestOpenings.length > 0)
    ? latestOpenings.slice(0, 4).map((opp, idx) => {
        const oppId = opp.id || `opp-${idx}`;
        const orgName = opp.organization || "Verified Organization";
        const postedDateStr = formatPostedDate(opp.posted_date || (opp as any).posted_at || (opp as any).created_at);
        const deadlineInfo = formatDeadline(opp.deadline);
        const isVerified = (opp as any).verification_status === "verified" || !(opp as any).verification_status;
        const applyLink = opp.apply_url || (opp as any).apply_link || opp.source_url || `/opportunities/${opp.slug || oppId}`;
        const isExternalApply = !!(opp.apply_url || (opp as any).apply_link || opp.source_url);

        return {
          id: oppId,
          title: opp.title || "Opportunity",
          organization: orgName,
          isVerified,
          category: opp.category ? opp.category.toUpperCase() : "OPPORTUNITY",
          categoryClass: idx % 4 === 0
            ? "bg-cyan-50 text-cyan-700 border-cyan-200"
            : idx % 4 === 1
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : idx % 4 === 2
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-purple-50 text-purple-700 border-purple-200",
          location: opp.location || "Multiple Locations, India",
          postedDate: postedDateStr,
          deadlineInfo,
          compensation: (opp as any).salary || (opp as any).stipend || (opp as any).salary_range || null,
          applyLink,
          isExternalApply,
          logoText: orgName.slice(0, 4).toUpperCase(),
          logoBg: idx % 4 === 0
            ? "bg-orange-50 text-orange-600 border-orange-100"
            : idx % 4 === 1
            ? "bg-blue-50 text-blue-600 border-blue-100"
            : idx % 4 === 2
            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
            : "bg-purple-50 text-purple-600 border-purple-100",
          slug: opp.slug || oppId,
        };
      })
    : [];

  // Use only real news from DB with authentic hardware imagery & real domain tags
  const displayNews = (latestNews && latestNews.length > 0)
    ? latestNews.slice(0, 3).map((item, idx) => {
        const badge = resolveNewsDomainBadge(item);
        return {
          id: item.id,
          slug: item.slug || item.id,
          title: item.title,
          tag: badge.label,
          tagClass: badge.badgeClass,
          source: item.source || (item as any).source_name || "Official Source",
          source_url: item.source_url || (item as any).url || null,
          date: item.published_at
            ? new Date(item.published_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
            : "Recent",
          image: resolveHardwareNewsImage(item, idx),
        };
      })
    : [];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900">

      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="pt-10 sm:pt-14 pb-16 sm:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* LEFT COLUMN (~52%) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-block">
              <span className="text-xs sm:text-[13px] font-bold tracking-widest text-slate-500 uppercase">
                YOUR FUTURE STARTS HERE
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              Real Opportunities <br />
              for <span className="text-blue-600">Brighter Tomorrows.</span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl font-normal">
              Explore internships, research positions, jobs, scholarships and fellowships from top organizations across India and worldwide — all in one place.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/opportunities"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base shadow-md shadow-blue-500/20 hover:shadow-lg transition-all active:scale-[0.98]"
              >
                <span>Explore Opportunities</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => setVideoModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm sm:text-base shadow-2xs transition-all active:scale-[0.98]"
              >
                <span>Watch Video</span>
                <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-blue-600">
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                </div>
              </button>
            </div>

            {/* 4 MICRO-STATS ROW */}
            <div className="pt-8 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              {/* 1. Active Opportunities */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                    {stats.total > 0 ? `${stats.total.toLocaleString()}+` : "—"}
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
                    Active Opportunities
                  </div>
                </div>
              </div>

              {/* 2. Trusted Organizations */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                    {stats.orgs ? `${stats.orgs.toLocaleString()}+` : "—"}
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
                    Trusted Organizations
                  </div>
                </div>
              </div>

              {/* 3. JRF/PhD */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                    {(stats.jrf + stats.phd) > 0 ? `${(stats.jrf + stats.phd).toLocaleString()}+` : "—"}
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
                    Research &amp; PhD
                  </div>
                </div>
              </div>

              {/* 4. Verified */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                    {stats.verified > 0 ? `${stats.verified.toLocaleString()}+` : "—"}
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
                    Verified Listings
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN (~48%): HERO IMAGE */}
          <div className="lg:col-span-6 relative">
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-100 bg-slate-50">
              <Image
                src="/images/homepage/heroimg.png"
                alt="Students collaborating outside campus on BerojgarDegreeWala"
                fill
                priority
                unoptimized
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />

              {/* Floating cursive accent badge */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-lg border border-white/60 text-right hidden sm:block">
                <p className="font-serif italic text-blue-950 text-base sm:text-lg font-bold leading-tight">
                  Opportunities Today.
                </p>
                <p className="font-serif italic text-blue-600 text-base sm:text-lg font-bold leading-tight">
                  A Brighter Tomorrow.
                </p>
                <div className="w-20 h-1 bg-amber-400 rounded-full mt-1.5 ml-auto" />
              </div>

              {/* Bottom-left overlay items */}
              <div className="absolute bottom-4 left-4 hidden sm:flex items-center gap-3">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm border border-white/60">
                  <p className="font-serif italic text-xs font-bold text-slate-800 leading-tight">
                    Learn<br />Explore<br />Grow<br />Succeed
                  </p>
                </div>
                <div className="bg-blue-600/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm">
                  <p className="text-[10px] font-bold text-white leading-tight">
                    Better Skills<br />Brighter Futures
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 2. EXPLORE BY CATEGORY                                                    */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                EXPLORE BY CATEGORY
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Find Opportunities Across <span className="text-blue-600">Your Interests</span>
              </h2>
            </div>

            <Link
              href="/opportunities"
              className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 group shrink-0"
            >
              <span>Not sure where to start? <span className="text-blue-600 font-bold">Browse all opportunities</span></span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* 7-Card Responsive Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
            {CATEGORIES.map(({ name, href, icon: Icon, iconBg }) => (
              <Link
                key={name}
                href={href}
                className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-md transition-all flex flex-col items-center justify-between text-center group active:scale-[0.98]"
              >
                <div className={`w-11 h-11 rounded-full ${iconBg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors mb-1">
                  {name}
                </div>

                <div className="text-xs font-semibold text-slate-400 group-hover:text-blue-600 flex items-center gap-1 transition-colors">
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 3. FEATURED OPPORTUNITIES                                                 */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 bg-slate-50/50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                FEATURED OPPORTUNITIES
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Handpicked for <span className="text-blue-600">You</span>
              </h2>
            </div>

            <Link
              href="/opportunities"
              className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group shrink-0"
            >
              <span>View all opportunities</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* 4 Cards Grid */}
          {displayOpportunities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {displayOpportunities.map((opp) => {
                const isBookmarked = opp.id ? !!bookmarkedIds[opp.id] : false;
                return (
                  <div
                    key={opp.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-lg hover:border-blue-200 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Row: Organization, Verified Badge, Bookmark */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {opp.organization}
                          </span>
                          {opp.isVerified && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              Verified
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => opp.id && toggleBookmark(opp.id, opp.title)}
                          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark opportunity"}
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                        >
                          {isBookmarked ? (
                            <BookmarkCheck className="w-4 h-4 text-blue-600 fill-current" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Category pill */}
                      <div className="mb-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${opp.categoryClass}`}>
                          {opp.category}
                        </span>
                      </div>

                      {/* Role Title */}
                      <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-3">
                        <Link href={`/opportunities/${opp.slug}`}>
                          {opp.title}
                        </Link>
                      </h3>

                      {/* Meta info with explicit Dates */}
                      <div className="space-y-1.5 text-xs text-slate-500 font-normal">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="font-semibold text-slate-700">{opp.postedDate}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className={opp.deadlineInfo.isUrgent ? "text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded" : "text-slate-600"}>
                            {opp.deadlineInfo.text}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{opp.location}</span>
                        </div>

                        {opp.compensation && (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold truncate">
                            <Briefcase className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{opp.compensation}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action: View Details & Direct Apply */}
                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Link
                        href={`/opportunities/${opp.slug}`}
                        className="text-xs font-bold text-slate-600 hover:text-blue-600 inline-flex items-center gap-1 group/btn"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>

                      {opp.isExternalApply ? (
                        <a
                          href={opp.applyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs hover:shadow-sm transition-all"
                        >
                          <span>Apply</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <Link
                          href={`/opportunities/${opp.slug}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs hover:shadow-sm transition-all"
                        >
                          <span>Apply</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">No featured opportunities at the moment.</p>
              <Link href="/opportunities" className="text-xs font-bold text-blue-600 hover:text-blue-700 mt-2 inline-flex items-center gap-1">
                <span>Browse all opportunities</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 4. LATEST NEWS & UPDATES                                                  */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                LATEST NEWS &amp; UPDATES
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Stay Informed, <span className="text-blue-600">Stay Ahead</span>
              </h2>
            </div>

            <Link
              href="/news"
              className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group shrink-0"
            >
              <span>View all news</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* 4-Column Grid: 3 Articles + 1 Newsletter */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 3 ARTICLE CARDS */}
            {displayNews.map((article) => (
              <article
                key={article.id}
                className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Article Thumbnail */}
                  <div className="relative w-full h-40 bg-slate-100 overflow-hidden">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${article.tagClass}`}>
                        {article.tag}
                      </span>
                    </div>
                  </div>

                  {/* Article Body */}
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                      <Link href={`/news/${article.slug}`}>
                        {article.title}
                      </Link>
                    </h3>
                  </div>
                </div>

                {/* Article Footer */}
                <div className="p-4 pt-0 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{article.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {article.source_url && (
                      <a
                        href={article.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50/80 px-2 py-0.5 rounded-md hover:bg-blue-100 transition"
                        title={`Read on ${article.source}`}
                      >
                        <span className="truncate max-w-[85px]">{article.source}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    )}
                    <Link
                      href={`/news/${article.slug}`}
                      className="p-1 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all"
                      aria-label={`Read article ${article.title}`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}

            {/* 1 NEWSLETTER SUBSCRIPTION CARD */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs flex flex-col justify-between text-center">
              <div>
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/20">
                  <Bell className="w-6 h-6" />
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug mb-4">
                  Get the latest updates delivered to your inbox.
                </h3>

                <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={newsletterSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-xl shadow-xs transition-all disabled:opacity-60"
                  >
                    {newsletterSubmitting ? "Subscribing..." : "Subscribe"}
                  </button>

                  <label className="flex items-start gap-2 text-left cursor-pointer pt-1">
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
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 5. DEEP-TECH HARDWARE NETWORK BANNER                                      */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-8 sm:p-12 lg:p-16 shadow-xl border border-slate-800">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#60a5fa_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* LEFT: TEXT & CALL TO ACTIONS (~60%) */}
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>INDIA SEMICONDUCTOR &amp; HARDWARE NETWORK</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                  Accelerate Your Path in <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
                    Semiconductors &amp; Deep-Tech
                  </span>
                </h2>

                <p className="text-slate-300 text-sm sm:text-base font-normal leading-relaxed max-w-lg">
                  Direct access to verified DRDO, ISRO, and CSIR research circulars, VLSI chip design openings, and premier fabrication careers &mdash; 100% free and verified with zero middle-agents.
                </p>

                {/* ACTION BUTTONS */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Link
                    href="/opportunities"
                    className="inline-flex items-center gap-2.5 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
                  >
                    <span>Browse All Opportunities</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/organizations"
                    className="inline-flex items-center gap-2.5 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl border border-white/20 backdrop-blur-xs transition-all active:scale-[0.98]"
                  >
                    <Building2 className="w-4 h-4 text-blue-300" />
                    <span>100+ Verified Labs</span>
                  </Link>
                </div>
              </div>

              {/* RIGHT: HARDWARE SHOWCASE CARD (~40%) */}
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-slate-900/80 backdrop-blur-md">
                  <div className="relative w-full h-48 sm:h-56 overflow-hidden">
                    <Image
                      src="/images/hardware/semiconductor-cleanroom-fab.jpg"
                      alt="Semiconductor Fabrication Facility"
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 40vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-600/90 text-white backdrop-blur-xs">
                        LIVE RADAR
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="font-semibold text-white">Silicon Bharat Intelligence</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-base font-extrabold text-white">350+</div>
                        <div className="text-[10px] text-slate-400">Core Vacancies</div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-base font-extrabold text-blue-400">100+</div>
                        <div className="text-[10px] text-slate-400">Labs &amp; Fabs</div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-base font-extrabold text-emerald-400">100%</div>
                        <div className="text-[10px] text-slate-400">Free Forever</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>




      {/* ========================================================================= */}
      {/* VIDEO MODAL                                                               */}
      {/* ========================================================================= */}
      {videoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          onClick={() => setVideoModalOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl bg-white rounded-2xl overflow-hidden shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">
                About BerojgarDegreeWala
              </h3>
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm px-2 py-1 rounded"
              >
                ✕ Close
              </button>
            </div>

            <div className="py-6 space-y-4">
              <div className="relative aspect-video rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden">
                <Image
                  src="/images/homepage/heroimg.png"
                  alt="Video thumbnail"
                  fill
                  unoptimized
                  className="object-cover opacity-80"
                />
                <div className="relative z-10 text-center p-4">
                  <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/50">
                    <Play className="w-8 h-8 fill-current ml-1" />
                  </div>
                  <p className="text-white font-bold text-base drop-shadow-md">
                    BerojgarDegreeWala Platform Overview
                  </p>
                  <p className="text-slate-200 text-xs mt-1 drop-shadow-sm">
                    Empowering students across India with verified career circulars
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Link
                href="/opportunities"
                onClick={() => setVideoModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition"
              >
                Browse Opportunities Now
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
