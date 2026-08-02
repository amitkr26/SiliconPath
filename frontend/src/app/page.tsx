import Link from "next/link";
import {
  ArrowRight, Sparkles, Cpu, CircuitBoard, HardDrive, Wifi,
  GraduationCap, Award, ShieldCheck, Users
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
    .order("created_at", { ascending: false })
    .limit(40);

  if (!data || data.length === 0) return [];

  const mapped = data.map(mapDbOpportunityToClient);
  const result: Opportunity[] = [];
  const seenOrgs = new Set<string>();

  for (const item of mapped) {
    const orgName = (item.organization || "Enterprise").trim().toLowerCase();
    if (!seenOrgs.has(orgName)) {
      seenOrgs.add(orgName);
      result.push(item);
    }
    if (result.length >= 6) break;
  }

  if (result.length < 6) {
    for (const item of mapped) {
      if (!result.some((r) => r.id === item.id)) {
        result.push(item);
      }
      if (result.length >= 6) break;
    }
  }

  return result;
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
    { name: "VLSI & ASIC Design", icon: Cpu, count: "120+ Openings", href: "/search?q=VLSI" },
    { name: "Semiconductor Process & Fab", icon: CircuitBoard, count: "85+ Openings", href: "/search?q=Semiconductor" },
    { name: "Embedded Systems & Firmware", icon: HardDrive, count: "90+ Openings", href: "/search?q=Embedded" },
    { name: "RF, Microwave & Photonics", icon: Wifi, count: "45+ Openings", href: "/search?q=RF" },
    { name: "JRF & Research Fellowships", icon: Award, count: `${stats.jrf} Verified JRFs`, href: "/category/jrf" },
    { name: "PhD & Postdoc Programs", icon: GraduationCap, count: `${stats.phd} Direct Programs`, href: "/category/phd" },
    { name: "DRDO, ISRO & Govt Labs", icon: ShieldCheck, count: `${stats.govt} Govt Positions`, href: "/category/govt" },
    { name: "AI Hardware & Edge Compute", icon: Sparkles, count: "60+ Openings", href: "/search?q=AI" },
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 pb-20">
      
      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-cyan-950/40 border-b border-cyan-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* ACADEMY & NETWORK BADGE */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-xs font-semibold mb-6 shadow-md shadow-cyan-500/10">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>SiliconPath Platform: 7 VLSI Academy Tracks & Hardware Engineers Network</span>
          </div>

          {/* MAIN HERO HEADLINE */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.15]">
            Master VLSI Design & <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              Hardware Network
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            The premier platform for Verilog, SystemVerilog, UVM, Physical Design, and RTL verification. Learn structured VLSI tracks, connect with hardware engineers, and showcase your tapeouts.
          </p>

          {/* HERO CALL TO ACTIONS */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/academy"
              className="px-8 py-3.5 rounded-full font-semibold text-sm bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 hover:from-cyan-400 hover:to-indigo-400 shadow-lg shadow-cyan-500/20 transition-all inline-flex items-center gap-2"
            >
              Explore VLSI Academy Tracks <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/search"
              className="px-8 py-3.5 rounded-full font-semibold text-sm bg-slate-900 border border-slate-800 text-cyan-400 hover:bg-slate-800 transition-all inline-flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-cyan-400" /> Browse All Opportunities
            </Link>
          </div>

          {/* QUICK TARGET TAGS */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-500">Popular Academy Tracks & Topics:</span>
            {["Verilog HDL", "SystemVerilog UVM", "Physical Design", "STA & Synthesis", "RTL Verification", "DFT & Scan", "FPGA Prototyping"].map((tag) => (
              <Link
                key={tag}
                href="/academy"
                className="px-3.5 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-300 hover:border-cyan-500/60 hover:text-cyan-400 transition-all"
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
            <Link href="/search" className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
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
            <Link href="/search" className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
              Browse All Opportunities <ArrowRight className="w-4 h-4" />
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
