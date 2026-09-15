"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search, ArrowRight, ChevronRight, ShieldCheck, Microscope,
  Briefcase, Cpu, GraduationCap, Globe, Building2, Bookmark,
  BookmarkCheck, Calendar, MapPin, CheckCircle2, ChevronDown,
  ChevronUp, TrendingUp, Compass, Newspaper, Sparkles, Check,
  UserCheck, Layers
} from "lucide-react";
import type { Opportunity, NewsArticle } from "@/types";
import { toast } from "sonner";

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
    description: "JRF, SRF, PhD and sponsored fellowships at premier national labs & institutes.",
    href: "/opportunities?category=jrf",
    icon: Microscope,
    iconColor: "text-blue-600 bg-blue-50 border-blue-100",
  },
  {
    title: "Internships",
    description: "Real-world silicon & hardware design experience during your undergraduate degree.",
    href: "/opportunities?category=internship",
    icon: Briefcase,
    iconColor: "text-indigo-600 bg-indigo-50 border-indigo-100",
  },
  {
    title: "Semiconductor & Core Jobs",
    description: "RTL, DV, Physical Design, Embedded firmware and ASIC hardware roles.",
    href: "/opportunities?category=full-time",
    icon: Cpu,
    iconColor: "text-emerald-600 bg-emerald-50 border-emerald-100",
  },
  {
    title: "Scholarships & Grants",
    description: "DST INSPIRE, PMRF, institutional stipends and research support grants.",
    href: "/opportunities?category=scholarship",
    icon: GraduationCap,
    iconColor: "text-amber-600 bg-amber-50 border-amber-100",
  },
  {
    title: "Study Abroad & Global Roles",
    description: "Fully funded MS/PhD programs in microelectronics across Europe, US & Asia.",
    href: "/opportunities?category=fellowship",
    icon: Globe,
    iconColor: "text-cyan-600 bg-cyan-50 border-cyan-100",
  },
  {
    title: "Government & PSU Careers",
    description: "Scientist 'B', Project Engineers at C-DAC, BEL, SCL, BARC and national labs.",
    href: "/opportunities?category=govt",
    icon: Building2,
    iconColor: "text-purple-600 bg-purple-50 border-purple-100",
  },
];

const WHY_BDW_POINTS = [
  {
    title: "Focused & Relevant",
    description: "100% focused on electronics, semiconductors, VLSI, and core deep-tech engineering.",
    icon: Compass,
    color: "text-blue-600 bg-blue-50 border-blue-100",
  },
  {
    title: "Verified Opportunities",
    description: "Directly verified from official government gazettes, university circulars and career nodes.",
    icon: ShieldCheck,
    color: "text-emerald-600 bg-emerald-50 border-emerald-100",
  },
  {
    title: "All Career Stages",
    description: "Students, freshers, M.Tech specialists, and PhD research scholars find their path.",
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
    quote: "BerojgarDegreeWala helped me discover a verified DST-funded JRF opening at a premier institute within two weeks. The circular links and verified stipends save immense time.",
    author: "Ananya Sharma",
    qualification: "M.Tech, VLSI Design — IIT Delhi",
    roleTag: "Research",
    tagColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    quote: "As a core electronics graduate, standard software job boards were completely irrelevant. BDW gave me exact hardware industry listings and direct portal links without middleman noise.",
    author: "Rohit Verma",
    qualification: "B.E. Electronics — NIT Trichy",
    roleTag: "Industry",
    tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    quote: "The platform is invaluable for microelectronics researchers. The structured circular alerts for funded PhD admissions and project associate positions are unmatched in India.",
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
  { name: "Hardware & RTL Internships", q: "Internship" },
  { name: "Physical Design & STA", q: "Physical Design" },
];

const PARTNER_INSTITUTES = [
  { name: "IIT Delhi", label: "Premier IIT" },
  { name: "IISc Bangalore", label: "CeNSE Nano Science" },
  { name: "NIT Trichy", label: "Top National Institute" },
  { name: "DRDO", label: "Defence R&D Organisation" },
  { name: "ISRO", label: "Space Tech & Avionics" },
  { name: "Intel India", label: "Silicon Engineering" },
  { name: "Texas Instruments", label: "Analog & Embedded" },
  { name: "Qualcomm", label: "Wireless & SoC Design" },
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
  {
    q: "Are opportunities on BerojgarDegreeWala free to access and apply?",
    a: "Yes, 100% free. BerojgarDegreeWala is an open career and research discovery ecosystem. We never charge candidates for accessing opportunities, circulars, or official direct application links.",
  },
  {
    q: "Which core engineering branches are covered on the platform?",
    a: "Our primary focus is Electronics & Communication (ECE), Electrical (EE), Microelectronics, VLSI, Embedded Systems, Semiconductor Physics, Instrumentation, and related Deep-Tech and Computer Systems disciplines.",
  },
];

export default function PublicHome({ stats, latestOpenings, latestNews }: PublicHomeProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
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
        toast.success(`Saved "${title.slice(0, 32)}..."`);
        return [...prev, id];
      }
    });
  };

  const newsList = latestNews || [];
  const featuredArticle = newsList[0];
  const sideArticles = newsList.slice(1, 4);

  return (
    <div className="bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">

      {/* ========================================================================= */}
      {/* 1. TOP MISSION / ANNOUNCEMENT BAR */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white text-xs py-2.5 px-4 border-b border-blue-800/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold tracking-wide">
              🇮🇳 India&apos;s Deep-Tech Career Platform:
            </span>
            <span className="text-blue-100 hidden sm:inline font-normal">
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
      {/* 2. HERO SECTION (SPLIT EDITORIAL COMPOSITION) */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200/80 pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-20 lg:pb-24">
        {/* Subtle background ambient tint */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-50/70 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-50/60 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

            {/* LEFT COLUMN: ~48% EDITORIAL HEADLINE & SEARCH */}
            <div className="lg:col-span-6 space-y-6 sm:space-y-7">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold tracking-wide shadow-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="uppercase text-[11px] font-bold tracking-wider">A Growing Community</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-medium hidden sm:inline">Deep-Tech &amp; Research</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                  Connect. Learn. Grow.{" "}
                  <span className="text-blue-600 block sm:inline">
                    For a Brighter Tomorrow.
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl">
                  Join a vibrant community of students, researchers, and professionals working towards India&apos;s technological frontier in semiconductors, VLSI, and core engineering.
                </p>
              </div>

              {/* LARGE OPPORTUNITY SEARCH FIELD */}
              <form onSubmit={handleSearch} className="relative max-w-xl">
                <div className="flex items-center bg-white border border-slate-300 hover:border-blue-500 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100 rounded-xl p-1.5 shadow-sm transition-all duration-200">
                  <div className="pl-3.5 pr-2 text-slate-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search jobs, internships, fellowships, labs..."
                    className="w-full py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none font-medium"
                  />
                  <button
                    type="submit"
                    className="shrink-0 px-5 sm:px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <span>Search</span>
                    <ArrowRight className="w-4 h-4 hidden sm:inline" />
                  </button>
                </div>
              </form>

              {/* POPULAR SEARCH SHORTCUTS */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
                <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider shrink-0">
                  Popular:
                </span>
                {POPULAR_SEARCH_TAGS.map((tag) => (
                  <Link
                    key={tag.label}
                    href={`/opportunities?search=${encodeURIComponent(tag.q)}`}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/80 rounded-lg text-slate-700 font-medium transition-colors"
                  >
                    {tag.label}
                  </Link>
                ))}
              </div>

              {/* ACTION BUTTONS & SOCIAL PROOF */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <Link
                    href="/opportunities"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 active:scale-95"
                  >
                    <span>Explore Opportunities</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/organizations"
                    className="px-5 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition"
                  >
                    Browse Labs
                  </Link>
                </div>
              </div>

              {/* MEMBER AVATAR STRIP */}
              <div className="pt-1 flex items-center gap-3 text-xs text-slate-600">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">AS</div>
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">RV</div>
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gradient-to-tr from-purple-600 to-pink-500 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">SI</div>
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">PK</div>
                </div>
                <p className="font-medium text-slate-600">
                  <strong className="text-slate-900 font-bold">25,000+ engineers</strong> building the future of semiconductors in India.
                </p>
              </div>

            </div>

            {/* RIGHT COLUMN: ~52% CINEMATIC HERO VISUAL */}
            <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-200/90 bg-slate-100">
                <Image
                  src="/images/homepage/heroimg.png"
                  alt="BerojgarDegreeWala — Students and engineers collaborating for a brighter tomorrow"
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 52vw"
                />

                {/* Atmospheric gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

                {/* Refined contextual overlay card */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-white/80 p-3 sm:p-4 rounded-xl shadow-lg flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">Same Degree. A Brighter Tomorrow.</p>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-normal mt-0.5">Connecting talent with official deep-tech opportunities</p>
                  </div>
                  <Link
                    href="/signup"
                    className="shrink-0 px-3.5 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                  >
                    Join Free
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. IMPACT STATISTICS RIBBON */}
      {/* ========================================================================= */}
      <section className="bg-slate-900 text-white border-y border-slate-800 py-10 sm:py-12 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 items-center">

            {/* Stat 1 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">25,000+</p>
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">Students &amp; Professionals</p>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">{stats.orgs || 104}+</p>
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">Organizations &amp; Labs</p>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">100+</p>
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">Colleges &amp; Universities</p>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">10+</p>
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">Countries Reached</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. OPPORTUNITY CATEGORIES (3x2 REFINED GRID) */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-md">
              <Compass className="w-3.5 h-3.5" />
              <span>Explore Opportunities</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Opportunities for <span className="text-blue-600">Every Aspiration</span>
            </h2>
            <p className="text-slate-600 text-sm sm:text-base font-normal mt-1.5 max-w-2xl">
              Discover verified circulars in research fellowships, summer internships, core VLSI roles, and funded study programs.
            </p>
          </div>

          <Link
            href="/opportunities"
            className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 shrink-0 group transition"
          >
            <span>View All Opportunities</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ASPIRATION_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.title}
                href={cat.href}
                className="bg-white border border-slate-200/90 hover:border-blue-400 rounded-xl p-6 shadow-xs hover:shadow-md transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className={`w-11 h-11 rounded-lg border flex items-center justify-center mb-4 transition-transform group-hover:scale-105 ${cat.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-sm text-slate-600 font-normal mt-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Explore opportunities</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FEATURED OPPORTUNITIES (3-COLUMN READABLE GRID) */}
      {/* ========================================================================= */}
      {latestOpenings.length > 0 && (
        <section className="py-16 sm:py-24 bg-slate-100/60 border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Featured Opportunities</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Handpicked Opportunities <span className="text-blue-600">for You</span>
                </h2>
                <p className="text-slate-600 text-sm sm:text-base font-normal mt-1.5 max-w-2xl">
                  Verified opportunities selected for engineers, researchers and students from national laboratories and semiconductor industry leaders.
                </p>
              </div>

              <Link
                href="/opportunities"
                className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 shrink-0 group transition"
              >
                <span>Browse All ({stats.total || 3500}+)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* 3-COLUMN READABLE OPPORTUNITY GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestOpenings.slice(0, 6).map((opp) => {
                const oppId = opp.id || "";
                const isSaved = oppId ? bookmarkedIds.includes(oppId) : false;
                return (
                  <div
                    key={oppId || opp.title}
                    className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      {/* Top Header: Category Tag & Save Bookmark */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
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

                      {/* Organization Name */}
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">
                        {opp.organization || "Verified Research Partner"}
                      </p>

                      {/* Opportunity Title */}
                      <Link href={`/opportunities/${opp.slug || opp.id}`}>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                          {opp.title}
                        </h3>
                      </Link>

                      {/* Metadata: Location, Deadline & Verified */}
                      <div className="pt-1 space-y-1.5 text-xs text-slate-600">
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
                        <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Official Portal Verification</span>
                        </div>
                      </div>

                      {/* Tags */}
                      {opp.tags && opp.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {opp.tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-5 mt-5 border-t border-slate-100">
                      <Link
                        href={`/opportunities/${opp.slug || opp.id}`}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition"
                      >
                        <span>View Opportunity</span>
                        <ArrowRight className="w-4 h-4" />
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
      {/* 6. WHY BEROJGARDEGREEWALA (STORYTELLING & ECOSYSTEM VALUE) */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

          {/* LEFT 5 COLS: CAMPUS ENTRANCE PLAQUE WITH MEANINGFUL VISUAL WEIGHT */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 aspect-[4/3]">
              <Image
                src="/images/homepage/campus-entrance.png"
                alt="BerojgarDegreeWala Campus Entrance Plaque"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 42vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

              {/* Floating Quote inside photo */}
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 p-4 rounded-xl text-white shadow-lg">
                <span className="text-xl text-blue-400 font-serif leading-none block">&ldquo;</span>
                <p className="text-xs text-slate-200 leading-relaxed italic">
                  A platform built by engineers, for engineers — to make opportunities more accessible, reliable and meaningful.
                </p>
                <p className="text-[10px] text-amber-400 uppercase tracking-wider font-bold mt-2">
                  #SameDegreeABrighterTomorrow
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT 7 COLS: HEADLINE & 6 COMPACT VALUE ROWS */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Why BerojgarDegreeWala?</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                More Than a Job Portal. <br className="hidden sm:inline" />
                A <span className="text-blue-600">Career Ecosystem.</span>
              </h2>
              <p className="text-slate-600 text-sm sm:text-base font-normal mt-2 leading-relaxed">
                We connect talented individuals with real opportunities in electronics, semiconductor, VLSI, embedded systems, research and beyond — helping you build a brighter tomorrow.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {WHY_BDW_POINTS.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.title} className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:border-slate-300 transition">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${feat.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{feat.title}</h3>
                        <p className="text-xs text-slate-600 font-normal mt-1 leading-relaxed">{feat.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. REAL PEOPLE. REAL JOURNEYS. (EDITORIAL TRUST SECTION) */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 bg-slate-100/60 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-md">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Voices From Our Community</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
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
                className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="text-blue-600 text-2xl font-serif mb-2">&ldquo;</div>
                  <p className="text-sm text-slate-700 font-normal leading-relaxed italic">
                    {t.quote}
                  </p>
                </div>

                <div className="pt-5 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
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
      {/* 8. STAY INFORMED. STAY AHEAD. (NEWS & INSIGHTS) */}
      {/* ========================================================================= */}
      {newsList.length > 0 && (
        <section className="py-16 sm:py-24 bg-white border-t border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-md">
                  <Newspaper className="w-3.5 h-3.5" />
                  <span>Latest News &amp; Insights</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Stay Informed. <span className="text-blue-600">Stay Ahead.</span>
                </h2>
                <p className="text-slate-600 text-sm sm:text-base font-normal mt-1.5 max-w-2xl">
                  Curated updates from the India Semiconductor Mission, premier research journals, and global microelectronics labs.
                </p>
              </div>

              <Link
                href="/news"
                className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 shrink-0 group transition"
              >
                <span>View All News</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* FEATURED BIG ARTICLE (6 COLS) */}
              {featuredArticle && (
                <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group">
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
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-1 line-clamp-2">
                        {featuredArticle.title}
                      </h3>
                      <p className="text-sm text-slate-600 font-normal mt-2 line-clamp-3 leading-relaxed">
                        {featuredArticle.summary}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                      <Link href={`/news/${featuredArticle.id}`} className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Read Full Story &rarr;
                      </Link>
                      <span className="text-slate-400 text-[11px] font-normal">{featuredArticle.source}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SECONDARY ARTICLES (3 COLS) */}
              <div className="lg:col-span-3 space-y-4">
                {sideArticles.map((art) => (
                  <div
                    key={art.id}
                    className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:border-blue-400 transition group"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {art.tags?.[0] || "Update"}
                    </span>
                    <Link href={`/news/${art.id}`}>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-2 line-clamp-2 leading-snug">
                        {art.title}
                      </h4>
                    </Link>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed font-normal">
                      {art.summary}
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>{art.source}</span>
                      <Link href={`/news/${art.id}`} className="text-blue-600 font-semibold flex items-center gap-0.5">
                        Read &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* TRENDING TOPICS (3 COLS) */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span>Trending Topics</span>
                  </div>
                  <div className="space-y-2">
                    {TRENDING_TOPICS.map((topic, i) => (
                      <Link
                        key={topic.name}
                        href={`/opportunities?search=${encodeURIComponent(topic.q)}`}
                        className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-blue-600 transition group"
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

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-center">
                  <p className="text-xs font-bold text-blue-900">Want daily alerts?</p>
                  <p className="text-[11px] text-blue-700 mt-0.5">Check out our footer subscription for weekly digests.</p>
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 9. PARTNER INSTITUTIONS STRIP (MINIMAL HORIZONTAL TRUST BAR) */}
      {/* ========================================================================= */}
      <section className="py-12 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">
            Ingesting &amp; Monitoring Circulars Across Top Institutes &amp; IDMs
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-slate-700 font-semibold text-xs sm:text-sm">
            {PARTNER_INSTITUTES.map((inst) => (
              <Link
                key={inst.name}
                href={`/opportunities?search=${encodeURIComponent(inst.name)}`}
                className="px-3.5 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/80 rounded-lg transition shadow-xs flex items-center gap-2"
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
      {/* 10. PRE-FOOTER CTA (CINEMATIC DARK-BLUE PANEL) */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 text-white p-8 sm:p-12 lg:p-16 shadow-xl border border-slate-800">
          {/* Integrated atmospheric background photo */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <Image
              src="/images/homepage/campus-walk.png"
              alt="Campus walk sunset background"
              fill
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-blue-950/80 pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider">
              <span>Be A Part Of Something Bigger</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
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
      {/* 11. FAQ ACCORDION (POSITIONED AFTER PRE-FOOTER CTA) */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200/80">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-md">
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Clear Answers for Engineering Aspirants
          </h2>
        </div>

        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {FAQS.map((faq, idx) => {
            const isOpen = faqOpenIndex === idx;
            return (
              <div key={faq.q} className="py-5">
                <button
                  type="button"
                  onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                  className="w-full text-left font-bold text-base text-slate-900 flex items-center justify-between gap-4 hover:text-blue-600 transition"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-blue-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="mt-3 text-sm text-slate-600 font-normal leading-relaxed pr-8">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* NO FOOTER HERE — AppLayout owns the single authoritative <Footer /> component */}
    </div>
  );
}
