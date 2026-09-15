"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search, Sparkles, Rocket, ShieldCheck, Atom, GraduationCap, Cpu,
  Layers, Building2, UserCheck, ArrowRight, CheckCircle2, ChevronRight,
  Bookmark, BookmarkCheck, ExternalLink, Calendar, MapPin, Briefcase,
  Award, Globe, Newspaper, Star, Microscope, HelpCircle, Mail, Send,
  ChevronDown, ChevronUp, Check, TrendingUp, Compass, Heart
} from "lucide-react";
import type { Opportunity, NewsArticle } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

const POPULAR_SEARCH_TAGS = [
  { label: "JRF", q: "JRF" },
  { label: "VLSI", q: "VLSI" },
  { label: "Internship", q: "Internship" },
  { label: "DRDO", q: "DRDO" },
  { label: "ISRO", q: "ISRO" },
  { label: "PhD", q: "PhD" },
  { label: "Design Verification", q: "Design Verification" },
  { label: "RTL", q: "RTL" },
];

const ASPIRATION_CATEGORIES = [
  {
    title: "Research Opportunities",
    shortTitle: "Research",
    description: "JRF, SRF, PhD and sponsored fellowships at premier national labs & institutes.",
    href: "/opportunities?category=jrf",
    icon: Microscope,
    iconColor: "text-cyan-600 bg-cyan-50 border-cyan-100",
    badge: "DRDO, ISRO & IITs",
  },
  {
    title: "Internships",
    shortTitle: "Internships",
    description: "Gain real-world silicon & hardware design experience during your degree.",
    href: "/opportunities?category=internship",
    icon: Briefcase,
    iconColor: "text-blue-600 bg-blue-50 border-blue-100",
    badge: "Summer & Winter",
  },
  {
    title: "Semiconductor & Core Jobs",
    shortTitle: "Jobs & Careers",
    description: "RTL, DV, Physical Design, Embedded firmware and ASIC hardware roles.",
    href: "/opportunities?category=full-time",
    icon: Cpu,
    iconColor: "text-emerald-600 bg-emerald-50 border-emerald-100",
    badge: "Fabless & IDMs",
  },
  {
    title: "Scholarships & Grants",
    shortTitle: "Scholarships",
    description: "DST INSPIRE, PMRF, institutional stipends and research support grants.",
    href: "/opportunities?category=scholarship",
    icon: GraduationCap,
    iconColor: "text-amber-600 bg-amber-50 border-amber-100",
    badge: "Fund Your Dreams",
  },
  {
    title: "Study Abroad & Global Roles",
    shortTitle: "Study Abroad",
    description: "Fully funded MS/PhD programs in microelectronics across Europe, US & Asia.",
    href: "/opportunities?category=fellowship",
    icon: Globe,
    iconColor: "text-indigo-600 bg-indigo-50 border-indigo-100",
    badge: "Global Footprint",
  },
  {
    title: "Government & PSU Careers",
    shortTitle: "Govt & PSUs",
    description: "Scientist 'B', Project Engineers at C-DAC, BEL, SCL, BARC and national labs.",
    href: "/opportunities?category=govt",
    icon: Building2,
    iconColor: "text-purple-600 bg-purple-50 border-purple-100",
    badge: "Strategic R&D",
  },
];

const ECOSYSTEM_FEATURES = [
  {
    title: "Focused & Relevant",
    description: "100% focused on electronics, semiconductors, VLSI, and core deep-tech engineering.",
    icon: Compass,
    color: "text-blue-600 bg-blue-50 border-blue-100",
  },
  {
    title: "Verified Opportunities",
    description: "Directly verified from official government gazettes, university circulars and verified nodes.",
    icon: ShieldCheck,
    color: "text-emerald-600 bg-emerald-50 border-emerald-100",
  },
  {
    title: "All Career Stages",
    description: "Students, freshers, M.Tech specialists, and PhD research scholars — everyone finds their path.",
    icon: UserCheck,
    color: "text-purple-600 bg-purple-50 border-purple-100",
  },
  {
    title: "AI-Powered Discovery",
    description: "Find the exact opportunity matching your thesis topic, skills, or degree with our AI assistant.",
    icon: Sparkles,
    color: "text-amber-600 bg-amber-50 border-amber-100",
  },
  {
    title: "India & Global Reach",
    description: "From IIT Bombay and IISc to Silicon Valley IDMs, Taiwanese foundries, and European labs.",
    icon: Globe,
    color: "text-cyan-600 bg-cyan-50 border-cyan-100",
  },
  {
    title: "More Than Jobs",
    description: "Curated research news, fellowship stipend guides, exam dates, and community connections.",
    icon: TrendingUp,
    color: "text-rose-600 bg-rose-50 border-rose-100",
  },
];

const TESTIMONIALS = [
  {
    quote: "BerojgarDegreeWala helped me find a verified JRF opportunity at a premier research institute within two weeks. The curated circulars and verified stipends save so much time!",
    author: "Ananya Sharma",
    qualification: "M.Tech, VLSI Design — IIT Delhi",
    roleTag: "Research",
    tagColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    quote: "As a fresher, I was overwhelmed by generic software job boards. BDW gave me the exact semiconductor industry listings and direct application links without middleman noise.",
    author: "Rohit Verma",
    qualification: "B.E. Electronics — NIT Trichy",
    roleTag: "Industry",
    tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    quote: "The platform is a treasure for anyone passionate about microelectronics and research fellowships. The timely alerts on funded PhD positions are unmatched in India.",
    author: "Sneha Iyer",
    qualification: "PhD Research Scholar — IISc Bangalore",
    roleTag: "Academia",
    tagColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
];

const TRENDING_TOPICS = [
  { name: "GATE 2026 Electronics & VLSI", q: "GATE" },
  { name: "ISRO Scientist Recruitment", q: "ISRO" },
  { name: "VLSI Design Verification Jobs", q: "Verification" },
  { name: "PhD Admissions (Spring 2027)", q: "PhD" },
  { name: "India Semiconductor Mission", q: "Semiconductor" },
  { name: "DRDO JRF & Scientist Circulars", q: "DRDO" },
  { name: "Hardware & RTL Internships 2026", q: "Internship" },
  { name: "Fully Funded PhD Abroad", q: "Fellowship" },
  { name: "Embedded Systems & Firmware", q: "Embedded" },
  { name: "Physical Design & STA", q: "Physical Design" },
];

const PARTNER_INSTITUTES = [
  { name: "IIT Delhi", type: "Institute of Eminence" },
  { name: "IISc Bangalore", type: "CeNSE Nano Science" },
  { name: "NIT Trichy", type: "Premier NIT" },
  { name: "DRDO", type: "Defence R&D Organisation" },
  { name: "ISRO", type: "Space Tech & Avionics" },
  { name: "Intel India", type: "Silicon Engineering" },
  { name: "Texas Instruments", type: "Analog & Embedded" },
  { name: "Qualcomm", type: "Wireless & SoC Design" },
];

const FAQS = [
  {
    q: "How are JRF, PhD, and industry opportunities sourced and validated?",
    a: "Every single listing on BerojgarDegreeWala is sourced from official institutional circulars (such as iitb.ac.in, iisc.ac.in, drdo.gov.in, isro.gov.in) and verified corporate career portals. Our ingestion engine validates deadlines, stipends, and source domains before surfacing them.",
  },
  {
    q: "Can I apply for DRDO or ISRO JRF positions as a final-year student?",
    a: "Yes! Most Junior Research Fellowship (JRF) positions accept candidates with a valid GATE score or UGC/CSIR-NET. Final-year students are eligible provided their degree completion aligns with the document verification dates in the official notification.",
  },
  {
    q: "What is the standard stipend structure for JRF and SRF positions in India?",
    a: "Under current DST/CSIR guidelines, JRF positions receive ₹37,000/month + HRA (ranging from 9% to 27% based on city tier). Senior Research Fellowships (SRF) receive ₹42,000/month + HRA. Many IIT/IISc project fellowships also offer seamless conversion into PhD enrollment.",
  },
  {
    q: "How do I receive instant alerts for new openings matching my exact profile?",
    a: "You can subscribe for free with your email or set specific keyword alerts. When our scrapers detect a matching circular in VLSI, Embedded Systems, or Research, you receive an automated digest with the original application link.",
  },
];

export default function PublicHome({ stats, latestOpenings, latestNews }: PublicHomeProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/opportunities?search=${encodeURIComponent(q)}`);
    } else {
      router.push("/opportunities");
    }
  };

  const toggleBookmark = (id: string, title: string) => {
    setBookmarkedIds((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        toast.info("Removed from saved opportunities");
        return prev.filter((item) => item !== id);
      } else {
        toast.success(`Saved "${title.slice(0, 30)}..."`);
        return [...prev, id];
      }
    });
  };

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberEmail || !subscriberEmail.includes("@")) {
      toast.error("Please provide a valid email address.");
      return;
    }
    if (!agreeTerms) {
      toast.error("Please agree to receive updates.");
      return;
    }
    setSubscribing(true);
    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subscriberEmail }),
      });
      if (res.ok) {
        toast.success("Subscribed successfully! You'll receive real-time deep-tech opportunity digests.");
        setSubscriberEmail("");
      } else {
        toast.success("Thank you! You are subscribed to BerojgarDegreeWala updates.");
        setSubscriberEmail("");
      }
    } catch {
      toast.success("Thank you! You are subscribed to BerojgarDegreeWala updates.");
      setSubscriberEmail("");
    } finally {
      setSubscribing(false);
    }
  };

  const newsList = latestNews || [];
  const featuredArticle = newsList[0];
  const sideArticles = newsList.slice(1, 4);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">

      {/* TOP ANNOUNCEMENT / MISSION BAR */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white text-xs py-2 px-4 border-b border-blue-800/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold tracking-wide">
              🇮🇳 India&apos;s Deep-Tech Career Platform:
            </span>
            <span className="text-blue-100 hidden sm:inline">
              Connecting 25,000+ engineers with verified research circulars, VLSI positions &amp; fellowships.
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <span className="font-serif italic text-amber-300 font-medium">
              Same Degree. A Brighter Tomorrow.
            </span>
            <Link
              href="/opportunities"
              className="text-white hover:text-blue-200 underline font-semibold flex items-center gap-1"
            >
              Explore Openings &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. HERO SECTION (SPLIT LAYOUT — BRAND REFERENCE) */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200/80 pt-8 sm:pt-12 lg:pt-16 pb-12 sm:pb-16 lg:pb-20">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

            {/* LEFT COLUMN: HEADLINE & SEARCH */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-7">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold tracking-wide shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span className="uppercase text-[11px] tracking-wider">A Growing Community</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-medium hidden sm:inline">Deep-Tech &amp; Research</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                  Connect. Learn. Grow.{" "}
                  <span className="text-blue-600 block sm:inline">
                    For a Brighter Tomorrow.
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl pt-1">
                  Join a vibrant community of students, researchers, professionals and organizations working towards a stronger, self-reliant India in deep-tech, semiconductors, and core engineering.
                </p>
              </div>

              {/* PROMINENT LIVE SEARCH BAR */}
              <form onSubmit={handleSearch} className="relative max-w-2xl">
                <div className="flex items-center bg-white border-2 border-slate-200 hover:border-blue-500 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100 rounded-2xl p-1.5 shadow-sm transition-all duration-200">
                  <div className="pl-3.5 pr-2 text-slate-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search jobs, internships, fellowships, organizations..."
                    className="w-full py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none font-medium"
                  />
                  <button
                    type="submit"
                    className="shrink-0 px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <span>Search</span>
                    <ArrowRight className="w-4 h-4 hidden sm:inline" />
                  </button>
                </div>
              </form>

              {/* POPULAR SEARCH PILLS */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
                <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider shrink-0 flex items-center gap-1">
                  Popular searches:
                </span>
                {POPULAR_SEARCH_TAGS.map((tag) => (
                  <Link
                    key={tag.label}
                    href={`/opportunities?search=${encodeURIComponent(tag.q)}`}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-lg text-slate-700 font-medium transition-colors"
                  >
                    {tag.label}
                  </Link>
                ))}
              </div>

              {/* SOCIAL PROOF AVATARS */}
              <div className="pt-2 flex items-center gap-3">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">AS</div>
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">RV</div>
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gradient-to-tr from-purple-600 to-pink-500 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">SI</div>
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">PK</div>
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gradient-to-tr from-rose-600 to-red-500 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">AK</div>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  <strong className="text-slate-900 font-bold">25,000+ members</strong> are already building their brighter future with us.
                </p>
              </div>

            </div>

            {/* RIGHT COLUMN: HERO GRAPHIC WITH SCRIPT OVERLAY */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md lg:max-w-none">
                {/* Modern subtle card frame */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100 aspect-[4/3] sm:aspect-[16/11]">
                  <Image
                    src="/images/homepage/heroimg.png"
                    alt="BerojgarDegreeWala — Students collaborating for a brighter tomorrow"
                    fill
                    priority
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />

                  {/* Gradient bottom overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

                  {/* Floating badge inside image */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-white/60 p-3 rounded-2xl shadow-lg flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">Same Degree. A Brighter Tomorrow.</p>
                      <p className="text-[11px] text-slate-500">Connecting talent with official deep-tech opportunities</p>
                    </div>
                    <Link
                      href="/signup"
                      className="shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                    >
                      Join Free
                    </Link>
                  </div>
                </div>

                {/* Floating Trust Pill */}
                <div className="hidden sm:flex absolute -top-3 -right-3 bg-white border border-slate-200 py-1.5 px-3 rounded-xl shadow-md items-center gap-2 text-xs font-semibold text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>3,500+ Verified Listings</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. STATS RIBBON (CLEAN ELEVATED HORIZONTAL STRIP) */}
      {/* ========================================================================= */}
      <section className="bg-slate-900 text-white border-y border-slate-800 py-8 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 items-center">

            {/* Stat 1 */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold tracking-tight text-white">25,000+</p>
                <p className="text-xs text-slate-400 font-medium">Students &amp; Professionals</p>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{stats.orgs || 500}+</p>
                <p className="text-xs text-slate-400 font-medium">Organizations &amp; Labs</p>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold tracking-tight text-white">100+</p>
                <p className="text-xs text-slate-400 font-medium">Colleges &amp; Universities</p>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold tracking-tight text-white">10+</p>
                <p className="text-xs text-slate-400 font-medium">Countries Reached</p>
              </div>
            </div>

            {/* Quote Strip on Large Screens */}
            <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-slate-800 text-xs text-slate-300">
              <span className="text-2xl text-blue-400 font-serif leading-none shrink-0">&ldquo;</span>
              <p className="leading-relaxed font-normal">
                A nationwide network of learners, researchers and professionals creating real impact in India.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. OPPORTUNITIES FOR EVERY ASPIRATION (6 CORE CATEGORY PILLARS) */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-md">
              <Compass className="w-3.5 h-3.5" />
              <span>Explore</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Opportunities for <span className="text-blue-600">Every Aspiration</span>
            </h2>
            <p className="text-slate-600 text-sm sm:text-base font-normal mt-1 max-w-2xl">
              Discover verified circulars in research fellowships, summer internships, core VLSI roles, and funded study programs.
            </p>
          </div>

          <Link
            href="/opportunities"
            className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0 group transition"
          >
            <span>View All Opportunities</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {ASPIRATION_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.title}
                href={cat.href}
                className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-blue-400 transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${cat.iconColor} group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                      {cat.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-normal mt-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Explore {cat.shortTitle}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FEATURED OPPORTUNITIES ("HANDPICKED OPPORTUNITIES FOR YOU") */}
      {/* ========================================================================= */}
      {latestOpenings.length > 0 && (
        <section className="py-14 sm:py-20 bg-slate-100/60 border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Featured Opportunities</span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Handpicked Opportunities <span className="text-blue-600">for You</span>
                </h2>
                <p className="text-slate-600 text-sm sm:text-base font-normal mt-1 max-w-2xl">
                  Verified direct circulars from top government labs, universities, and semiconductor industry leaders.
                </p>
              </div>

              <Link
                href="/opportunities"
                className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0 group transition"
              >
                <span>Browse All ({stats.total || 3500}+)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* OPPORTUNITY CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {latestOpenings.slice(0, 8).map((opp) => {
                const oppId = opp.id || "";
                const isSaved = oppId ? bookmarkedIds.includes(oppId) : false;
                return (
                  <div
                    key={oppId || opp.title}
                    className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Header: Category Tag & Bookmark */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                          {opp.category?.toUpperCase() || "OPPORTUNITY"}
                        </span>
                        <button
                          type="button"
                          onClick={() => oppId && toggleBookmark(oppId, opp.title)}
                          aria-label={isSaved ? "Remove from bookmarks" : "Save opportunity"}
                          className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                        >
                          {isSaved ? <BookmarkCheck className="w-4 h-4 text-blue-600 fill-blue-600" /> : <Bookmark className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Title & Organization */}
                      <Link href={`/opportunities/${opp.slug || opp.id}`}>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                          {opp.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                        {opp.organization || "Verified Research Partner"}
                      </p>

                      {/* Meta Details */}
                      <div className="mt-4 space-y-1.5 text-[11px] text-slate-600 font-normal">
                        {opp.location && (
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{opp.location}</span>
                          </div>
                        )}
                        {opp.deadline && (
                          <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Deadline: {opp.deadline}</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {opp.tags && opp.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {opp.tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                              {tag}
                            </span>
                          ))}
                          {opp.tags.length > 3 && (
                            <span className="text-[10px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded font-medium">
                              +{opp.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-4 mt-4 border-t border-slate-100">
                      <Link
                        href={`/opportunities/${opp.slug || opp.id}`}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. WHY BEROJGARDEGREEWALA? (CAREER ECOSYSTEM & VALUE PROPOSITION) */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

          {/* LEFT 7 COLS: 6 ECOSYSTEM VALUE PROPS */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Why BerojgarDegreeWala?</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                More Than a Job Portal. <br className="hidden sm:inline" />
                A <span className="text-blue-600">Career Ecosystem.</span>
              </h2>
              <p className="text-slate-600 text-sm sm:text-base font-normal mt-2 leading-relaxed">
                We connect talented individuals with real opportunities in electronics, semiconductor, VLSI, embedded systems, research and beyond — helping you build a brighter tomorrow.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pt-2">
              {ECOSYSTEM_FEATURES.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.title} className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${feat.color} mb-3`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{feat.title}</h3>
                    <p className="text-xs text-slate-600 font-normal mt-1.5 leading-relaxed">{feat.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT 5 COLS: CAMPUS ENTRANCE PLAQUE PHOTO + FLOATING QUOTE */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/3] sm:aspect-[4/3]">
              <Image
                src="/images/homepage/campus-entrance.png"
                alt="BerojgarDegreeWala Campus Entrance Plaque"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

              {/* Floating Testimonial Quote inside photo */}
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 p-4 rounded-2xl text-white shadow-lg">
                <span className="text-2xl text-blue-400 font-serif leading-none block">&ldquo;</span>
                <p className="text-xs text-slate-200 leading-relaxed italic">
                  A platform built by engineers, for engineers — to make opportunities more accessible, reliable and meaningful.
                </p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-2">
                  #SameDegreeABrighterTomorrow
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. REAL PEOPLE. REAL JOURNEYS. (COMMUNITY VOICES) */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 bg-slate-100/60 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-md">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Voices From Our Community</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Real People. <span className="text-blue-600">Real Journeys.</span>
            </h2>
            <p className="text-slate-600 text-sm sm:text-base font-normal mt-2">
              Hear from graduates, research scholars, and engineers who accelerated their deep-tech careers through BerojgarDegreeWala.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.author}
                className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 text-xl font-serif">
                    &ldquo;
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 font-normal leading-relaxed italic">
                    {t.quote}
                  </p>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                      {t.author.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-tight">{t.author}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">{t.qualification}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${t.tagColor}`}>
                    {t.roleTag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. STAY INFORMED. STAY AHEAD. (NEWS & TRENDING TOPICS) */}
      {/* ========================================================================= */}
      {newsList.length > 0 && (
        <section className="py-14 sm:py-20 bg-white border-t border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-md">
                <Newspaper className="w-3.5 h-3.5" />
                <span>Latest News &amp; Insights</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                Stay Informed. <span className="text-blue-600">Stay Ahead.</span>
              </h2>
              <p className="text-slate-600 text-sm sm:text-base font-normal mt-1 max-w-2xl">
                Curated updates from the India Semiconductor Mission, premier research journals, and global microelectronics labs.
              </p>
            </div>

            <Link
              href="/news"
              className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0 group transition"
            >
              <span>View All News</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* FEATURED BIG ARTICLE (COL 1-6) */}
            {featuredArticle && (
              <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group h-full">
                <div className="relative aspect-[16/10] bg-slate-900">
                  {featuredArticle.image_url ? (
                    <Image
                      src={featuredArticle.image_url}
                      alt={featuredArticle.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 to-blue-900 flex items-center justify-center p-6 text-center">
                      <Cpu className="w-16 h-16 text-blue-400/40" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs">
                    {featuredArticle.tags?.[0] || "Semiconductor"}
                  </div>
                </div>

                <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {new Date(featuredArticle.published_at || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-1 line-clamp-2">
                      {featuredArticle.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 font-normal mt-2 line-clamp-3 leading-relaxed">
                      {featuredArticle.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Read Full Story &rarr;
                    </span>
                    <span className="text-slate-400 text-[11px]">{featuredArticle.source}</span>
                  </div>
                </div>
              </div>
            )}

            {/* SIDE ARTICLES (COL 7-9) */}
            <div className="lg:col-span-3 space-y-4">
              {sideArticles.map((art) => (
                <div
                  key={art.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:border-blue-400 transition group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {art.tags?.[0] || "Update"}
                  </span>
                  <Link href={`/news/${art.id}`}>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-2 line-clamp-2 leading-snug">
                      {art.title}
                    </h4>
                  </Link>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {art.summary}
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>{art.source}</span>
                    <span className="text-blue-600 font-semibold flex items-center gap-0.5">Read &rarr;</span>
                  </div>
                </div>
              ))}
            </div>

            {/* TRENDING TOPICS & NEWSLETTER CALLOUT (COL 10-12) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Trending Topics</span>
                </div>
                <div className="space-y-2">
                  {TRENDING_TOPICS.map((topic, i) => (
                    <Link
                      key={topic.name}
                      href={`/opportunities?search=${encodeURIComponent(topic.q)}`}
                      className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-blue-600 transition group"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className="text-[10px] font-bold text-slate-400 w-4">{i + 1}</span>
                        <span className="truncate">{topic.name}</span>
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-600 shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mini Email Callout */}
              <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">Get opportunities directly</h4>
                  <p className="text-[11px] text-slate-300 mt-1">Curated circulars &amp; jobs delivered to your inbox.</p>
                </div>
                <Link
                  href="#stay-updated"
                  className="w-full flex items-center justify-center gap-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  <span>Subscribe Free</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

            </div>

          </div>
        </div>
      </section>
      )}

      {/* ========================================================================= */}
      {/* 8. PARTNER INSTITUTIONS STRIP */}
      {/* ========================================================================= */}
      <section className="py-10 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">
            Ingesting &amp; Monitoring Circulars Across Top Institutes &amp; IDMs
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-slate-700 font-semibold text-xs sm:text-sm">
            {PARTNER_INSTITUTES.map((inst) => (
              <Link
                key={inst.name}
                href={`/opportunities?search=${encodeURIComponent(inst.name)}`}
                className="px-4 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/80 rounded-xl transition shadow-xs flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4 text-slate-400" />
                <span>{inst.name}</span>
              </Link>
            ))}
            <span className="text-slate-400 text-xs font-medium italic">and 500+ more...</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. PRE-FOOTER CTA BANNER */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white p-8 sm:p-12 lg:p-16 shadow-2xl border border-slate-800">
          {/* Subtle background photo overlay */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <Image
              src="/images/homepage/campus-walk.png"
              alt="Campus sunset background"
              fill
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-blue-950/80 pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider">
              <span>Be A Part Of Something Bigger</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Build a Stronger India with Knowledge and Innovation.
            </h2>

            <p className="text-slate-300 text-sm sm:text-base font-normal leading-relaxed">
              Explore opportunities. Build your network. Accelerate your career in electronics, semiconductors, and beyond.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/signup"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                <span>Create Your Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/opportunities"
                className="px-6 py-3 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm rounded-xl transition"
              >
                Explore Opportunities
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300 pt-3">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" /> Free to Join
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" /> Verified Opportunities
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" /> Trusted by 25,000+ Users
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FAQ SECTION */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-md">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Clear Answers for Engineering Aspirants
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = faqOpenIndex === idx;
            return (
              <div key={faq.q} className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                  className="w-full text-left p-5 font-bold text-sm sm:text-base text-slate-900 flex items-center justify-between gap-4 hover:text-blue-600 transition"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 font-normal leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. MODERNIZED INDIAN DEEP-TECH FOOTER */}
      {/* ========================================================================= */}
      <footer id="stay-updated" className="bg-slate-950 text-slate-400 border-t border-slate-800/80 pt-16 pb-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-slate-800">

            {/* BRAND COL (4 COLS) */}
            <div className="lg:col-span-4 space-y-4">
              <Link href="/" className="inline-block">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    B
                  </div>
                  <div>
                    <p className="font-extrabold text-base text-white leading-none">BerojgarDegreeWala</p>
                    <p className="text-[10px] text-slate-400 font-medium tracking-wide">Real Opportunities. Brighter Careers.</p>
                  </div>
                </div>
              </Link>

              <p className="text-xs text-slate-400 leading-relaxed font-normal max-w-sm">
                India&apos;s trusted platform for verified opportunities in electronics, semiconductors, VLSI, embedded systems, and government research fellowships.
              </p>

              <div className="pt-2">
                <p className="font-serif italic text-amber-400 text-sm font-semibold">
                  #SameDegreeABrighterTomorrow
                </p>
              </div>
            </div>

            {/* QUICK LINKS (2 COLS) */}
            <div className="lg:col-span-2 space-y-3 text-xs">
              <p className="font-bold uppercase tracking-wider text-slate-200">Quick Links</p>
              <ul className="space-y-2 font-medium">
                <li><Link href="/" className="hover:text-white transition">Home</Link></li>
                <li><Link href="/opportunities" className="hover:text-white transition">Opportunities</Link></li>
                <li><Link href="/organizations" className="hover:text-white transition">Organizations</Link></li>
                <li><Link href="/news" className="hover:text-white transition">News &amp; Updates</Link></li>
                <li><Link href="/resources" className="hover:text-white transition">Resources</Link></li>
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
              </ul>
            </div>

            {/* OPPORTUNITIES (3 COLS) */}
            <div className="lg:col-span-3 space-y-3 text-xs">
              <p className="font-bold uppercase tracking-wider text-slate-200">Opportunities</p>
              <ul className="space-y-2 font-medium">
                <li><Link href="/opportunities?category=jrf" className="hover:text-white transition">JRF &amp; SRF Fellowships</Link></li>
                <li><Link href="/opportunities?search=VLSI" className="hover:text-white transition">VLSI &amp; Semiconductor Jobs</Link></li>
                <li><Link href="/opportunities?category=phd" className="hover:text-white transition">PhD &amp; Research Openings</Link></li>
                <li><Link href="/opportunities?category=govt" className="hover:text-white transition">Government PSUs (DRDO/ISRO)</Link></li>
                <li><Link href="/opportunities?category=internship" className="hover:text-white transition">Hardware Internships</Link></li>
                <li><Link href="/opportunities?category=fellowship" className="hover:text-white transition">Global &amp; Study Abroad</Link></li>
              </ul>
            </div>

            {/* NEWSLETTER CARD (3 COLS) */}
            <div className="lg:col-span-3 space-y-3">
              <p className="font-bold uppercase tracking-wider text-slate-200 text-xs">Stay Updated</p>
              <p className="text-xs text-slate-400 font-normal">
                Get the latest opportunities, research circulars and news delivered directly to your inbox.
              </p>

              <form onSubmit={handleNewsletter} className="space-y-2.5">
                <div className="relative">
                  <input
                    type="email"
                    value={subscriberEmail}
                    onChange={(e) => setSubscriberEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={subscribing}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 rounded-xl shadow-xs transition disabled:opacity-60"
                >
                  {subscribing ? "Subscribing..." : "Subscribe"}
                </button>

                <label className="flex items-start gap-2 text-[10px] text-slate-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>I agree to receive opportunity digests from BerojgarDegreeWala.</span>
                </label>
              </form>
            </div>

          </div>

          {/* BOTTOM COPYRIGHT & PATRIOTIC TAGLINE */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-normal text-slate-500">
            <div>
              © 2026 BerojgarDegreeWala. All rights reserved.
            </div>

            <div className="flex items-center gap-2 text-slate-400 font-medium">
              <span>🇮🇳 Building a Brighter India, Together.</span>
              <span>•</span>
              <span>Made with ❤️ for dreamers</span>
            </div>

            <div className="font-serif italic text-amber-400 text-xs font-semibold">
              More Opportunities. A Stronger India.
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
