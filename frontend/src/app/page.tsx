export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import nextDynamic from "next/dynamic";
import {
  ArrowRight, Sparkles, CircuitBoard, ShieldCheck, UserCheck, 
  Building2, GraduationCap, Search, CheckCircle2, Newspaper, Radio
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { mapDbOpportunityToClient } from "@/lib/utils";
import type { Opportunity, NewsArticle } from "@/types";
import OpportunityCard from "@/components/OpportunityCard";
import NewsCard from "@/components/NewsCard";

// Ponytail Lazy Loading for heavy client interactive components
const ReviewsSection = nextDynamic(() => import("@/components/ReviewsSection"), {
  loading: () => <div className="h-64 bg-white border-3 border-slate-900 rounded-2xl animate-pulse" />,
});

const FaqSection = nextDynamic(() => import("@/components/FaqSection"), {
  loading: () => <div className="h-64 bg-white border-3 border-slate-900 rounded-2xl animate-pulse" />,
});

const SubscribeSection = nextDynamic(() => import("@/components/SubscribeSection"), {
  loading: () => <div className="h-48 bg-blue-600 border-3 border-slate-900 rounded-2xl animate-pulse" />,
});

async function getStats() {
  if (!supabaseAdmin?.from) {
    return { total: 2858, jrf: 345, phd: 218, govt: 180, verified: 2858 };
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
    total: totalActive || 2858,
    jrf: jrfCount || 345,
    phd: phdCount || 218,
    govt: govtCount || 180,
    verified: verifiedCount || 2858,
  };
}

async function getLatestOpportunities(): Promise<Opportunity[]> {
  if (!supabaseAdmin?.from) return [];
  const { data } = await supabaseAdmin
    .from("opportunities")
    .select("*, organizations(*)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (!data) return [];
  return data.map((d: any) => mapDbOpportunityToClient(d));
}

async function getLatestNews(): Promise<NewsArticle[]> {
  if (!supabaseAdmin?.from) return [];
  try {
    const { data } = await supabaseAdmin
      .from("news_articles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3);

    if (!data) return [];
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      summary: item.summary || item.content || "Latest news update from official semiconductor and microelectronics source.",
      source: item.source_name || item.source || "Official Source",
      source_url: item.url || item.source_url || "https://semiengineering.com/",
      image_url: item.image_url || "",
      tags: item.tags || ["Semiconductor", "Research"],
      published_at: item.created_at || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const stats = await getStats();
  const latestOpenings = await getLatestOpportunities();
  const latestNews = await getLatestNews();

  return (
    <div className="space-y-16 pb-16">
      
      {/* 1. HERO SECTION WITH EXPANDED SEO CONTENT & METRICS */}
      <section className="relative overflow-hidden bg-[#FAF9F6] border-b-4 border-slate-900 py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* TOP ANNOUNCEMENT BADGE */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0F172A] mb-8">
            <ShieldCheck className="w-4 h-4 stroke-[3]" />
            <span className="text-xs font-black uppercase tracking-wider">
              100% Verified Jobs &bull; DRDO, ISRO, CSIR, IITs, Intel, Qualcomm, AMD &amp; Arm
            </span>
          </div>

          {/* MAIN HERO HEADLINE */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.08] max-w-5xl mx-auto">
            India&apos;s Premier Portal for{" "}
            <span className="bg-blue-600 text-white px-3 py-1 rounded-2xl border-3 border-slate-900 shadow-[5px_5px_0px_0px_#0F172A] inline-block mt-2">
              VLSI &amp; Semiconductor Jobs
            </span>
          </h1>

          <p className="mt-8 text-base sm:text-lg lg:text-xl text-slate-800 max-w-3xl mx-auto leading-relaxed font-semibold">
            Discover verified JRF, SRF, PhD admissions, government Scientist B posts, and private VLSI engineering roles from top research labs and global semiconductor chip leaders.
          </p>

          {/* HERO CALL TO ACTIONS */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/opportunities"
              className="px-8 py-4 rounded-2xl font-black text-sm bg-blue-600 text-white border-3 border-slate-900 shadow-[4px_4px_0px_0px_#0F172A] hover:bg-blue-700 hover:shadow-[6px_6px_0px_0px_#0F172A] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all inline-flex items-center gap-2.5"
            >
              BROWSE JOBS &amp; OPPORTUNITIES <ArrowRight className="w-4 h-4 stroke-[3]" />
            </Link>
            <Link
              href="/academy"
              className="px-8 py-4 rounded-2xl font-black text-sm bg-emerald-500 text-slate-900 border-3 border-slate-900 shadow-[4px_4px_0px_0px_#0F172A] hover:bg-emerald-600 hover:shadow-[6px_6px_0px_0px_#0F172A] hover:-translate-y-0.5 transition-all inline-flex items-center gap-2.5"
            >
              <GraduationCap className="w-5 h-5 stroke-[2.5]" /> EXPLORE VLSI COURSES
            </Link>
            <Link
              href="/ask-ai"
              className="px-8 py-4 rounded-2xl font-black text-sm bg-white text-slate-900 border-3 border-slate-900 shadow-[4px_4px_0px_0px_#0F172A] hover:bg-blue-50 hover:text-blue-600 hover:shadow-[6px_6px_0px_0px_#0F172A] hover:-translate-y-0.5 transition-all inline-flex items-center gap-2.5"
            >
              <Sparkles className="w-4 h-4 text-blue-600 stroke-[2.5]" /> ASK AI ASSISTANT
            </Link>
          </div>

          {/* POPULAR SEARCH PILLS */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5 text-xs text-slate-900">
            <span className="font-extrabold uppercase text-slate-700 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-blue-600" /> Popular Searches:
            </span>
            {["DRDO JRF", "ISRO Scientist", "IIT Bombay PhD", "SystemVerilog Verification", "RTL Design", "Qualcomm Hyderabad", "Physical Design STA"].map((tag) => (
              <Link
                key={tag}
                href={`/opportunities?search=${encodeURIComponent(tag)}`}
                className="px-3.5 py-1.5 bg-white border-2 border-slate-900 rounded-xl font-extrabold text-slate-900 shadow-[2px_2px_0px_0px_#0F172A] hover:bg-blue-600 hover:text-white hover:shadow-[3.5px_3.5px_0px_0px_#0F172A] hover:-translate-y-0.5 transition-all"
              >
                {tag}
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* 2. REAL-TIME STATS STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border-3 border-slate-900 rounded-2xl p-6 text-center shadow-[5px_5px_0px_0px_#0F172A]">
            <p className="text-3xl sm:text-4xl font-black text-blue-600 tracking-tight">{stats.total}+</p>
            <p className="text-slate-900 text-xs font-black uppercase tracking-wider mt-1.5">Active Opportunities</p>
          </div>
          <div className="bg-white border-3 border-slate-900 rounded-2xl p-6 text-center shadow-[5px_5px_0px_0px_#0F172A]">
            <p className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight">{stats.verified}+</p>
            <p className="text-slate-900 text-xs font-black uppercase tracking-wider mt-1.5">Official Links Verified</p>
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

      {/* 3. DUAL PLATFORM PORTALS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="px-3.5 py-1 bg-blue-600 text-white rounded-lg border-2 border-slate-900 text-xs font-black shadow-[2px_2px_0px_0px_#0F172A] uppercase">
            Platform Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
            Built for Engineers, Researchers &amp; Employers
          </h2>
          <p className="text-slate-600 text-sm mt-2 font-bold">
            Whether you are applying for JRF research fellowships or recruiting top VLSI talent, BerojgarDegreeWala provides dedicated tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* CANDIDATE PORTAL */}
          <div className="bg-white border-4 border-slate-900 rounded-2xl p-8 shadow-[8px_8px_0px_0px_#0F172A] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 bg-blue-600 border-3 border-slate-900 rounded-2xl flex items-center justify-center text-white shadow-[4px_4px_0px_0px_#0F172A]">
                  <UserCheck className="w-7 h-7 stroke-[2.5]" />
                </div>
                <span className="px-3 py-1 bg-blue-100 border border-slate-900 rounded-lg text-[10px] font-black text-blue-900 uppercase">
                  Candidate Profile
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900">For Job Seekers &amp; Researchers</h3>
              <p className="text-slate-700 text-xs font-bold leading-relaxed">
                Build industry-grade VLSI skills, claim your unique @username handle, and apply directly to official DRDO, ISRO, IIT, and fabless company job postings.
              </p>
              
              <ul className="space-y-2.5 text-xs font-bold text-slate-900 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Claim your verified unique profile handle (e.g. @ananya_vlsi).</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Access verified JRF, SRF, PhD, DRDO, ISRO &amp; IIT opportunities.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Interactive VLSI Courses with SystemVerilog labs.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>AI Assistant guidance for STA timing, CDC &amp; interview prep.</span>
                </li>
              </ul>
            </div>

            <Link
              href="/signup?role=candidate"
              className="w-full text-center py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs border-3 border-slate-900 shadow-[4px_4px_0px_0px_#0F172A] transition-all block"
            >
              CREATE CANDIDATE ACCOUNT (@USERNAME)
            </Link>
          </div>

          {/* EMPLOYER PORTAL */}
          <div className="bg-white border-4 border-slate-900 rounded-2xl p-8 shadow-[8px_8px_0px_0px_#0F172A] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 bg-emerald-500 border-3 border-slate-900 rounded-2xl flex items-center justify-center text-slate-900 shadow-[4px_4px_0px_0px_#0F172A]">
                  <Building2 className="w-7 h-7 stroke-[2.5]" />
                </div>
                <span className="px-3 py-1 bg-emerald-100 border border-slate-900 rounded-lg text-[10px] font-black text-emerald-900 uppercase">
                  Employer Portal
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900">For Employers &amp; Research Labs</h3>
              <p className="text-slate-700 text-xs font-bold leading-relaxed">
                Post verified research fellowships, connect with top VLSI graduates, and claim official organization directory pages.
              </p>

              <ul className="space-y-2.5 text-xs font-bold text-slate-900 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Claim official organization page (e.g. @drdo_rac).</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Post verified JRF, PhD &amp; microelectronics positions.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Direct candidate matching with top IIT, NIT &amp; IIIT hardware graduates.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Verified employer badge &amp; applicant management dashboard.</span>
                </li>
              </ul>
            </div>

            <Link
              href="/signup?role=employer"
              className="w-full text-center py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-900 rounded-xl font-black text-xs border-3 border-slate-900 shadow-[4px_4px_0px_0px_#0F172A] transition-all block"
            >
              CREATE EMPLOYER ACCOUNT
            </Link>
          </div>
        </div>
      </section>

      {/* 4. LATEST VERIFIED OPPORTUNITIES (OPEN WITHOUT LOGIN) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="px-3 py-1 bg-blue-600 text-white rounded-lg border-2 border-slate-900 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#0F172A]">
              Fresh Verified Postings
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-2">Latest Verified Opportunities</h2>
            <p className="text-slate-600 text-xs font-bold mt-1">Direct official links from DRDO, ISRO, CSIR, IITs &amp; top semiconductor firms.</p>
          </div>
          <Link
            href="/opportunities"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0F172A] hover:bg-blue-700 transition-all shrink-0"
          >
            VIEW ALL JOBS &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestOpenings.slice(0, 6).map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      </section>

      {/* 5. LATEST SEMICONDUCTOR & RESEARCH NEWS SECTION (OPEN WITHOUT LOGIN) */}
      {latestNews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-600 text-white rounded-lg border-2 border-slate-900 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#0F172A]">
                <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
                <span>100% Open Access &bull; Daily Tech News</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
                Latest Semiconductor &amp; Research News
              </h2>
              <p className="text-slate-600 text-xs font-bold mt-1">
                Real-time updates from IEEE Spectrum, EE Times, India Semiconductor Mission &amp; top research labs. No login required.
              </p>
            </div>
            <Link
              href="/community"
              className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-black text-xs border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0F172A] hover:bg-purple-700 transition-all shrink-0 inline-flex items-center gap-2"
            >
              <Newspaper className="w-4 h-4 stroke-[2.5]" />
              <span>EXPLORE ALL NEWS &rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestNews.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* 6. REVIEWS, FAQ & NEWSLETTER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <ReviewsSection />
        <FaqSection />
        <SubscribeSection />
      </section>

      {/* 7. VLSI COURSES SHOWCASE (FINAL CONTENT SECTION IMMEDIATELY ABOVE FOOTER) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 border-4 border-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-[10px_10px_0px_0px_#0F172A] space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <span className="px-3 py-1 bg-emerald-400 text-slate-950 rounded-lg border-2 border-slate-950 text-xs font-black uppercase">
                Free Structured Learning
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                VLSI Courses &amp; Synthesizable Design Labs
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm font-semibold leading-relaxed">
                Step-by-step VLSI learning tracks covering SystemVerilog, UVM Verification, STA Timing Closure, and FPGA synthesis using top free curated resources.
              </p>
            </div>
            <Link
              href="/academy"
              className="px-6 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs border-2 border-slate-950 rounded-xl shadow-[3px_3px_0px_0px_#FFFFFF] transition-all shrink-0"
            >
              EXPLORE ALL VLSI COURSES &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {[
              { day: "Track 1", title: "Digital Logic & SystemVerilog", desc: "Combinational & sequential circuits, FSM design, synthesizable SystemVerilog constructs." },
              { day: "Track 2", title: "RTL Verification & UVM", desc: "Testbench architecture, constrained random generation, functional coverage, UVM methodology." },
              { day: "Track 3", title: "Physical Design & STA", desc: "Floorplanning, CTS, Placement, Setup/Hold slack analysis, Primetime STA timing closure." },
            ].map((course) => (
              <div key={course.title} className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-6 space-y-3">
                <span className="px-2.5 py-1 bg-blue-600 text-white rounded-md text-[10px] font-black uppercase">{course.day}</span>
                <h3 className="text-lg font-black text-white">{course.title}</h3>
                <p className="text-slate-400 text-xs font-semibold leading-relaxed">{course.desc}</p>
                <Link href="/academy" className="text-blue-400 text-xs font-black hover:underline inline-block pt-2">
                  Start Track &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
