"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search, ArrowRight, Microscope, Briefcase, UserCheck, GraduationCap,
  Star, Globe, Trophy, Bookmark, BookmarkCheck, Calendar, MapPin,
  Bell, Mail, Play, ChevronLeft, ChevronRight, CheckCircle2,
  ExternalLink, Sparkles, Building2, Users
} from "lucide-react";
import type { Opportunity, NewsArticle } from "@/types";
import { toast } from "sonner";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { FOOTER_SOCIAL_LINKS } from "@/config/socials";
import { SocialIcon } from "@/components/ui/SocialIcons";

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
    name: "Research",
    count: "2,500+",
    href: "/opportunities?category=jrf",
    icon: Microscope,
    iconBg: "bg-teal-50 text-teal-600",
  },
  {
    name: "Internships",
    count: "3,000+",
    href: "/opportunities?category=internship",
    icon: Briefcase,
    iconBg: "bg-blue-50 text-blue-600",
  },
  {
    name: "Jobs",
    count: "1,500+",
    href: "/opportunities?category=full-time",
    icon: UserCheck,
    iconBg: "bg-emerald-50 text-emerald-600",
  },
  {
    name: "Scholarships",
    count: "800+",
    href: "/opportunities?category=scholarship",
    icon: GraduationCap,
    iconBg: "bg-amber-50 text-amber-600",
  },
  {
    name: "Fellowships",
    count: "600+",
    href: "/opportunities?category=fellowship",
    icon: Star,
    iconBg: "bg-yellow-50 text-yellow-600",
  },
  {
    name: "Study Abroad",
    count: "400+",
    href: "/opportunities?category=fellowship",
    icon: Globe,
    iconBg: "bg-sky-50 text-sky-600",
  },
  {
    name: "Competitions",
    count: "300+",
    href: "/opportunities?category=govt",
    icon: Trophy,
    iconBg: "bg-purple-50 text-purple-600",
  },
];

const DEFAULT_FEATURED = [
  {
    id: "isro-internship",
    title: "Research Internship at ISRO",
    organization: "ISRO",
    category: "Research",
    categoryClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
    location: "Bengaluru, India",
    deadline: "Oct 15, 2026",
    logoText: "ISRO",
    logoBg: "bg-orange-50 text-orange-600 border-orange-100",
    slug: "research-internship-at-isro",
  },
  {
    id: "google-swe",
    title: "Software Engineering Internship 2026",
    organization: "Google",
    category: "Internship",
    categoryClass: "bg-blue-50 text-blue-700 border-blue-200",
    location: "Multiple Locations",
    deadline: "Oct 20, 2026",
    logoText: "G",
    logoBg: "bg-blue-50 text-blue-600 border-blue-100",
    slug: "software-engineering-internship-2026",
  },
  {
    id: "msft-pm",
    title: "Associate Product Manager",
    organization: "Microsoft",
    category: "Job",
    categoryClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    location: "Bengaluru, India",
    deadline: "Oct 25, 2026",
    logoText: "MS",
    logoBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
    slug: "associate-product-manager",
  },
  {
    id: "tata-scholars",
    title: "Tata Scholars Program 2026",
    organization: "Tata Trusts",
    category: "Scholarship",
    categoryClass: "bg-purple-50 text-purple-700 border-purple-200",
    location: "Across India",
    deadline: "Nov 05, 2026",
    logoText: "TATA",
    logoBg: "bg-purple-50 text-purple-600 border-purple-100",
    slug: "tata-scholars-program-2026",
  },
];

const TESTIMONIALS = [
  {
    name: "Ananya Sharma",
    role: "Research Intern, IISc",
    quote: "BDW helped me find a research internship at IISc. It was the perfect start to my career!",
    avatar: "",
    rating: 5,
  },
  {
    name: "Rohan Mehta",
    role: "Software Engineer, Google",
    quote: "I found my dream job through BerojgarDegreeWala. The platform is truly a game-changer!",
    avatar: "",
    rating: 5,
  },
  {
    name: "Priya Nair",
    role: "MS Student, University of Toronto",
    quote: "The scholarship opportunities on BDW helped me pursue my higher studies abroad.",
    avatar: "",
    rating: 5,
  },
];

const FALLBACK_NEWS = [
  {
    id: "isro-fellowship-2026",
    slug: "isro-announces-new-research-fellowship-program-2026",
    title: "ISRO Announces New Research Fellowship Program 2026",
    tag: "ANNOUNCEMENT",
    tagClass: "bg-blue-600 text-white",
    date: "Sep 12, 2026",
    image: "https://images.unsplash.com/photo-1517976487502-520f92475c74?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "top-10-skills-2026",
    slug: "top-10-skills-to-boost-your-career-in-2026",
    title: "Top 10 Skills to Boost Your Career in 2026",
    tag: "CAREER TIPS",
    tagClass: "bg-indigo-600 text-white",
    date: "Sep 10, 2026",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "study-abroad-guide-2026",
    slug: "complete-guide-to-study-abroad-opportunities",
    title: "Complete Guide to Study Abroad Opportunities",
    tag: "GUIDE",
    tagClass: "bg-amber-600 text-white",
    date: "Sep 08, 2026",
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=600&q=80",
  },
];

export default function PublicHome({ stats, latestOpenings, latestNews = [] }: PublicHomeProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterAgreed, setNewsletterAgreed] = useState(true);
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

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

  // Prepare 4 featured opportunities from DB or clean defaults
  const displayOpportunities = (latestOpenings && latestOpenings.length >= 4)
    ? latestOpenings.slice(0, 4).map((opp, idx) => {
        const oppId = opp.id || `opp-${idx}`;
        const orgName = opp.organization || "Verified Organization";
        return {
          id: oppId,
          title: opp.title || "Opportunity",
          organization: orgName,
          category: opp.category ? opp.category.toUpperCase() : "OPPORTUNITY",
          categoryClass: idx % 4 === 0
            ? "bg-cyan-50 text-cyan-700 border-cyan-200"
            : idx % 4 === 1
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : idx % 4 === 2
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-purple-50 text-purple-700 border-purple-200",
          location: opp.location || "Multiple Locations, India",
          deadline: opp.deadline
            ? new Date(opp.deadline).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
            : "Rolling Applications",
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
    : DEFAULT_FEATURED;

  // Prepare news articles (top 3)
  const displayNews = (latestNews && latestNews.length >= 3)
    ? latestNews.slice(0, 3).map((item, idx) => ({
        id: item.id,
        slug: item.slug || item.id,
        title: item.title,
        tag: idx === 0 ? "ANNOUNCEMENT" : idx === 1 ? "CAREER TIPS" : "GUIDE",
        tagClass: idx === 0 ? "bg-blue-600 text-white" : idx === 1 ? "bg-indigo-600 text-white" : "bg-amber-600 text-white",
        date: item.published_at
          ? new Date(item.published_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
          : "Recent",
        image: item.image_url || FALLBACK_NEWS[idx % 3].image,
      }))
    : FALLBACK_NEWS;

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
                    10,000+
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
                    {stats.orgs ? `${stats.orgs}+` : "500+"}
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
                    Trusted Organizations
                  </div>
                </div>
              </div>

              {/* 3. Categories */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                    100+
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
                    Categories
                  </div>
                </div>
              </div>

              {/* 4. Global */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                    Global
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
                    Opportunities
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
            {CATEGORIES.map(({ name, count, href, icon: Icon, iconBg }) => (
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
                  <span>{count}</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {displayOpportunities.map((opp) => {
              const isBookmarked = opp.id ? !!bookmarkedIds[opp.id] : false;
              return (
                <div
                  key={opp.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-lg hover:border-blue-200 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Logo, Tag & Bookmark */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className={`px-2.5 py-1 rounded-md text-xs font-bold border ${opp.logoBg}`}>
                        {opp.logoText}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${opp.categoryClass}`}>
                          {opp.category}
                        </span>

                        <button
                          type="button"
                          onClick={() => opp.id && toggleBookmark(opp.id, opp.title)}
                          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark opportunity"}
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          {isBookmarked ? (
                            <BookmarkCheck className="w-4 h-4 text-blue-600 fill-current" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Role Title */}
                    <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-3">
                      <Link href={`/opportunities/${opp.slug}`}>
                        {opp.title}
                      </Link>
                    </h3>

                    {/* Meta info */}
                    <div className="space-y-1.5 text-xs text-slate-500 font-normal">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{opp.location}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{opp.deadline}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <Link
                      href={`/opportunities/${opp.slug}`}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 group/btn"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

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
                  <Link
                    href={`/news/${article.slug}`}
                    className="p-1 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
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
      {/* 5. SUCCESS STORIES                                                        */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 bg-slate-50/50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="flex items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                SUCCESS STORIES
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Real People. <span className="text-blue-600">Real Progress.</span>
              </h2>
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTestimonialIndex((prev) => (prev > 0 ? prev - 1 : TESTIMONIALS.length - 1))}
                aria-label="Previous story"
                className="w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setTestimonialIndex((prev) => (prev < TESTIMONIALS.length - 1 ? prev + 1 : 0))}
                aria-label="Next story"
                className="w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3 Testimonials Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={t.name}
                className={`bg-white rounded-2xl border p-6 shadow-2xs transition-all flex items-start gap-4 ${
                  idx === testimonialIndex ? "border-blue-300 ring-2 ring-blue-500/10" : "border-slate-200/80"
                }`}
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-slate-200">
                  <ImageWithFallback
                    src={t.avatar}
                    alt={t.name}
                    name={t.name}
                    fallbackType="avatar"
                    fill
                  />
                </div>

                <div className="space-y-2 flex-1">
                  <p className="text-xs sm:text-sm text-slate-700 font-normal leading-relaxed italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>

                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      {t.name}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {t.role}
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-400 text-xs mt-1">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 6. MOBILE APP PROMO ("Take Opportunities With You Everywhere")             */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-50/90 via-sky-50 to-blue-100/60 border border-blue-100 p-8 sm:p-12 lg:p-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* LEFT: TEXT & STORE BUTTONS (~60%) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="w-12 h-1 bg-blue-600 rounded-full" />

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Take Opportunities <br />
                  With You <span className="text-blue-600">Everywhere</span>
                </h2>

                <p className="text-slate-600 text-sm sm:text-base font-normal max-w-md">
                  Download our mobile app and never miss an opportunity.
                </p>

                {/* APP STORE BUTTONS */}
                <div className="pt-3 flex flex-wrap items-center gap-3">
                  
                  {/* Google Play Button */}
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); toast.info("Android app releasing soon on Google Play!"); }}
                    className="inline-flex items-center gap-3 px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl shadow-md transition-all active:scale-[0.98]"
                  >
                    {/* Google Play Icon */}
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M3.609 1.814L13.793 12 3.61 22.186a1.993 1.993 0 0 1-.61-1.428V3.242c0-.555.228-1.057.609-1.428zm11.605 11.607l2.253 2.253-11.96 6.905 9.707-9.158zm0-2.842L5.507 1.421l11.96 6.905-2.253 2.253zm1.421 1.421l3.774 2.18c.995.575.995 1.512 0 2.087l-3.774 2.18-2.127-2.127 2.127-2.12z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-[9px] uppercase tracking-wider text-slate-300 leading-none">
                        GET IT ON
                      </div>
                      <div className="text-xs sm:text-sm font-bold leading-tight">
                        Google Play
                      </div>
                    </div>
                  </a>

                  {/* App Store Button */}
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); toast.info("iOS app releasing soon on the App Store!"); }}
                    className="inline-flex items-center gap-3 px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl shadow-md transition-all active:scale-[0.98]"
                  >
                    {/* Apple Icon */}
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.66-.82 1.11-1.95.99-3.08-1 .04-2.14.67-2.82 1.48-.59.69-1.12 1.83-.98 2.93 1.11.09 2.19-.57 2.81-1.33z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-[9px] uppercase tracking-wider text-slate-300 leading-none">
                        Download on the
                      </div>
                      <div className="text-xs sm:text-sm font-bold leading-tight">
                        App Store
                      </div>
                    </div>
                  </a>

                </div>
              </div>

              {/* RIGHT: SMARTPHONE MOCKUP (~40%) */}
              <div className="lg:col-span-5 flex items-center justify-center lg:justify-end relative">
                
                {/* Decorative background glow circles */}
                <div className="absolute w-64 h-64 rounded-full bg-blue-300/30 blur-2xl pointer-events-none" />

                {/* Smartphone Device Frame */}
                <div className="relative w-56 sm:w-64 bg-slate-900 p-2.5 rounded-[2.5rem] shadow-2xl border-4 border-slate-800 rotate-[-4deg] hover:rotate-0 transition-transform duration-300">
                  {/* Phone Speaker & Camera Notch */}
                  <div className="w-20 h-4 bg-slate-900 rounded-full mx-auto mb-1.5 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-700 mr-2" />
                    <div className="w-8 h-1 bg-slate-700 rounded-full" />
                  </div>

                  {/* Phone Screen */}
                  <div className="bg-white rounded-[2rem] p-3 pt-4 overflow-hidden text-slate-800 space-y-2.5">
                    {/* App Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white text-[9px] font-bold">
                          B
                        </div>
                        <span className="font-bold text-[11px] text-slate-900">
                          Berojgar<span className="text-blue-600">DegreeWala</span>
                        </span>
                      </div>
                    </div>

                    {/* App Hero Callout */}
                    <div className="bg-blue-50/80 rounded-xl p-2.5">
                      <div className="text-[10px] font-extrabold text-slate-900 leading-tight">
                        Explore Opportunities Anywhere, Anytime.
                      </div>
                    </div>

                    {/* App Sample Quick Buttons */}
                    <div className="space-y-1.5 text-[10px] font-medium text-slate-600">
                      <div className="p-1.5 rounded-lg border border-slate-100 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="w-3 h-3 text-blue-600" />
                          <span>Internships</span>
                        </span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                      </div>
                      <div className="p-1.5 rounded-lg border border-slate-100 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="w-3 h-3 text-emerald-600" />
                          <span>Jobs</span>
                        </span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                      </div>
                      <div className="p-1.5 rounded-lg border border-slate-100 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <GraduationCap className="w-3 h-3 text-amber-600" />
                          <span>Scholarships</span>
                        </span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cursive Brand Tagline */}
                <div className="absolute right-0 top-2 sm:-top-4 translate-x-4 sm:translate-x-8 -rotate-6 pointer-events-none hidden sm:block">
                  <div className="font-serif italic font-bold text-lg sm:text-xl text-slate-800 leading-none drop-shadow-xs">
                    Same Students. <br />
                    <span className="text-blue-600">Brighter Tomorrows.</span>
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
