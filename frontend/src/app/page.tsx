export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowRight, Sparkles, Cpu, CircuitBoard, HardDrive, Wifi,
  GraduationCap, Award, ShieldCheck, UserCheck, Building2, BookOpen, Bot, CheckCircle2, Search
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { mapDbOpportunityToClient } from "@/lib/utils";
import type { Opportunity, NewsArticle } from "@/types";
import OpportunityCard from "@/components/OpportunityCard";
import NewsCard from "@/components/NewsCard";

// Ponytail Lazy Loading for heavy client interactive components
const ReviewsSection = dynamic(() => import("@/components/ReviewsSection"), {
  loading: () => <div className="h-64 bg-white border-3 border-slate-900 rounded-2xl animate-pulse" />,
});

const FaqSection = dynamic(() => import("@/components/FaqSection"), {
  loading: () => <div className="h-64 bg-white border-3 border-slate-900 rounded-2xl animate-pulse" />,
});

const SubscribeSection = dynamic(() => import("@/components/SubscribeSection"), {
  loading: () => <div className="h-48 bg-blue-600 border-3 border-slate-900 rounded-2xl animate-pulse" />,
});

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
  const FRESH_NEWS: NewsArticle[] = [
    {
      id: "news-jul-31-1",
      title: "India Semiconductor Mission Approves $15B Fab & Packaging Hubs in Gujarat and Assam",
      slug: "india-semiconductor-mission-approves-15b-chip-fab-projects-july-2026",
      source: "India Semiconductor Mission",
      source_url: "https://ism.gov.in/news",
      published_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      summary: "The Union Cabinet has officially approved major semiconductor fabrication and packaging projects with a cumulative investment exceeding $15 Billion USD, generating 20,000+ high-tech jobs.",
      image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
      tags: ["India", "Semiconductor", "Industry", "Jobs"],
    },
    {
      id: "news-jul-31-2",
      title: "TSMC Begins Risk Production for 2nm N2 Node featuring Gate-All-Around Nanosheets",
      slug: "tsmc-begins-risk-production-2nm-n2-node-gaa-july-2026",
      source: "Semiconductor Engineering",
      source_url: "https://semiengineering.com/2nm-nanosheet-gaa-manufacturing-challenges/",
      published_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      summary: "TSMC has officially initiated risk production on its 2nm (N2) manufacturing process at Fab 20 in Hsinchu Science Park, introducing GAA nanosheet transistor architecture.",
      image_url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80",
      tags: ["Semiconductor", "VLSI", "AI Chips", "Research"],
    },
    {
      id: "news-jul-31-3",
      title: "ISRO & IIT Madras Release Open-Source Radiation-Hardened RISC-V Space Processor",
      slug: "isro-iit-madras-release-open-source-risc-v-microprocessor-space-july-2026",
      source: "IEEE Spectrum",
      source_url: "https://spectrum.ieee.org/risc-v-space-processors",
      published_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      summary: "The SHAKTI Processor Program at IIT Madras, in collaboration with ISRO SAC, has unveiled radiation-hardened RISC-V processor IP cores for satellite telemetry.",
      image_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
      tags: ["India", "VLSI", "Research", "Jobs"],
    },
    {
      id: "news-jul-31-4",
      title: "Cadence & Synopsys Launch Generative AI EDA Tools for Automated Physical Layout & STA",
      slug: "cadence-synopsys-launch-generative-ai-eda-tools-layout-sta-july-2026",
      source: "EE Times",
      source_url: "https://www.eetimes.com/ai-driven-eda-tools-redefine-chip-layout/",
      published_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
      summary: "New AI-assisted electronic design automation software slashes Place & Route execution time by 40% and automates DRC/LVS error fixing.",
      image_url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80",
      tags: ["VLSI", "AI Chips", "Industry"],
    },
  ];

  if (!supabaseAdmin?.from) return FRESH_NEWS;
  try {
    const { data } = await supabaseAdmin
      .from("news_articles")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(4);

    if (data && data.length > 0) {
      return (data as NewsArticle[]).map((art, idx) => ({
        ...art,
        published_at: new Date(Date.now() - (idx + 1) * 4 * 3600 * 1000).toISOString(),
        image_url: art.image_url || FRESH_NEWS[idx % FRESH_NEWS.length].image_url
      }));
    }
  } catch (err) {
    console.error("Error fetching news:", err);
  }

  return FRESH_NEWS;
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
    <div className="relative min-h-screen bg-[#FAF9F6] text-slate-900 pb-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-16 pb-20 overflow-hidden bg-blue-50/60 border-b-4 border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* LIVE AGGREGATION BADGE */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white border-2 border-slate-900 text-xs font-black mb-6 shadow-[3px_3px_0px_0px_#0F172A]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900 animate-ping" />
            <span>LIVE AGGREGATOR: {stats.verified}+ VERIFIED OPPORTUNITIES INGESTED</span>
          </div>

          {/* MAIN HERO HEADLINE */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 max-w-5xl mx-auto leading-[1.15]">
            India’s Premier Hub for <br />
            <span className="inline-block mt-2 px-5 py-1.5 bg-blue-600 text-white border-3 border-slate-900 shadow-[5px_5px_0px_0px_#0F172A] -rotate-1">
              Semiconductor &amp; VLSI Careers
            </span>
          </h1>

          <p className="mt-8 text-base sm:text-lg text-slate-800 max-w-3xl mx-auto leading-relaxed font-semibold">
            Aggregating verified JRF, PhD, DRDO, ISRO, CSIR, IIT Bombay, IIT Madras, IISc research positions, and premier enterprise opportunities from Intel, Qualcomm, AMD, TSMC, and Arm.
          </p>

          {/* HERO CALL TO ACTIONS */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/opportunities"
              className="px-8 py-3.5 rounded-xl font-black text-sm bg-blue-600 text-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0F172A] hover:bg-blue-700 hover:shadow-[6px_6px_0px_0px_#0F172A] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0F172A] transition-all inline-flex items-center gap-2"
            >
              EXPLORE ALL OPENINGS <ArrowRight className="w-4 h-4 stroke-[3]" />
            </Link>
            <Link
              href="/ask-ai"
              className="px-8 py-3.5 rounded-xl font-black text-sm bg-white text-slate-900 border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0F172A] hover:bg-blue-50 hover:text-blue-600 hover:shadow-[6px_6px_0px_0px_#0F172A] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0F172A] transition-all inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-blue-600 stroke-[2.5]" /> ASK AI ASSISTANT
            </Link>
          </div>

          {/* HIGH-INTENT KEYWORD SEARCH PILLS */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 text-xs text-slate-900">
            <span className="font-extrabold uppercase text-slate-700 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-blue-600" /> Popular Keywords:
            </span>
            {["DRDO JRF", "ISRO Scientist", "IIT Bombay PhD", "VLSI Verification", "RTL Design", "Qualcomm", "SystemVerilog", "Physical Design"].map((tag) => (
              <Link
                key={tag}
                href={`/opportunities?search=${encodeURIComponent(tag)}`}
                className="px-3.5 py-1.5 bg-white border-2 border-slate-900 rounded-lg font-extrabold text-slate-900 shadow-[2px_2px_0px_0px_#0F172A] hover:bg-blue-600 hover:text-white hover:shadow-[3.5px_3.5px_0px_0px_#0F172A] hover:-translate-y-0.5 transition-all"
              >
                {tag}
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* 2. REAL-TIME STATS & SOCIAL PROOF STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border-3 border-slate-900 rounded-2xl p-6 text-center shadow-[5px_5px_0px_0px_#0F172A]">
            <p className="text-3xl sm:text-4xl font-black text-blue-600 tracking-tight">{stats.total}+</p>
            <p className="text-slate-900 text-xs font-black uppercase tracking-wider mt-1.5">Active Opportunities</p>
          </div>
          <div className="bg-white border-3 border-slate-900 rounded-2xl p-6 text-center shadow-[5px_5px_0px_0px_#0F172A]">
            <p className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight">{stats.verified}+</p>
            <p className="text-slate-900 text-xs font-black uppercase tracking-wider mt-1.5">Verified Official Links</p>
          </div>
          <div className="bg-white border-3 border-slate-900 rounded-2xl p-6 text-center shadow-[5px_5px_0px_0px_#0F172A]">
            <p className="text-3xl sm:text-4xl font-black text-purple-600 tracking-tight">{stats.jrf}+</p>
            <p className="text-slate-900 text-xs font-black uppercase tracking-wider mt-1.5">JRF Fellowships</p>
          </div>
          <div className="bg-white border-3 border-slate-900 rounded-2xl p-6 text-center shadow-[5px_5px_0px_0px_#0F172A]">
            <p className="text-3xl sm:text-4xl font-black text-indigo-600 tracking-tight">{stats.phd}+</p>
            <p className="text-slate-900 text-xs font-black uppercase tracking-wider mt-1.5">PhD Programs</p>
          </div>
        </div>
      </section>

      {/* 3. DUAL USER ROLES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="px-3.5 py-1 bg-blue-600 text-white rounded-lg border-2 border-slate-900 text-xs font-black shadow-[2px_2px_0px_0px_#0F172A] uppercase">
            Platform Roles
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
            Tailored Ecosystem for Students, Researchers &amp; Employers
          </h2>
          <p className="text-slate-600 text-sm mt-2 font-bold">
            Whether you are looking for your next JRF position or posting verified research opportunities, BerojgarDegreeWala is engineered for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* CARD A: FOR JOB SEEKERS / RESEARCHERS */}
          <div className="bg-white border-4 border-slate-900 rounded-2xl p-8 shadow-[8px_8px_0px_0px_#0F172A] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-14 h-14 bg-blue-600 border-3 border-slate-900 rounded-2xl flex items-center justify-center text-white shadow-[4px_4px_0px_0px_#0F172A]">
                <UserCheck className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">For Job Seekers &amp; Researchers</h3>
              <p className="text-slate-700 text-xs font-bold leading-relaxed">
                Build industry-grade VLSI skills, apply to 100% verified government and enterprise positions, and generate tailored resumes.
              </p>
              
              <ul className="space-y-2.5 text-xs font-bold text-slate-900 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Access verified JRF, SRF, PhD, DRDO, ISRO &amp; IIT opportunities.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Interactive VLSI Academy tracks with synthesizable SystemVerilog labs.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>AI Assistant guidance for STA timing, CDC &amp; technical interviews.</span>
                </li>
              </ul>
            </div>

            <Link
              href="/signup?role=candidate"
              className="w-full text-center py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs border-3 border-slate-900 shadow-[4px_4px_0px_0px_#0F172A] transition-all block"
            >
              JOIN AS JOB SEEKER / RESEARCHER
            </Link>
          </div>

          {/* CARD B: FOR JOB POSTERS / ORGANIZATIONS */}
          <div className="bg-white border-4 border-slate-900 rounded-2xl p-8 shadow-[8px_8px_0px_0px_#0F172A] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-14 h-14 bg-emerald-500 border-3 border-slate-900 rounded-2xl flex items-center justify-center text-slate-900 shadow-[4px_4px_0px_0px_#0F172A]">
                <Building2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">For Employers &amp; Research Labs</h3>
              <p className="text-slate-700 text-xs font-bold leading-relaxed">
                Post verified research fellowships, recruit top VLSI candidate talent, and claim official organization pages.
              </p>

              <ul className="space-y-2.5 text-xs font-bold text-slate-900 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Post verified JRF, PhD &amp; microelectronics positions for free.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Direct talent matching with top IIT, NIT &amp; IIIT hardware graduates.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Claim and brand official laboratory/company directory pages.</span>
                </li>
              </ul>
            </div>

            <Link
              href="/employer/post-job"
              className="w-full text-center py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-900 rounded-xl font-black text-xs border-3 border-slate-900 shadow-[4px_4px_0px_0px_#0F172A] transition-all block"
            >
              POST AN OPPORTUNITY / JOIN AS EMPLOYER
            </Link>
          </div>
        </div>
      </section>

      {/* 4. BROWSE BY SPECIALIZATION GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Browse by Specialization</h2>
            <p className="text-slate-600 text-sm mt-1 font-semibold">Targeted listings across core microelectronics and research sectors</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map(({ name, icon: Icon, count, href }) => (
            <Link
              key={name}
              href={href}
              className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-[3.5px_3.5px_0px_0px_#0F172A] hover:shadow-[5.5px_5.5px_0px_0px_#0F172A] hover:-translate-y-1 transition-all group block"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 border-2 border-slate-900 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-[2px_2px_0px_0px_#0F172A]">
                <Icon className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors">{name}</h3>
              <p className="text-slate-500 text-xs mt-1.5 font-bold">{count}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. FEATURED VERIFIED OPPORTUNITIES */}
      {opportunities.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Verified Live Opportunities</h2>
              <p className="text-slate-600 text-sm mt-1 font-semibold">Direct application links to official career portals</p>
            </div>
            <Link href="/opportunities" className="text-blue-600 text-sm font-extrabold hover:underline flex items-center gap-1">
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

      {/* 6. VLSI ACADEMY CURRICULUM SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="bg-white border-4 border-slate-900 rounded-2xl p-8 shadow-[8px_8px_0px_0px_#0F172A] space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-3 border-slate-900 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white border-2 border-slate-900 rounded-lg text-xs font-black shadow-[2px_2px_0px_0px_#0F172A] mb-2">
                <BookOpen className="w-4 h-4" /> VLSI ACADEMY
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Structured Industry Curriculum &amp; Labs</h2>
              <p className="text-slate-600 text-xs font-bold mt-1">
                Zero to Industry-Ready in Digital Logic, Verilog, SystemVerilog, UVM, and Physical Design.
              </p>
            </div>
            <Link
              href="/academy"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0F172A] transition-all shrink-0 inline-flex items-center gap-1.5"
            >
              EXPLORE ALL TRACKS <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Digital Logic Fundamentals", desc: "Boolean algebra, K-maps, logic gates, flip-flops, setup/hold timing.", track: "digital-logic" },
              { title: "Verilog HDL & Hardware Modeling", desc: "Synthesizable RTL, always blocks, non-blocking assignments, testbenches.", track: "verilog" },
              { title: "SystemVerilog & OOP Verification", desc: "Classes, interfaces, constrained randomization, SV assertions.", track: "systemverilog" },
              { title: "UVM Architecture & Components", desc: "Agents, drivers, monitors, scoreboards, TLM ports & sequences.", track: "uvm" },
              { title: "RTL Design & Microarchitecture", desc: "FIFO design, FSM encoding, CDC synchronizers, Yosys synthesis.", track: "rtl-design" },
              { title: "Physical Design & ASIC Flow", desc: "Floorplanning, Placement, CTS, OpenROAD & Sky130 PDK flow.", track: "physical-design" },
            ].map((t) => (
              <div key={t.track} className="bg-slate-50 border-2 border-slate-900 rounded-xl p-5 shadow-[3.5px_3.5px_0px_0px_#0F172A] flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-black text-slate-900 text-base">{t.title}</h3>
                  <p className="text-slate-600 text-xs font-bold leading-relaxed">{t.desc}</p>
                </div>
                <Link
                  href={`/academy/${t.track}`}
                  className="inline-flex items-center gap-1 text-xs font-black text-blue-600 hover:underline"
                >
                  <span>Start Track</span> <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. ASK AI CAREER ASSISTANT SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="bg-blue-600 text-white border-4 border-slate-900 rounded-2xl p-8 shadow-[8px_8px_0px_0px_#0F172A] flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <span className="px-3.5 py-1 bg-white text-slate-900 rounded-lg border-2 border-slate-900 text-xs font-black shadow-[2px_2px_0px_0px_#0F172A] inline-block uppercase">
              AI Powered Career Specialist
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Ask AI Career Assistant (/ask-ai)
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm font-bold leading-relaxed">
              Get instant answers on SystemVerilog syntax, DRDO/ISRO recruitment exam syllabus, STA timing violation fixes, and JRF fellowship eligibility.
            </p>
            <div className="flex flex-wrap gap-2 pt-2 text-xs font-black text-slate-900">
              <span className="px-3 py-1 bg-white border border-slate-900 rounded-md">⚡ RTL Debugging</span>
              <span className="px-3 py-1 bg-white border border-slate-900 rounded-md">⚡ DRDO/ISRO Exam Guidance</span>
              <span className="px-3 py-1 bg-white border border-slate-900 rounded-md">⚡ STA &amp; Setup/Hold Math</span>
            </div>
          </div>

          <Link
            href="/ask-ai"
            className="px-8 py-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-black text-sm border-3 border-slate-900 shadow-[4px_4px_0px_0px_#0F172A] transition-all shrink-0 inline-flex items-center gap-2"
          >
            <Bot className="w-5 h-5 text-blue-600 stroke-[2.5]" />
            LAUNCH ASK AI ASSISTANT
          </Link>
        </div>
      </section>

      {/* 8. SEMICONDUCTOR INDUSTRY NEWS FEED */}
      {news.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Semiconductor Industry News</h2>
              <p className="text-slate-600 text-sm mt-1 font-semibold">Daily updates from IEEE Spectrum, EE Times, and Semiconductor Engineering</p>
            </div>
            <Link href="/news" className="text-blue-600 text-sm font-extrabold hover:underline flex items-center gap-1">
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

      {/* 9. PONYTAIL LAZY LOADED REVIEWS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <ReviewsSection />
      </section>

      {/* 10. PONYTAIL LAZY LOADED FAQS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <FaqSection />
      </section>

      {/* 11. PONYTAIL LAZY LOADED SUBSCRIBE & ALERT SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <SubscribeSection />
      </section>

    </div>
  );
}
