import React from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Briefcase,
  Layers,
  Terminal,
  Award,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "VLSI Technical Resume Guide — How to Get Shortlisted for Semiconductor Roles",
  description:
    "Engineering resume guidelines for Physical Design, Design Verification, and RTL engineers: project framing, ATS keywords, tool matrices, and quantified QoR bullets.",
};

const DO_DONT_EXAMPLES = [
  {
    bad: "Worked on physical design of RISC-V core using EDA tools and fixed timing violations.",
    good: "Executed full RTL-to-GDSII physical implementation of 32-bit RV32I core on Sky130nm node (50 MHz, 45k gates); closed setup slack to +0.22 ns and hold to +0.08 ns across 4 PVT corners using OpenROAD/PrimeTime.",
    why: "Specifies core architecture, process node, gate count, clock frequency, timing slack metrics, and exact toolchain.",
  },
  {
    bad: "Learned Verilog, SystemVerilog, UVM and created testbenches.",
    good: "Architected a constrained-random SystemVerilog/UVM testbench for an AXI4-to-APB bridge; achieved 98.4% functional coverage and 100% toggle/branch code coverage using Synopsys VCS and Verdi.",
    why: "Quantifies coverage results, identifies the exact bus protocol, and lists industry-standard simulation and debug tools.",
  },
  {
    bad: "Good knowledge of STA concepts like setup time, hold time, and clock skew.",
    good: "Automated signoff timing analysis with TCL scripts in PrimeTime; generated SDC constraints for multi-clock domains, identified false paths/multicycle paths, and eliminated 142 setup violations via buffer sizing and Vt-swapping.",
    why: "Demonstrates practical workflow execution (SDC creation, timing exception handling, TCL automation) rather than textbook definitions.",
  },
];

const SKILL_CATEGORIES = [
  {
    title: "EDA Tools & Toolchains",
    items: ["Synopsys Innovus / ICC2", "Synopsys PrimeTime (STA)", "Siemens Calibre (DRC/LVS)", "Synopsys VCS / Cadence Xcelium", "Mentor Tessent (DFT)", "OpenROAD / OpenLane", "Yosys / Magic VLSI"],
  },
  {
    title: "Languages & Scripting",
    items: ["Verilog HDL / SystemVerilog", "TCL (Tool Command Language)", "Python (Data processing)", "Perl / Bash Shell", "Makefile automation", "C/C++ (DPI-C / Virtual Platforms)"],
  },
  {
    title: "Protocols & Standards",
    items: ["AMBA AXI4 / AXI-Stream / APB", "PCIe Gen 3/4 (Basics)", "I2C / SPI / UART", "JTAG / IEEE 1149.1", "UPF / IEEE 1801 (Low Power)", "Liberty (.lib) / LEF / DEF / SDC"],
  },
  {
    title: "Methodologies & Signoff",
    items: ["RTL Synthesis & QoR Analysis", "Static Timing Analysis (STA)", "Clock Tree Synthesis (CTS)", "Design For Testability (DFT)", "Physical Verification (DRC/LVS/ERC)", "IR Drop & Electromigration (EM)"],
  },
];

export default function ResumeTipsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* BREADCRUMB */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/courses" className="hover:text-slate-900 transition-colors">
            Free Resources
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-medium truncate">VLSI Technical Resume Guide</span>
        </nav>

        {/* HEADER */}
        <header className="border-b border-slate-200 pb-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge tone="accent">Career & Interview Prep</Badge>
            <Badge tone="neutral">Engineering Guidelines</Badge>
            <Badge tone="success">ATS Optimized</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            How to Build an Industry-Ready Semiconductor Resume
          </h1>
          <p className="text-base text-slate-600 max-w-3xl leading-relaxed">
            Semiconductor hiring managers and technical leads filter resumes in seconds based on concrete tools, tapeout metrics, and protocol depth. Here is the exact structure to stand out.
          </p>
        </header>

        {/* CORE RULES */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" /> 4 Golden Rules for VLSI Resumes
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Rule 1</span>
              <h4 className="font-semibold text-slate-900 text-sm">Always Specify Node & Metrics</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Never just write "Physical Design project". Always include the technology node (e.g. 130nm, 45nm, 7nm), target frequency (e.g. 200 MHz), gate count, and timing slack results.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Rule 2</span>
              <h4 className="font-semibold text-slate-900 text-sm">Name Specific EDA Tools</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hiring ATS filters and technical screeners scan for precise tools: PrimeTime, Innovus, ICC2, OpenROAD, Calibre, VCS, ModelSim. "CAD Tools" gets rejected.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Rule 3</span>
              <h4 className="font-semibold text-slate-900 text-sm">Quantify Optimization Impact</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Use numbers: "Reduced leakage by 18% using high-Vt swap", "improved clock skew from 280ps to 95ps", "achieved 100% DRC/LVS clean tapeout".
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Rule 4</span>
              <h4 className="font-semibold text-slate-900 text-sm">Scripting is Mandatory</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                A hardware engineer who cannot script cannot automate regression runs. Highlight TCL command scripting, Python log parsing, and Makefile pipelines.
              </p>
            </div>
          </div>
        </section>

        {/* BEFORE & AFTER BULLET POINTS */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-2xl font-bold text-slate-900">Before & After: Bullet Point Rewrites</h2>
            <p className="text-sm text-slate-500 mt-1">See how vague academic bullets transform into high-impact engineering accomplishments.</p>
          </div>

          <div className="space-y-4">
            {DO_DONT_EXAMPLES.map((example, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50/70 border border-red-200 text-xs">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-red-900">Weak Bullet (Vague & Generic):</span>
                      <p className="text-red-800 mt-0.5">{example.bad}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-900">Strong Technical Bullet (Quantified & Detailed):</span>
                      <p className="text-emerald-800 mt-0.5 font-medium">{example.good}</p>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 border-t border-slate-100 pt-3 flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700">Why this works:</span>
                  <span>{example.why}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ATS SKILLS MATRIX */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" /> Recommended Skills Matrix Format
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Structure your resume's technical skills section into clean, categorized rows rather than one giant comma-separated list.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {SKILL_CATEGORIES.map((cat, idx) => (
              <div key={idx} className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" /> {cat.title}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {cat.items.map((item, i) => (
                    <span key={i} className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs text-slate-700 font-mono">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PORTFOLIO PROJECT IDEAS */}
        <section className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 space-y-4 border border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-400" /> 3 High-Credibility Portfolio Projects to Build
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            If you do not have commercial tapeout experience, recruiters and hiring managers look for verifiable open-source projects on GitHub with readable Verilog/SystemVerilog, SDC scripts, and reproducible testbenches:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4">
              <div className="text-xs font-bold text-emerald-400 mb-1">Project 1</div>
              <h5 className="font-semibold text-sm text-white">Sky130 OpenLane Tapeout</h5>
              <p className="text-xs text-slate-400 mt-1">
                Implement a complete UART or SPI peripheral from RTL to clean GDSII with zero DRC/LVS violations using OpenLane.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4">
              <div className="text-xs font-bold text-emerald-400 mb-1">Project 2</div>
              <h5 className="font-semibold text-sm text-white">UVM AXI4 VIP Testbench</h5>
              <p className="text-xs text-slate-400 mt-1">
                Write a complete SystemVerilog UVM testbench with scoreboard, functional coverage, and random sequence generation.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4">
              <div className="text-xs font-bold text-emerald-400 mb-1">Project 3</div>
              <h5 className="font-semibold text-sm text-white">TCL STA Automation Engine</h5>
              <p className="text-xs text-slate-400 mt-1">
                Create a TCL script that automates multi-corner timing reports, parses worst-case slack paths, and generates histogram summaries.
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM NAVIGATION */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white border border-slate-200 rounded-xl">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Pair your resume with real interview practice</h3>
            <p className="text-xs text-slate-500 mt-0.5">Test yourself against our curated 55 Static Timing Analysis interview questions.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button href="/sta-interview-questions" variant="primary" size="md">
              Practice 55 STA Q&A <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button href="/learn/career-roadmap" variant="secondary" size="md">
              Career Roadmap
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
