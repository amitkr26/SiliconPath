"use client";

import { useState } from "react";
import Link from "next/link";
import nextDynamic from "next/dynamic";
import {
  ArrowRight, Sparkles, ShieldCheck, UserCheck,
  Building2, GraduationCap, Search, CheckCircle2,
  Award, Layers, Cpu, Atom, Rocket, ChevronRight, Check,
  ChevronDown, ChevronUp
} from "lucide-react";
import type { Opportunity, NewsArticle } from "@/types";
import OpportunityCard from "@/components/OpportunityCard";
import NewsCard from "@/components/NewsCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

import ReviewsSection from "@/components/ReviewsSection";
import FaqSection from "@/components/FaqSection";
import SubscribeSection from "@/components/SubscribeSection";

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

const PRIORITY_FILTERS = [
  { label: "ISRO Careers", q: "ISRO" },
  { label: "DRDO JRF", q: "DRDO" },
  { label: "CSIR CEERI", q: "CSIR" },
  { label: "IIT Bombay PhD", q: "IIT Bombay" },
  { label: "Qualcomm RTL", q: "Qualcomm" },
];

const SECONDARY_FILTERS = [
  { label: "Intel Physical Design", q: "Intel" },
  { label: "SystemVerilog UVM", q: "Verification" },
];

interface PublicHomeProps {
  stats: {
    total: number;
    jrf: number;
    phd: number;
    govt: number;
    verified: number;
  };
  latestOpenings: Opportunity[];
  latestNews: NewsArticle[];
}

export default function PublicHome({
  stats,
  latestOpenings,
  latestNews,
}: PublicHomeProps) {
  const [showAllFilters, setShowAllFilters] = useState(false);

  // Build stats array dynamically — only show non-zero values with clear semantic distinction
  const statsCards = [
    { value: stats.total, label: "Active Opportunities", sub: "Open for Applications" },
    { value: stats.verified, label: "Verified Circulars", sub: "Source-Validated URLs" },
    { value: stats.jrf, label: "JRF Fellowships", sub: "DST / CSIR Norms" },
    { value: stats.phd, label: "PhD Seats", sub: "IITs, IISc & NITs" },
  ].filter((s) => s.value > 0);

  return (
    <div className="space-y-12 sm:space-y-20 pb-16 sm:pb-20">

      {/* 1. HERO SECTION */}
      <section className="relative bg-slate-50/70 border-b border-slate-200 py-10 sm:py-14 lg:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          {/* TOP BADGE */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs mb-4 sm:mb-6">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-700">
              Opportunities from ISRO, DRDO, CSIR, IITs &amp; Chipmakers
            </span>
          </div>

          {/* MAIN HERO HEADLINE */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 tracking-tight leading-[1.15] sm:leading-[1.1] max-w-xs sm:max-w-2xl lg:max-w-4xl mx-auto">
            India&apos;s Career &amp; Research Gateway for{" "}
            <span className="text-blue-600">Semiconductor &amp; VLSI</span> Engineering
          </h1>

          {/* Desktop: full subtitle. Mobile: shorter, punchier. */}
          <p className="hidden sm:block mt-5 text-base lg:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Explore verified government JRF/SRF fellowships, DRDO &amp; ISRO Scientist posts, IIT microelectronics admissions, and fabless silicon design openings with active deadlines.
          </p>
          <p className="sm:hidden mt-3 text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed font-normal">
            Government JRF/SRF fellowships, DRDO &amp; ISRO posts, IIT admissions &amp; silicon design openings — new opportunities added regularly.
          </p>

          {/* PRIMARY & SECONDARY ACTIONS */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button href="/opportunities" size="lg" className="w-full sm:w-auto text-center font-semibold">
              Explore Active Opportunities <ArrowRight className="w-4 h-4" />
            </Button>
            <div className="flex gap-2.5 sm:gap-3 w-full sm:w-auto">
              <Button href="/organizations" variant="secondary" size="lg" className="flex-1 sm:flex-initial text-center font-semibold">
                <Building2 className="w-4 h-4 text-slate-700" /> <span className="hidden sm:inline">Browse by</span> Organizations
              </Button>
            </div>
          </div>

          {/* SEARCH PILLS */}
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-900 max-w-3xl mx-auto">
            <span className="font-semibold text-slate-500 uppercase flex items-center gap-1 shrink-0">
              <Search className="w-3.5 h-3.5 text-blue-600" /> <span className="hidden sm:inline">Direct Filter:</span>
            </span>

            {/* Priority filters (always visible) */}
            {PRIORITY_FILTERS.map((tag) => (
              <Link
                key={tag.label}
                href={`/opportunities?search=${encodeURIComponent(tag.q)}`}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all shadow-xs"
              >
                {tag.label}
              </Link>
            ))}

            {/* Secondary filters (collapsed on mobile, always visible on sm+) */}
            {SECONDARY_FILTERS.map((tag) => (
              <Link
                key={tag.label}
                href={`/opportunities?search=${encodeURIComponent(tag.q)}`}
                className={cn(
                  "px-3 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all shadow-xs",
                  showAllFilters ? "inline-flex" : "hidden sm:inline-flex"
                )}
              >
                {tag.label}
              </Link>
            ))}

            {/* Mobile toggle for secondary filters */}
            <button
              type="button"
              onClick={() => setShowAllFilters(!showAllFilters)}
              aria-expanded={showAllFilters}
              aria-label={showAllFilters ? "Show fewer filter tags" : "Show more filter tags"}
              className="sm:hidden px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg font-medium text-slate-700 hover:text-slate-900 transition-all flex items-center gap-1 text-[11px]"
            >
              <span>{showAllFilters ? "Fewer" : "+2 More"}</span>
              {showAllFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

        </div>
      </section>

      {/* 2. REAL-TIME STATS COUNTER STRIP — only show non-zero stats */}
      {statsCards.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
          <div className={`grid gap-3 sm:gap-4 ${statsCards.length <= 2 ? "grid-cols-2" : statsCards.length === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 lg:grid-cols-4"}`}>
            {statsCards.map((s) => (
              <Card key={s.label} className="p-4 sm:p-5 text-center shadow-xs">
                <p className="text-xl sm:text-3xl font-bold text-blue-600 tracking-tight">{s.value}+</p>
                <p className="text-slate-900 text-[11px] sm:text-xs font-semibold uppercase tracking-wider mt-1">{s.label}</p>
                <p className="text-slate-500 text-[10px] sm:text-[11px] font-normal mt-0.5">{s.sub}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 3. 3-STEP "HOW IT WORKS" SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Workflow"
          title="How BerojgarDegreeWala Works"
          description="A transparent, direct gateway connecting engineers and researchers with official opportunities."
          align="center"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            { step: "01", title: "Discover Opportunity Circulars", desc: "We aggregate government research fellowship circulars, PSU recruitment notices, and private hardware engineering posts daily." },
            { step: "02", title: "Learn & Prepare", desc: "Access DST/CSIR stipend guides, GATE/NET eligibility criteria, curated NPTEL lectures, and auto-graded VLSI practice modules." },
            { step: "03", title: "Apply Directly", desc: "Every listing connects directly to the official recruitment portal or PDF circular. Zero intermediary fees." },
          ].map((item) => (
            <Card key={item.step} className="p-5 sm:p-6 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                {item.step}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">{item.title}</h3>
              <p className="text-xs text-slate-600 font-normal leading-relaxed">
                {item.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. PREMIER GOVERNMENT & RESEARCH ORGANIZATIONS SPOTLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-md">
              <Sparkles className="w-4 h-4" />
              <span>RESEARCH INSTITUTIONS &amp; LABS</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              Top Research Labs &amp; Organizations
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm font-normal mt-1 max-w-2xl">
              Click any organization below to view active JRF, SRF, Scientist and engineering openings verified from official circulars.
            </p>
          </div>

          <Button href="/organizations" variant="secondary" size="sm" className="shrink-0">
            View All &rarr;
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {PREMIER_ORGS.map((org) => {
            const IconComponent = org.icon;
            return (
              <Link
                key={org.name}
                href={`/opportunities?search=${encodeURIComponent(org.searchQuery)}`}
                className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200 group block flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <Badge tone="neutral">
                      {org.badge}
                    </Badge>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {org.name}
                  </h3>
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-0.5">
                    {org.fullName}
                  </p>
                  <p className="text-xs text-slate-600 font-normal mt-2 sm:mt-3 leading-relaxed line-clamp-2 sm:line-clamp-none">
                    {org.scope}
                  </p>
                </div>

                <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-600 group-hover:underline flex items-center gap-1">
                    Explore openings <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[10px] font-semibold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Live
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. LATEST VERIFIED OPPORTUNITIES (DIRECT ACCESS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Latest Openings"
          title="Verified Opportunities for Freshers &amp; Researchers"
          description="Positions with official links, stipends, eligibility criteria, and deadlines."
          action={
            <Button href="/opportunities" variant="secondary" size="sm">
              View all &rarr;
            </Button>
          }
        />

        {latestOpenings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {latestOpenings.slice(0, 6).map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center space-y-3">
            <p className="font-bold text-slate-800">No matching verified opportunities currently open.</p>
            <p className="text-xs text-slate-500 font-medium">Check back soon or browse our full archive of opportunities.</p>
            <Button href="/opportunities" variant="secondary" size="sm">Browse All Opportunities</Button>
          </Card>
        )}
      </section>

      {/* 6. AUTHORITATIVE RESEARCH FELLOWSHIP GUIDE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-6 sm:p-8 lg:p-10 space-y-6 sm:space-y-8 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-md">
              <Award className="w-4 h-4" />
              <span>FELLOWSHIP &amp; STIPEND SCALE REFERENCE</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              Government Research Fellowship &amp; Scientist Pay Scales
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm font-normal mt-1">
              Per DST/CSIR revised emoluments (2026 norms). Actual figures vary — always verify the specific circular.
            </p>
          </div>

          {/* Mobile: 2-col compact. Desktop: 4-col. */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { badge: "Junior Research Fellow (JRF)", badgeColor: "text-blue-700 bg-blue-50 border-blue-200", value: "₹37,000/mo", desc: "+ HRA (8–27% by city tier). GATE or CSIR-UGC NET score required (Months 1–24)." },
              { badge: "Senior Research Fellow (SRF)", badgeColor: "text-emerald-700 bg-emerald-50 border-emerald-200", value: "₹42,000/mo", desc: "+ HRA. Awarded after 2 years of research + committee evaluation (Months 25–60)." },
              { badge: "Research Associate (RA)", badgeColor: "text-purple-700 bg-purple-50 border-purple-200", value: "₹58–67K/mo", desc: "Postdoctoral. PhD/MD/MS in Microelectronics, Nanotech, or Physics with publications." },
              { badge: "Scientist 'B' (DRDO/ISRO)", badgeColor: "text-slate-800 bg-slate-100 border-slate-300", value: "Level 10", desc: "₹56,100 basic + DA + HRA + Transport (~₹1.1–1.3L/mo gross). GATE score required." },
            ].map((item) => (
              <div key={item.badge} className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 sm:p-5 space-y-2">
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${item.badgeColor}`}>
                  {item.badge}
                </span>
                <p className="text-lg sm:text-2xl font-bold text-slate-900">{item.value}</p>
                <p className="text-[11px] sm:text-xs text-slate-600 font-normal leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-4 border-t border-slate-100">
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                Key Eligibility Criteria:
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 font-normal">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong>GATE Score:</strong> Valid GATE in EC, EE, CS, or IN.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong>Education:</strong> First-class B.E./B.Tech (60%+ or 6.75 CGPA) or M.E./M.Tech.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong>Age:</strong> 28 years for JRF (relaxable 5yr SC/ST/PwD, 3yr OBC-NCL).</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                Application Checklist:
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 font-normal">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong>Application Form:</strong> From DRDO RAC, ISRO Careers, or CSIR lab portal.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong>Academic Proofs:</strong> Marksheets, degree certificates, GATE scorecard.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong>NOC:</strong> Required if currently in government/PSU/autonomous bodies.</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </section>

      {/* 7. SEMICONDUCTOR DOMAIN SPECIALIZATION HUB */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Specialization Tracks"
          title="Semiconductor &amp; VLSI Domain Pathways"
          description="Explore focused opportunities across the complete silicon chip development lifecycle."
          align="center"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {DOMAIN_SPECIALIZATIONS.map((domain) => (
            <Link
              key={domain.title}
              href={domain.path}
              className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200 group block flex flex-col justify-between"
            >
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {domain.title}
                </h3>
                <p className="text-xs text-slate-600 font-normal leading-relaxed line-clamp-3 sm:line-clamp-none">
                  {domain.description}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1 sm:pt-2">
                  {domain.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-600 group-hover:underline">
                  View openings &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 8. DUAL PLATFORM PORTALS SECTION (UNAUTHENTICATED MARKETING ONLY) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Portals"
          title="Tailored for Candidates, Labs &amp; Industry"
          description="Dedicated workflows for students, research scholars, and lab recruiters."
          align="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* CANDIDATE PORTAL */}
          <Card className="p-5 sm:p-6 lg:p-8 flex flex-col justify-between space-y-4 sm:space-y-6 shadow-xs">
            <div className="space-y-3 sm:space-y-4">
              <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Job Seekers &amp; Scholars</h3>
              <p className="text-slate-600 text-xs font-normal leading-relaxed">
                Build your verified VLSI portfolio, bookmark circular deadlines, and apply directly.
              </p>

              <ul className="space-y-2 text-xs font-normal text-slate-600 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Verified profile and skills showcase.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Direct links to DRDO, ISRO &amp; IIT application forms.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Application tracker and deadline reminders.</span>
                </li>
              </ul>
            </div>

            <Button href="/signup?role=candidate" className="w-full" size="sm">
              Candidate Registration
            </Button>
          </Card>

          {/* EMPLOYER PORTAL */}
          <Card className="p-5 sm:p-6 lg:p-8 flex flex-col justify-between space-y-4 sm:space-y-6 shadow-xs">
            <div className="space-y-3 sm:space-y-4">
              <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Research Labs &amp; Recruiters</h3>
              <p className="text-slate-600 text-xs font-normal leading-relaxed">
                Post research fellowships, advertise technical positions, and connect with verified candidates.
              </p>

              <ul className="space-y-2 text-xs font-normal text-slate-600 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Targeted reach to electronics and semiconductor talent.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Institutional dashboard for multiple postings.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Direct candidate outreach and screening.</span>
                </li>
              </ul>
            </div>

            <Button href="/employer/login" variant="secondary" className="w-full" size="sm">
              Employer / Lab Portal
            </Button>
          </Card>
        </div>
      </section>

      {/* 9. LATEST INDUSTRY & RESEARCH NEWS */}
      {latestNews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Intelligence"
            title="Semiconductor Industry &amp; Research News"
            description="Curated updates from India Semiconductor Mission, global fabless leaders, and research journals."
            action={
              <Button href="/news" variant="secondary" size="sm">
                All news &rarr;
              </Button>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {latestNews.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* 10. SOCIAL PROOF & REVIEWS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ReviewsSection />
      </section>

      {/* 11. FAQ SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FaqSection />
      </section>

      {/* 12. EMAIL NEWSLETTER & ALERTS CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SubscribeSection />
      </section>

    </div>
  );
}
