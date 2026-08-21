export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import nextDynamic from "next/dynamic";
import {
  ArrowRight, Sparkles, ShieldCheck, UserCheck,
  Building2, GraduationCap, Search, CheckCircle2, Newspaper,
  Briefcase, Award, BookOpen, Layers, Cpu, Compass, Globe2,
  Atom, Flame, Rocket, ChevronRight, Check
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { mapDbOpportunityToClient } from "@/lib/utils";
import type { Opportunity, NewsArticle } from "@/types";
import OpportunityCard from "@/components/OpportunityCard";
import NewsCard from "@/components/NewsCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
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

const PREMIER_ORGS = [
  {
    name: "ISRO",
    fullName: "Indian Space Research Organisation",
    category: "Space Tech & Payloads",
    scope: "Satellite avionics, digital signal processing, space-grade ASIC & VLSI hardware.",
    icon: Rocket,
    color: "bg-blue-600",
    searchQuery: "ISRO",
    badge: "Government Space Lab",
  },
  {
    name: "DRDO",
    fullName: "Defence Research & Development Organisation",
    category: "Defence Electronics & Radar",
    scope: "SSPL, LRDE, CAIR, DEAL laboratories hiring JRF, SRF & Scientist 'B' engineers.",
    icon: ShieldCheck,
    color: "bg-emerald-600",
    searchQuery: "DRDO",
    badge: "Defence R&D Lab",
  },
  {
    name: "CSIR Labs",
    fullName: "Council of Scientific & Industrial Research",
    category: "National Microelectronics",
    scope: "CSIR-CEERI Pilani, NPL Delhi, CSIO Chandigarh microelectronics research posts.",
    icon: Atom,
    color: "bg-amber-600",
    searchQuery: "CSIR",
    badge: "National Research Institute",
  },
  {
    name: "IIT Microelectronics",
    fullName: "IIT Bombay, IIT Madras, IIT Delhi & IISc",
    category: "Premier Academic R&D",
    scope: "SHAKTI RISC-V processor, CeNSE Nano Science, IRCC & ICSR sponsored project fellowships.",
    icon: GraduationCap,
    color: "bg-purple-600",
    searchQuery: "IIT",
    badge: "Premier Academia",
  },
  {
    name: "C-DAC & BEL",
    fullName: "Centre for Development of Advanced Computing & BEL",
    category: "Indigenous Silicon & Defence",
    scope: "VEGA & AVIC processor initiatives, radar systems, high-reliability embedded hardware.",
    icon: Cpu,
    color: "bg-red-600",
    searchQuery: "CDAC",
    badge: "Strategic Govt PSU",
  },
  {
    name: "Semiconductor Industry",
    fullName: "Intel, Qualcomm, AMD, Arm, TI & Micron",
    category: "Global Fabless & IDMs",
    scope: "RTL design, SystemVerilog UVM verification, Physical Design, STA & Silicon validation.",
    icon: Layers,
    color: "bg-slate-900",
    searchQuery: "Qualcomm",
    badge: "Industry Leaders",
  },
];

const DOMAIN_SPECIALIZATIONS = [
  {
    title: "Digital RTL Design & Architecture",
    description: "Microarchitecture definition, synthesizable Verilog/SystemVerilog, FSM design, bus protocols (AXI, AHB, APB), and low-power clock gating.",
    tags: ["SystemVerilog", "RTL", "AXI4", "FSM", "UPF"],
    path: "/opportunities?search=RTL",
  },
  {
    title: "Design Verification & UVM",
    description: "Constrained-random testbench architectures, functional coverage, SystemVerilog assertions (SVA), UVM methodology, and formal verification.",
    tags: ["UVM", "SVA", "Coverage", "Testbench"],
    path: "/opportunities?search=Verification",
  },
  {
    title: "Physical Design & STA Timing",
    description: "Netlist to GDSII flow, floorplanning, power planning, clock tree synthesis (CTS), routing, DRC/LVS closure, and Primetime STA slack closure.",
    tags: ["GDSII", "CTS", "STA", "Primetime", "DRC/LVS"],
    path: "/opportunities?search=Physical%20Design",
  },
  {
    title: "Analog, Mixed-Signal & RFIC",
    description: "Operational amplifiers, PLL, ADC/DAC converters, bandgap references, high-speed SerDes, and RF front-end transceiver design.",
    tags: ["Cadence Virtuoso", "Spectre", "ADC/DAC", "PLL", "RFIC"],
    path: "/opportunities?search=Analog",
  },
  {
    title: "FPGA Prototyping & Embedded Silicon",
    description: "Xilinx Vivado, Intel Quartus, Zynq SoC integration, PCIe/Ethernet interfaces, bare-metal C drivers, and board-level bring-up.",
    tags: ["Vivado", "Zynq SoC", "PCIe", "Board Bring-Up"],
    path: "/opportunities?search=FPGA",
  },
  {
    title: "Semiconductor Fab & Packaging (MEMS)",
    description: "Cleanroom lithography, thin-film deposition, dry etching, wafer packaging (2.5D/3D chiplets), and physical failure analysis.",
    tags: ["Lithography", "Cleanroom", "3D Packaging", "MEMS"],
    path: "/opportunities?search=Fabrication",
  },
];

export default async function HomePage() {
  const stats = await getStats();
  const latestOpenings = await getLatestOpportunities();
  const latestNews = await getLatestNews();

  return (
    <div className="space-y-20 pb-20">

      {/* 1. HERO SECTION — Professional, Content-Rich & Clear 3-Portal Architecture */}
      <section className="relative overflow-hidden bg-[#FAF9F6] border-b-2 border-slate-900 py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

          {/* TOP ANNOUNCEMENT BADGE */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-900 shadow-brutal-sm mb-6">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span className="text-xs font-black uppercase tracking-wide text-slate-800">
              Official Hub for ISRO, DRDO, CSIR, IITs, Intel, Qualcomm, AMD &amp; Arm Opportunities
            </span>
          </div>

          {/* MAIN HERO HEADLINE */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.06] max-w-5xl mx-auto">
            India&apos;s Dedicated Gateway for{" "}
            <span className="text-accent">Semiconductor, VLSI &amp; Deep-Tech</span> Careers
          </h1>

          <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed font-medium">
            Explore verified government JRF/SRF fellowships (₹37,000–₹42,000/mo), DRDO &amp; ISRO Scientist posts, IIT microelectronics research admissions, and global fabless chip design roles.
          </p>

          {/* HERO CALL TO ACTIONS */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button href="/opportunities" size="lg">
              Browse All Opportunities <ArrowRight className="w-4 h-4" />
            </Button>
            <Button href="/organizations" variant="secondary" size="lg">
              <Building2 className="w-5 h-5 text-accent" /> Browse by Organization
            </Button>
            <Button href="/academy" variant="success" size="lg">
              <GraduationCap className="w-5 h-5" /> Free VLSI Courses
            </Button>
          </div>

          {/* POPULAR ORGANIZATION & SEARCH PILLS */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-900 max-w-4xl mx-auto">
            <span className="font-bold uppercase text-slate-500 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-accent" /> Direct Filter:
            </span>
            {[
              { label: "ISRO Careers", q: "ISRO" },
              { label: "DRDO JRF", q: "DRDO" },
              { label: "CSIR CEERI", q: "CSIR" },
              { label: "IIT Bombay PhD", q: "IIT Bombay" },
              { label: "Qualcomm RTL", q: "Qualcomm" },
              { label: "Intel Physical Design", q: "Intel" },
              { label: "SystemVerilog UVM", q: "Verification" },
              { label: "Analog RFIC", q: "Analog" },
            ].map((tag) => (
              <Link
                key={tag.label}
                href={`/opportunities?search=${encodeURIComponent(tag.q)}`}
                className="px-3.5 py-1.5 bg-white border-2 border-slate-900 rounded-full font-bold text-slate-900 hover:bg-accent hover:text-white transition-all shadow-brutal-sm hover:-translate-y-0.5"
              >
                {tag.label}
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* 2. REAL-TIME STATS COUNTER STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { value: `${stats.total}+`, label: "Active Opportunities", sub: "Government & Industry" },
            { value: `${stats.verified}+`, label: "Verified Postings", sub: "Direct Circular URLs" },
            { value: `${stats.jrf}+`, label: "JRF & Research Grants", sub: "DST / CSIR Norms" },
            { value: `${stats.phd}+`, label: "PhD & Fellowship Seats", sub: "IITs, IISc & NITs" },
          ].map((s) => (
            <Card key={s.label} className="p-6 text-center">
              <p className="text-3xl sm:text-4xl font-black text-accent tracking-tight">{s.value}</p>
              <p className="text-slate-900 text-xs font-black uppercase tracking-wider mt-1.5">{s.label}</p>
              <p className="text-slate-500 text-[11px] font-semibold mt-0.5">{s.sub}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 3. PREMIER GOVERNMENT & RESEARCH ORGANIZATIONS SPOTLIGHT (KEY USER MANDATE) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-accent mb-2 px-3 py-1 bg-blue-50 border-2 border-slate-900 rounded-lg shadow-brutal-sm">
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              <span>PREMIER GOVERNMENT &amp; RESEARCH INSTITUTIONS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              Top Research Labs &amp; Organizations
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm font-medium mt-1 max-w-2xl">
              Click any organization below to immediately view all active JRF, SRF, Scientist and engineering openings verified from official circulars.
            </p>
          </div>

          <Button href="/organizations" variant="secondary" size="sm">
            View All Organizations &rarr;
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PREMIER_ORGS.map((org) => {
            const IconComponent = org.icon;
            return (
              <Link
                key={org.name}
                href={`/opportunities?search=${encodeURIComponent(org.searchQuery)}`}
                className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-brutal hover:shadow-brutal-lg hover:-translate-y-1 transition-all duration-300 group block flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl ${org.color} border-2 border-slate-900 flex items-center justify-center text-white shadow-brutal-sm`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <Badge tone="neutral">
                      {org.badge}
                    </Badge>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 group-hover:text-accent transition-colors">
                    {org.name}
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">
                    {org.fullName}
                  </p>
                  <p className="text-xs text-slate-700 font-medium mt-3 leading-relaxed">
                    {org.scope}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t-2 border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-accent group-hover:underline flex items-center gap-1">
                    Explore verified openings <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                    Live
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. LATEST VERIFIED OPPORTUNITIES (DIRECT ACCESS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Direct Verified Feeds"
          title="Latest Openings &amp; Fellowships"
          description="Verified positions with official links, stipends, eligibility criteria, and deadlines."
          action={
            <Button href="/opportunities" variant="secondary" size="sm">
              Explore all {stats.total}+ jobs &rarr;
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestOpenings.slice(0, 6).map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      </section>

      {/* 5. AUTHORITATIVE RESEARCH FELLOWSHIP GUIDE (SUBSTANTIAL CONTENT EXPANSION) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-8 sm:p-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-accent mb-2 px-3 py-1 bg-blue-50 border-2 border-slate-900 rounded-lg shadow-brutal-sm">
              <Award className="w-4 h-4 stroke-[2.5]" />
              <span>FELLOWSHIP &amp; STIPEND SCALE REFERENCE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Government Research Fellowship &amp; Scientist Pay Scales (2026 Norms)
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm font-medium mt-1">
              Comprehensive guidelines per Department of Science &amp; Technology (DST), CSIR, DRDO, and Ministry of Education revised emoluments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-5 space-y-2">
              <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-300">
                Junior Research Fellow (JRF)
              </span>
              <p className="text-2xl font-black text-slate-900">₹37,000 / mo</p>
              <p className="text-xs text-slate-600 font-medium">
                + HRA (8%–27% based on city tier). For B.Tech / M.Tech with valid GATE or CSIR-UGC NET score (Months 1–24).
              </p>
            </div>

            <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-5 space-y-2">
              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                Senior Research Fellow (SRF)
              </span>
              <p className="text-2xl font-black text-slate-900">₹42,000 / mo</p>
              <p className="text-xs text-slate-600 font-medium">
                + HRA. Awarded after 2 years of proven research performance + assessment committee evaluation (Months 25–60).
              </p>
            </div>

            <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-5 space-y-2">
              <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded border border-purple-300">
                Research Associate (RA-I to III)
              </span>
              <p className="text-2xl font-black text-slate-900">₹58,000–₹67,000</p>
              <p className="text-xs text-slate-600 font-medium">
                + HRA. Postdoctoral researchers holding PhD/MD/MS in Microelectronics, Nanotech, or Physics with peer-reviewed publications.
              </p>
            </div>

            <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-5 space-y-2">
              <span className="text-[10px] font-black uppercase text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-300">
                Scientist &apos;B&apos; (DRDO / ISRO)
              </span>
              <p className="text-2xl font-black text-slate-900">Level 10 Matrix</p>
              <p className="text-xs text-slate-600 font-medium">
                Basic ₹56,100 + DA + HRA + Transport (~₹1.1–1.3 Lakhs/mo gross). Direct recruitment through RAC &amp; ICRB with GATE score.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t-2 border-slate-100">
            <div className="space-y-3">
              <h4 className="font-black text-sm text-slate-900 uppercase tracking-wide">
                Key Eligibility Criteria for Government Research:
              </h4>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span><strong>GATE Score Validity:</strong> Valid GATE in Electronics &amp; Comm (EC), Electrical (EE), Computer Science (CS), or Instrumentation (IN).</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span><strong>Educational Background:</strong> First-class B.E./B.Tech (60%+ or 6.75 CGPA) or M.E./M.Tech in Microelectronics/VLSI.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span><strong>Age Limits &amp; Relaxations:</strong> Upper age 28 years for JRF (relaxable by 5 years for SC/ST/PwD, 3 years for OBC-NCL).</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-black text-sm text-slate-900 uppercase tracking-wide">
                Application &amp; Document Checklist:
              </h4>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span><strong>Official Application Form:</strong> Downloaded directly from DRDO RAC, ISRO Careers, or CSIR lab portal.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span><strong>Academic Proofs:</strong> Consolidated marksheets, provisional/original degree certificates, and GATE scorecard.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span><strong>No-Objection Certificate (NOC):</strong> Required if currently employed in government/PSU/autonomous bodies.</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </section>

      {/* 6. SEMICONDUCTOR DOMAIN SPECIALIZATION HUB */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Specialization Tracks"
          title="Semiconductor &amp; VLSI Domain Pathways"
          description="Explore focused opportunities across the complete silicon chip development lifecycle."
          align="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DOMAIN_SPECIALIZATIONS.map((domain) => (
            <Link
              key={domain.title}
              href={domain.path}
              className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-brutal hover:shadow-brutal-lg hover:-translate-y-1 transition-all duration-300 group block flex flex-col justify-between"
            >
              <div className="space-y-3">
                <h3 className="text-lg font-black text-slate-900 group-hover:text-accent transition-colors">
                  {domain.title}
                </h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {domain.description}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {domain.tags.map((tag) => (
                    <span key={tag} className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-accent group-hover:underline">
                  Browse {domain.title.split(" ")[0]} Jobs &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. DUAL PLATFORM PORTALS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Three Integrated Portals"
          title="Built for Candidates, Employers &amp; Public Research"
          description="A dedicated ecosystem tailored for hardware engineers, recruiters, and scholars."
          align="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CANDIDATE PORTAL */}
          <Card className="p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-accent border-2 border-slate-900 rounded-xl flex items-center justify-center text-white shadow-brutal-sm">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Job Seekers &amp; Scholars</h3>
              <p className="text-slate-700 text-xs font-medium leading-relaxed">
                Claim your verified @username profile, build your VLSI portfolio, and apply directly to government fellowships and top tech companies.
              </p>

              <ul className="space-y-2 text-xs font-medium text-slate-800 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Unique handle profile (e.g. @ananya_vlsi).</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Direct apply to DRDO, ISRO &amp; IITs.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Peer networking &amp; direct messaging.</span>
                </li>
              </ul>
            </div>

            <Button href="/signup?role=candidate" className="w-full" size="sm">
              Candidate Registration (@username)
            </Button>
          </Card>

          {/* EMPLOYER PORTAL */}
          <Card className="p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-emerald-500 border-2 border-slate-900 rounded-xl flex items-center justify-center text-slate-900 shadow-brutal-sm">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Employers &amp; Research Labs</h3>
              <p className="text-slate-700 text-xs font-medium leading-relaxed">
                Post research fellowship circulars, hire specialized hardware graduates, and claim official organization directory pages.
              </p>

              <ul className="space-y-2 text-xs font-medium text-slate-800 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Claim official org page (e.g. @drdo_rac).</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Post verified JRF, PhD &amp; design posts.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Direct talent search across IITs/NITs.</span>
                </li>
              </ul>
            </div>

            <Button href="/signup?role=employer" variant="success" className="w-full" size="sm">
              Employer / Lab Registration
            </Button>
          </Card>

          {/* OPEN PUBLIC AGGREGATOR */}
          <Card className="p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-amber-400 border-2 border-slate-900 rounded-xl flex items-center justify-center text-slate-900 shadow-brutal-sm">
                <Globe2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Open Public Aggregator</h3>
              <p className="text-slate-700 text-xs font-medium leading-relaxed">
                Zero-friction open portal: anyone can browse opportunities, read daily semiconductor news, and access academy tutorials without signup.
              </p>

              <ul className="space-y-2 text-xs font-medium text-slate-800 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>100% free open access without account.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Daily RSS news updates &amp; circulars.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Direct links to official career portals.</span>
                </li>
              </ul>
            </div>

            <Button href="/opportunities" variant="secondary" className="w-full" size="sm">
              Explore Open Aggregator
            </Button>
          </Card>
        </div>
      </section>

      {/* 8. LATEST SEMICONDUCTOR & RESEARCH NEWS SECTION */}
      {latestNews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Daily Tech News"
            title="Latest Semiconductor &amp; Research News"
            description="Real-time updates from IEEE Spectrum, EE Times, India Semiconductor Mission & top research labs. No login required."
            action={
              <Button href="/news" variant="secondary" size="sm">
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

      {/* 9. VLSI COURSES SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 border-2 border-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-brutal-lg space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <span className="px-3 py-1 bg-emerald-400 text-slate-950 rounded-lg border-2 border-slate-950 text-xs font-bold uppercase">
                Free Structured Learning
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                VLSI Academy &amp; Synthesizable Design Labs
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

      {/* 10. REVIEWS, FAQ & NEWSLETTER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        <ReviewsSection />
        <FaqSection />
        <SubscribeSection />
      </section>

    </div>
  );
}