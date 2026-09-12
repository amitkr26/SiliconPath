import React from "react";
import Link from "next/link";
import {
  Briefcase,
  BookOpen,
  FileText,
  Compass,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Award,
  Layers,
  Terminal,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "VLSI Career Resources & Engineering Guides — SiliconPath",
  description:
    "Curated career resources for semiconductor engineers: role breakdowns (PD, DV, RTL, DFT), resume templates, study roadmaps, and interview preparation.",
};

const CAREER_TRACKS = [
  {
    role: "Physical Design Engineer",
    scope: "Netlist to GDSII implementation: floorplanning, power planning, placement, CTS, routing, timing closure, and physical signoff (DRC/LVS/IR drop).",
    tools: ["Synopsys ICC2", "Cadence Innovus", "Synopsys PrimeTime", "Siemens Calibre"],
    keySkills: ["TCL scripting", "STA & SDC constraints", "LEF/DEF flows", "Congestion & hold fixing"],
    learnPath: "/learn/physical-design",
  },
  {
    role: "Design Verification (DV) Engineer",
    scope: "Pre-silicon functional verification: architecting constrained-random testbenches, writing assertions (SVA), building UVM scoreboards, and achieving 100% coverage.",
    tools: ["Synopsys VCS", "Cadence Xcelium", "Synopsys Verdi", "Siemens Questa"],
    keySkills: ["SystemVerilog / UVM", "Constrained-random testing", "Functional & code coverage", "DPI-C"],
    learnPath: "/learn/systemverilog",
  },
  {
    role: "RTL Design Engineer",
    scope: "Microarchitecture definition and digital logic design: writing synthesizeable Verilog/SystemVerilog, pipelining datapath logic, and bus protocol interfacing.",
    tools: ["Synopsys Design Compiler", "Cadence Genus", "SpyGlass (Lint/CDC)", "Verilator"],
    keySkills: ["AMBA AXI/AHB protocols", "Clock domain crossing (CDC)", "Low-power design (UPF)", "FSM architecture"],
    learnPath: "/learn/verilog",
  },
  {
    role: "DFT (Design For Test) Engineer",
    scope: "Test architecture design: scan insertion, ATPG (Automatic Test Pattern Generation), BIST (Memory/Logic BIST), and boundary scan (JTAG) for silicon bring-up.",
    tools: ["Siemens Tessent", "Synopsys TestMAX", "Synopsys DFT Compiler"],
    keySkills: ["Scan chain stitching", "Fault modeling (Stuck-at, At-speed)", "IEEE 1149.1 JTAG", "MBIST"],
    learnPath: "/learn/dft",
  },
];

const CURATED_GUIDES = [
  {
    title: "VLSI Technical Resume & Portfolio Guide",
    category: "Career & Hiring",
    desc: "Actionable formulas for framing semiconductor projects, formatting ATS-compliant skills matrices, and avoiding common hiring screener pitfalls.",
    href: "/courses/resume-tips",
    badge: "Essential",
  },
  {
    title: "8-Week VLSI Fresher Study Plan",
    category: "Study Roadmap",
    desc: "A structured, week-by-week blueprint covering digital electronics, Verilog synthesis, STA formulas, and open-source EDA tooling setup.",
    href: "/learn/career-roadmap",
    badge: "Roadmap",
  },
  {
    title: "128 Static Timing Analysis (STA) Interview Questions",
    category: "Interview Prep",
    desc: "Detailed answers with setup/hold math, clock jitter, crosstalk delay, and SDC constraints asked by Intel, Qualcomm, Nvidia, and TI.",
    href: "/sta-interview-questions",
    badge: "Practice",
  },
  {
    title: "OpenLane RTL-to-GDSII Practical Walkthrough",
    category: "Hands-on Project",
    desc: "Build a demonstrable tapeout-ready macro using open-source tools (Yosys, OpenROAD, Magic) on the SkyWater 130nm PDK for your GitHub portfolio.",
    href: "/courses/openlane-rtl-to-gds",
    badge: "Hands-on",
  },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* BREADCRUMB */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-medium">Career Resources</span>
        </nav>

        {/* HEADER */}
        <header className="border-b border-slate-200 pb-8 space-y-3">
          <div className="flex items-center gap-2">
            <Badge tone="accent">Career Guidance</Badge>
            <Badge tone="neutral">Industry Aligned</Badge>
            <Badge tone="success">100% Free</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            VLSI Career Tracks & Engineering Resources
          </h1>
          <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
            Unpack specific semiconductor engineering roles, required EDA toolchains, interview expectations, and study roadmaps to break into the semiconductor industry.
          </p>
        </header>

        {/* ROLE PROFILES */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-2xl font-bold text-slate-900">Semiconductor Engineering Roles Explained</h2>
            <p className="text-sm text-slate-500 mt-1">
              Understand what each engineering discipline actually does on a day-to-day tapeout team.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CAREER_TRACKS.map((track) => (
              <div
                key={track.role}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between hover:border-slate-300 transition-all shadow-sm"
              >
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-bold text-slate-900">{track.role}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-2">{track.scope}</p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 block mb-1.5">Industry EDA Tools:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {track.tools.map((t, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-800 block mb-1.5">Core Technical Competencies:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {track.keySkills.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-800 font-medium text-[11px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Button href={track.learnPath} variant="secondary" size="sm" className="w-full justify-center">
                    Explore {track.role.replace(" Engineer", "")} Path <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURED GUIDES */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-2xl font-bold text-slate-900">Curated Career & Technical Guides</h2>
            <p className="text-sm text-slate-500 mt-1">
              In-depth articles and actionable frameworks built for semiconductor engineers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CURATED_GUIDES.map((guide) => (
              <Link
                key={guide.title}
                href={guide.href}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all group block"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono text-slate-500">{guide.category}</span>
                  <Badge tone="neutral">{guide.badge}</Badge>
                </div>
                <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                  {guide.title}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-1.5">
                  {guide.desc}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                  Read guide <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CREDIBILITY FOOTER BANNER */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" /> Platform Principles
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            All career guides, syllabus modules, and interview questions on SiliconPath are written from direct tapeout and timing closure experience. We do not accept sponsored recruitment placements, pay-for-placement resume services, or locked premium tiers. Everything is 100% free and open to anyone studying semiconductor engineering.
          </p>
        </div>

      </div>
    </div>
  );
}
