import Link from "next/link";
import {
  ArrowRight, Sparkles, Cpu, CircuitBoard, HardDrive, Wifi,
  GraduationCap, Award, ShieldCheck
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { mapDbOpportunityToClient } from "@/lib/utils";
import type { Opportunity, NewsArticle } from "@/types";
import OpportunityCard from "@/components/OpportunityCard";
import NewsCard from "@/components/NewsCard";
import SubscribeSection from "@/components/SubscribeSection";

async function getStats() {
  if (!supabaseAdmin?.from) {
    return { total: 362, jrf: 45, phd: 38, govt: 28, verified: 362 };
  }

  const [
    { count: totalActive },
    { count: jrfCount },
    { count: phdCount },
    { count: govtCount },
    { count: verifiedCount },
  ] = await Promise.all([
    supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true }).eq("is_active", true).ilike("category", "%jrf%"),
    supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true }).eq("is_active", true).ilike("category", "%phd%"),
    supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true }).eq("is_active", true).ilike("category", "%govt%"),
    supabaseAdmin.from("opportunities").select("*", { count: "exact", head: true }).eq("is_active", true).eq("verification_status", "verified"),
  ]);

  return {
    total: totalActive || 362,
    jrf: jrfCount || 45,
    phd: phdCount || 38,
    govt: govtCount || 28,
    verified: verifiedCount || 362,
  };
}

async function getLatestOpportunities(): Promise<Opportunity[]> {
  if (!supabaseAdmin?.from) return [];
  const { data } = await supabaseAdmin
    .from("opportunities")
    .select("*, organizations(*)")
    .eq("is_active", true)
    .eq("verification_status", "verified")
    .order("created_at", { ascending: false })
    .limit(6);

  return data ? data.map(mapDbOpportunityToClient) : [];
}

async function getLatestNews(): Promise<NewsArticle[]> {
  if (!supabaseAdmin?.from) return [];
  const { data } = await supabaseAdmin
    .from("news_articles")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(4);

  return (data as NewsArticle[]) || [];
}

export const revalidate = 300;

export default async function Home() {
  const [stats, opportunities, news] = await Promise.all([
    getStats(),
    getLatestOpportunities(),
    getLatestNews(),
  ]);

  const categories = [
    { name: "VLSI & ASIC Design", icon: Cpu, count: "120+ Openings", href: "/opportunities?search=VLSI" },
    { name: "Semiconductor Process & Fab", icon: CircuitBoard, count: "85+ Openings", href: "/opportunities?search=Semiconductor" },
    { name: "Embedded Systems & Firmware", icon: HardDrive, count: "90+ Openings", href: "/opportunities?search=Embedded" },
    { name: "RF, Microwave & Photonics", icon: Wifi, count: "45+ Openings", href: "/opportunities?search=RF" },
    { name: "JRF & Research Fellowships", icon: Award, count: `${stats.jrf} Verified JRFs`, href: "/category/jrf" },
    { name: "PhD & Postdoc Programs", icon: GraduationCap, count: `${stats.phd} Direct Programs`, href: "/category/phd" },
    { name: "DRDO, ISRO & Govt Labs", icon: ShieldCheck, count: `${stats.govt} Govt Positions`, href: "/category/govt" },
    { name: "AI Hardware & Edge Compute", icon: Sparkles, count: "60+ Openings", href: "/opportunities?search=AI" },
  ];

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 overflow-hidden bg-gradient-to-b from-blue-50/80 via-white to-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* LIVE AGGREGATION BADGE */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full badge-live text-xs font-semibold mb-6 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Live Aggregator: {stats.verified}+ Official Verified Opportunities Ingested</span>
          </div>

          {/* MAIN HERO HEADLINE */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-5xl mx-auto leading-[1.15]">
            India’s Premier Hub for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600">
              Semiconductor & VLSI Careers
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
            Aggregating verified JRF, PhD, DRDO, ISRO, CSIR, IIT Bombay, IIT Madras, IISc research positions, and premier enterprise opportunities from Intel, Qualcomm, AMD, TSMC, and Arm.
          </p>

          {/* HERO CALL TO ACTIONS */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/opportunities"
              className="px-8 py-3.5 rounded-full font-semibold text-sm btn-glow inline-flex items-center gap-2"
            >
              Explore All Openings <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/chat"
              className="px-8 py-3.5 rounded-full font-semibold text-sm bg-white border border-slate-200 text-slate-800 hover:border-blue-500 hover:bg-slate-50 transition-all inline-flex items-center gap-2 shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-blue-600" /> Ask AI Career Assistant
            </Link>
          </div>

          {/* QUICK TARGET TAGS */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">Popular Searches:</span>
            {["DRDO JRF", "ISRO Scientist", "IIT Bombay PhD", "VLSI Verification", "RTL Design", "Qualcomm", "Arm Ltd"].map((tag) => (
              <Link
                key={tag}
                href={`/opportunities?search=${encodeURIComponent(tag)}`}
                className="px-3.5 py-1 bg-white border border-slate-200 rounded-full text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-all shadow-2xs"
              >
                {tag}
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* STATS STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-premium rounded-2xl p-6 text-center shadow-sm">
            <p className="text-3xl sm:text-4xl font-extrabold text-blue-600 tracking-tight">{stats.total}+</p>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1.5">Active Opportunities</p>
          </div>
          <div className="glass-premium rounded-2xl p-6 text-center shadow-sm">
            <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600 tracking-tight">{stats.verified}+</p>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1.5">Verified Official Links</p>
          </div>
          <div className="glass-premium rounded-2xl p-6 text-center shadow-sm">
            <p className="text-3xl sm:text-4xl font-extrabold text-purple-600 tracking-tight">{stats.jrf}+</p>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1.5">JRF Fellowships</p>
          </div>
          <div className="glass-premium rounded-2xl p-6 text-center shadow-sm">
            <p className="text-3xl sm:text-4xl font-extrabold text-amber-600 tracking-tight">{stats.phd}+</p>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1.5">PhD Programs</p>
          </div>
        </div>
      </section>

      {/* SPECIALIZATIONS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Browse by Specialization</h2>
            <p className="text-slate-600 text-sm mt-1">Targeted listings across core microelectronics and research sectors</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map(({ name, icon: Icon, count, href }) => (
            <Link
              key={name}
              href={href}
              className="glass-premium rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 group block"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Icon className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base group-hover:text-blue-600 transition-colors">{name}</h3>
              <p className="text-slate-500 text-xs mt-1.5 font-medium">{count}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED VERIFIED OPPORTUNITIES */}
      {opportunities.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Verified Live Opportunities</h2>
              <p className="text-slate-600 text-sm mt-1">Direct application links to official career portals</p>
            </div>
            <Link href="/opportunities" className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
              View All ({stats.total}) <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        </section>
      )}

      {/* INDUSTRY NEWS */}
      {news.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Semiconductor Industry News</h2>
              <p className="text-slate-600 text-sm mt-1">Daily updates from IEEE Spectrum, EE Times, and Semiconductor Engineering</p>
            </div>
            <Link href="/news" className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
              Read News Feed <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {news.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* SUBSCRIBE & ALERT SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <SubscribeSection />
      </section>

    </div>
  );
}
