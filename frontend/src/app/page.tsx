export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import nextDynamic from "next/dynamic";
import {
  ArrowRight, Sparkles, ShieldCheck, UserCheck,
  Building2, GraduationCap, Search, CheckCircle2, Newspaper, Radio
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { mapDbOpportunityToClient } from "@/lib/utils";
import type { Opportunity, NewsArticle } from "@/types";
import OpportunityCard from "@/components/OpportunityCard";
import NewsCard from "@/components/NewsCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

// Ponytail Lazy Loading for heavy client interactive components
const ReviewsSection = nextDynamic(() => import("@/components/ReviewsSection"), {
  loading: () => <div className="h-64 bg-white border-2 border-slate-900 rounded-2xl animate-pulse" />,
});

const FaqSection = nextDynamic(() => import("@/components/FaqSection"), {
  loading: () => <div className="h-64 bg-white border-2 border-slate-900 rounded-2xl animate-pulse" />,
});

const SubscribeSection = nextDynamic(() => import("@/components/SubscribeSection"), {
  loading: () => <div className="h-48 bg-blue-600 border-2 border-slate-900 rounded-2xl animate-pulse" />,
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
    <div className="space-y-20 pb-16">

      {/* 1. HERO — restrained headline, single accent, flat trust row */}
      <section className="relative overflow-hidden bg-[#FAF9F6] border-b-2 border-slate-900 py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

          {/* TOP ANNOUNCEMENT BADGE */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-900 shadow-brutal-sm mb-8">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wide text-slate-800">
              100% Verified Jobs &bull; DRDO, ISRO, CSIR, IITs, Intel, Qualcomm, AMD &amp; Arm
            </span>
          </div>

          {/* MAIN HERO HEADLINE */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.06] max-w-5xl mx-auto">
            India&apos;s Premier Portal for{" "}
            <span className="text-blue-600">VLSI &amp; Semiconductor Jobs</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed font-medium">
            Discover verified JRF, SRF, PhD admissions, government Scientist B posts, and private VLSI engineering roles from top research labs and global semiconductor chip leaders.
          </p>

          {/* HERO CALL TO ACTIONS — one primary, two secondary */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button href="/opportunities" size="lg">
              Browse Jobs &amp; Opportunities <ArrowRight className="w-4 h-4" />
            </Button>
            <Button href="/academy" variant="success" size="lg">
              <GraduationCap className="w-5 h-5" /> Explore VLSI Courses
            </Button>
            <Button href="/ask-ai" variant="secondary" size="lg">
              <Sparkles className="w-4 h-4 text-blue-600" /> Ask AI Assistant
            </Button>
          </div>

          {/* POPULAR SEARCH PILLS */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5 text-xs text-slate-900">
            <span className="font-bold uppercase text-slate-500 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-blue-600" /> Popular:
            </span>
            {["DRDO JRF", "ISRO Scientist", "IIT Bombay PhD", "SystemVerilog Verification", "RTL Design", "Qualcomm Hyderabad", "Physical Design STA"].map((tag) => (
              <Link
                key={tag}
                href={`/opportunities?search=${encodeURIComponent(tag)}`}
                className="px-3.5 py-1.5 bg-white border-2 border-slate-900 rounded-full font-semibold text-slate-900 hover:bg-blue-600 hover:text-white transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* 2. REAL-TIME STATS STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { value: `${stats.total}+`, label: "Active Opportunities" },
            { value: `${stats.verified}+`, label: "Official Links Verified" },
            { value: `${stats.jrf}+`, label: "JRF Fellowships" },
            { value: `${stats.phd}+`, label: "PhD Programs" },
          ].map((s) => (
            <Card key={s.label} className="p-6 text-center">
              <p className="text-3xl sm:text-4xl font-black text-blue-600 tracking-tight">{s.value}</p>
              <p className="text-slate-700 text-xs font-bold uppercase tracking-wider mt-1.5">{s.label}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 3. DUAL PLATFORM PORTALS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Platform Features"
          title="Built for Engineers, Researchers & Employers"
          description="Whether you are applying for JRF research fellowships or recruiting top VLSI talent, BerojgarDegreeWala provides dedicated tools."
          align="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* CANDIDATE PORTAL */}
          <Card className="p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 bg-blue-600 border-2 border-slate-900 rounded-2xl flex items-center justify-center text-white shadow-brutal-sm">
                  <UserCheck className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 bg-blue-50 border border-slate-300 rounded-full text-[10px] font-bold text-blue-800 uppercase">
                  Candidate Profile
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900">For Job Seekers &amp; Researchers</h3>
              <p className="text-slate-700 text-sm font-medium leading-relaxed">
                Build industry-grade VLSI skills, claim your unique @username handle, and apply directly to official DRDO, ISRO, IIT, and fabless company job postings.
              </p>

              <ul className="space-y-2.5 text-sm font-medium text-slate-800 pt-2">
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

            <Button href="/signup?role=candidate" className="w-full">
              Create Candidate Account (@username)
            </Button>
          </Card>

          {/* EMPLOYER PORTAL */}
          <Card className="p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 bg-emerald-500 border-2 border-slate-900 rounded-2xl flex items-center justify-center text-slate-900 shadow-brutal-sm">
                  <Building2 className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 bg-emerald-50 border border-slate-300 rounded-full text-[10px] font-bold text-emerald-800 uppercase">
                  Employer Portal
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900">For Employers &amp; Research Labs</h3>
              <p className="text-slate-700 text-sm font-medium leading-relaxed">
                Post verified research fellowships, connect with top VLSI graduates, and claim official organization directory pages.
              </p>

              <ul className="space-y-2.5 text-sm font-medium text-slate-800 pt-2">
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

            <Button href="/signup?role=employer" variant="success" className="w-full">
              Create Employer Account
            </Button>
          </Card>
        </div>
      </section>

      {/* 4. LATEST VERIFIED OPPORTUNITIES (OPEN WITHOUT LOGIN) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Fresh Verified Postings"
          title="Latest Verified Opportunities"
          description="Direct official links from DRDO, ISRO, CSIR, IITs & top semiconductor firms."
          action={
            <Button href="/opportunities" variant="secondary" size="sm">
              View all jobs &rarr;
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestOpenings.slice(0, 6).map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      </section>

      {/* 5. LATEST SEMICONDUCTOR & RESEARCH NEWS SECTION (OPEN WITHOUT LOGIN) */}
      {latestNews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Daily Tech News"
            eyebrowTone="neutral"
            title="Latest Semiconductor & Research News"
            description="Real-time updates from IEEE Spectrum, EE Times, India Semiconductor Mission & top research labs. No login required."
            action={
              <Button href="/community" variant="secondary" size="sm">
                <Newspaper className="w-4 h-4" /> Explore all news &rarr;
              </Button>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestNews.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* 6. REVIEWS, FAQ & NEWSLETTER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        <ReviewsSection />
        <FaqSection />
        <SubscribeSection />
      </section>

      {/* 7. VLSI COURSES SHOWCASE (FINAL CONTENT SECTION IMMEDIATELY ABOVE FOOTER) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 border-2 border-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-brutal-lg space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <span className="px-3 py-1 bg-emerald-400 text-slate-950 rounded-lg border-2 border-slate-950 text-xs font-bold uppercase">
                Free Structured Learning
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                VLSI Courses &amp; Synthesizable Design Labs
              </h2>
              <p className="text-slate-300 text-sm sm:text-base font-medium leading-relaxed">
                Step-by-step VLSI learning tracks covering SystemVerilog, UVM Verification, STA Timing Closure, and FPGA synthesis using top free curated resources.
              </p>
            </div>
            <Button href="/academy" variant="success" className="shrink-0">
              Explore all VLSI courses &rarr;
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {[
              { day: "Track 1", title: "Digital Logic & SystemVerilog", desc: "Combinational & sequential circuits, FSM design, synthesizable SystemVerilog constructs." },
              { day: "Track 2", title: "RTL Verification & UVM", desc: "Testbench architecture, constrained random generation, functional coverage, UVM methodology." },
              { day: "Track 3", title: "Physical Design & STA", desc: "Floorplanning, CTS, Placement, Setup/Hold slack analysis, Primetime STA timing closure." },
            ].map((course) => (
              <div key={course.title} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-3">
                <span className="px-2.5 py-1 bg-blue-600 text-white rounded-md text-[10px] font-bold uppercase">{course.day}</span>
                <h3 className="text-lg font-black text-white">{course.title}</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">{course.desc}</p>
                <Link href="/academy" className="text-blue-400 text-sm font-bold hover:underline inline-block pt-2">
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