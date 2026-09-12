"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Terminal,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
  BookOpen,
  CheckCircle2,
  FileCode2,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Data Constants                                                     */
/* ------------------------------------------------------------------ */

const FLOW_STAGES = [
  {
    num: "01",
    name: "RTL Specification",
    phase: "Architecture → RTL",
    desc: "Describe hardware logic cycle-by-cycle in synthesizable Verilog or SystemVerilog.",
    tools: ["Verilog", "SystemVerilog"],
    href: "/learn/verilog",
  },
  {
    num: "02",
    name: "Logic Synthesis",
    phase: "RTL → Gate Netlist",
    desc: "Map hardware description to standard cell libraries, optimizing for area, power, and delay.",
    tools: ["Design Compiler", "Genus", "Yosys"],
    href: "/learn/synthesis",
  },
  {
    num: "03",
    name: "Floorplanning & Power",
    phase: "Netlist → Floorplan",
    desc: "Define die aspect ratio, core area, I/O pin placement, macro placement, and power grid meshes.",
    tools: ["Innovus", "ICC2", "OpenROAD"],
    href: "/learn/physical-design",
  },
  {
    num: "04",
    name: "Cell Placement",
    phase: "Floorplan → Placed",
    desc: "Place standard cells while balancing global timing critical paths against routing congestion.",
    tools: ["Innovus", "ICC2"],
    href: "/learn/physical-design",
  },
  {
    num: "05",
    name: "Clock Tree Synthesis (CTS)",
    phase: "Placed → CTS",
    desc: "Synthesize balanced clock distribution trees to deliver clean clock edges with minimum skew.",
    tools: ["TritonCTS", "ClockOpt"],
    href: "/learn/physical-design",
  },
  {
    num: "06",
    name: "Routing & Optimization",
    phase: "CTS → Routed",
    desc: "Connect signal nets across metal layers according to strict design rules and track guidelines.",
    tools: ["TritonRoute", "NanoRoute"],
    href: "/learn/physical-design",
  },
  {
    num: "07",
    name: "Static Timing Analysis (STA)",
    phase: "Routed → Timing Clean",
    desc: "Exhaustively verify setup and hold constraints across multi-corner multi-mode (MCMM) PVT.",
    tools: ["PrimeTime", "Tempus", "OpenSTA"],
    href: "/learn/static-timing-analysis",
  },
  {
    num: "08",
    name: "Physical Verification",
    phase: "Signoff Checks",
    desc: "Run DRC, LVS, and antenna checks to guarantee the silicon layout is 100% manufacturable.",
    tools: ["Calibre", "Pegasus", "Magic"],
    href: "/learn/physical-verification",
  },
  {
    num: "09",
    name: "Tapeout (GDSII / OASIS)",
    phase: "Signoff → Foundry",
    desc: "Deliver final mask geometry stream to the semiconductor foundry for lithographic fabrication.",
    tools: ["Foundry Signoff"],
    href: "/courses/openlane-rtl-to-gds",
  },
];

const LEARNING_PATHS_SUMMARY = [
  {
    tier: "Foundations",
    tierDescription: "Core digital logic, hardware description, and protocol fundamentals.",
    paths: [
      { name: "Digital Electronics", duration: "11 modules", href: "/learn/digital-electronics", level: "Beginner" },
      { name: "Verilog HDL", duration: "14 modules", href: "/learn/verilog", level: "Beginner" },
      { name: "Hardware Protocols", duration: "8 modules", href: "/learn/hardware-protocols", level: "Beginner" },
      { name: "Design Verification", duration: "13 modules", href: "/learn/design-verification", level: "Intermediate" },
      { name: "Clock Domain Crossing", duration: "8 modules", href: "/learn/clock-domain-crossing", level: "Intermediate" },
    ],
  },
  {
    tier: "Backend & Signoff",
    tierDescription: "RTL-to-GDSII physical implementation, timing closure, and manufacturability.",
    paths: [
      { name: "Logic Synthesis", duration: "11 modules", href: "/learn/synthesis", level: "Intermediate" },
      { name: "ASIC Physical Design", duration: "11 modules", href: "/learn/physical-design", level: "Intermediate" },
      { name: "Static Timing Analysis", duration: "13 modules", href: "/learn/static-timing-analysis", level: "Advanced" },
      { name: "Physical Verification", duration: "12 modules", href: "/learn/physical-verification", level: "Intermediate" },
      { name: "Low Power & UPF", duration: "13 modules", href: "/learn/low-power-design-upf", level: "Advanced" },
      { name: "Design for Test (DFT)", duration: "8 modules", href: "/learn/design-for-test", level: "Intermediate" },
    ],
  },
  {
    tier: "Tools & Career",
    tierDescription: "Industry EDA scripting, Linux automation, and interview preparation.",
    paths: [
      { name: "TCL Scripting for EDA", duration: "7 modules", href: "/learn/tcl-for-eda", level: "Beginner" },
      { name: "Linux for VLSI", duration: "7 modules", href: "/learn/linux-for-vlsi", level: "Beginner" },
      { name: "Interview Q&A Path", duration: "5 modules", href: "/learn/interview-qa", level: "All levels" },
      { name: "VLSI Career Roadmap", duration: "9 modules", href: "/learn/career-roadmap", level: "All levels" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  const [activeStage, setActiveStage] = useState(0);
  const [questionRevealed, setQuestionRevealed] = useState(false);

  const currentStage = FLOW_STAGES[activeStage];

  return (
    <div className="space-y-24 pb-20">
      {/* ============================================================ */}
      {/* 1. HERO: Concise, Technical, Restrained                      */}
      {/* ============================================================ */}
      <section className="pt-16 sm:pt-20 border-b border-slate-200/80 pb-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-medium">
              <Cpu className="w-3.5 h-3.5" />
              <span>100% Free &amp; Open Semiconductor Education</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.15]">
              The structured curriculum for semiconductor &amp; VLSI engineers.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              Master the full digital design flow from writing your first Verilog module to signing off timing at the foundry level. 15 learning paths, 7 academy tracks, 128 interview questions, and hands-on signoff labs. No paywalls, no login required.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/learn"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors shadow-sm"
              >
                Start Learning Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/sta-interview-questions"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium px-5 py-2.5 rounded-lg text-sm transition-colors shadow-sm"
              >
                128 STA Interview Questions
              </Link>
            </div>

            {/* Quick entry anchors */}
            <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Quick start:</span>
              <Link href="/learn/digital-electronics" className="hover:text-blue-600 transition-colors">
                Beginner: Digital Logic &amp; Verilog →
              </Link>
              <Link href="/learn/static-timing-analysis" className="hover:text-blue-600 transition-colors">
                Timing: Static Timing Analysis →
              </Link>
              <Link href="/engineering-lab" className="hover:text-blue-600 transition-colors">
                Hands-on: Engineering Lab →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. CHIP-DESIGN FLOW SCHEMATIC (RTL to GDSII)                 */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              Silicon Implementation
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              The RTL to GDSII Flow
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Every digital chip passes through nine discrete stages. Select any stage to inspect the technical objective and associated EDA tooling.
            </p>
          </div>
          <Link
            href="/courses/openlane-rtl-to-gds"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 shrink-0"
          >
            Read OpenLane RTL-to-GDS Guide <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Pipeline Navigation Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm mb-6 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-[720px]">
            {FLOW_STAGES.map((st, idx) => (
              <button
                key={st.num}
                onClick={() => setActiveStage(idx)}
                className={cn(
                  "flex-1 px-3 py-2 rounded-lg text-left transition-colors text-xs font-medium",
                  activeStage === idx
                    ? "bg-blue-50 text-blue-700 border border-blue-200/80 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <span className="block text-[10px] text-slate-400 font-mono mb-0.5">{st.num}</span>
                <span className="truncate block">{st.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Stage Inspection Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  Stage {currentStage.num}
                </span>
                <span className="text-xs text-slate-400 font-medium">·</span>
                <span className="text-xs text-slate-500 font-medium">{currentStage.phase}</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                {currentStage.name}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {currentStage.desc}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Standard EDA Tools:</span>
                {currentStage.tools.map((tool) => (
                  <span
                    key={tool}
                    className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200/60"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            <div className="shrink-0 flex sm:flex-col gap-3">
              <Link
                href={currentStage.href}
                className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors shadow-sm"
              >
                Study This Topic <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. STRUCTURED LEARNING PATHS (Matrix View)                    */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              Curriculum Map
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              15 Career-Focused Learning Paths
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Organized into three distinct milestones. Follow the sequential path or target specific domains.
            </p>
          </div>
          <Link
            href="/learn"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 shrink-0"
          >
            Browse all paths <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LEARNING_PATHS_SUMMARY.map((group) => (
            <div
              key={group.tier}
              className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="mb-4">
                  <h3 className="font-display font-bold text-lg text-slate-900">
                    {group.tier}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {group.tierDescription}
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {group.paths.map((p) => (
                    <Link
                      key={p.href}
                      href={p.href}
                      className="py-3 flex items-center justify-between group hover:text-blue-600 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-sm font-medium text-slate-800 group-hover:text-blue-600 truncate transition-colors">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {p.duration}
                        </p>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded shrink-0">
                        {p.level}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <Link
                  href="/learn"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  Explore {group.tier} Paths <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. ENGINEERING LAB SPOTLIGHT (Authentic Terminal)            */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-2xl p-6 sm:p-10 text-white shadow-md border border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left explanation */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-mono font-medium">
                <Terminal className="w-3.5 h-3.5" />
                <span>SIGN-OFF DIAGNOSTICS</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                Debug real design violations from actual EDA reports.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Textbooks teach ideal timing equations. Real engineering happens when a post-CTS setup slack fails by −143 ps across 18 logic levels or hold margins collapse across temperature corners.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <Link
                  href="/engineering-lab"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors"
                >
                  Enter Engineering Lab <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <span className="text-xs text-slate-400 font-mono">4 Case Studies Available</span>
              </div>
            </div>

            {/* Right: Authentic Terminal Window */}
            <div className="lg:col-span-7 bg-[#0B1120] rounded-xl border border-slate-800 p-4 font-mono text-xs shadow-inner">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-2 text-slate-400">PrimeTime :: report_timing -delay_type max</span>
                </div>
                <span className="text-red-400 font-bold">SLACK: −0.143 ns (VIOLATED)</span>
              </div>

              <div className="space-y-1.5 text-slate-300 overflow-x-auto leading-relaxed">
                <p className="text-slate-500"># Critical path analysis: reg_124/CLK → reg_892/D</p>
                <p><span className="text-slate-500">Startpoint:</span> reg_124 (rising edge-triggered flip-flop)</p>
                <p><span className="text-slate-500">Endpoint:  </span> reg_892 (rising edge-triggered flip-flop)</p>
                <p><span className="text-slate-500">Path Group:</span> core_clock_clk</p>
                <div className="py-2 text-slate-400 border-y border-slate-800/80 my-2">
                  <div className="grid grid-cols-4 gap-2 text-[11px] text-slate-500">
                    <span>POINT</span>
                    <span className="text-right">INCR</span>
                    <span className="text-right">PATH</span>
                    <span className="text-right">STAGE</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-slate-300">
                    <span>clock clk (rise)</span>
                    <span className="text-right font-mono">0.000</span>
                    <span className="text-right font-mono">0.000</span>
                    <span className="text-right text-slate-500">launch</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-slate-300">
                    <span>reg_124/CLK</span>
                    <span className="text-right font-mono">0.120</span>
                    <span className="text-right font-mono">0.120</span>
                    <span className="text-right text-slate-500">CTS latency</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-slate-300">
                    <span>u_alu/adder_18/S</span>
                    <span className="text-right font-mono text-amber-400">1.880</span>
                    <span className="text-right font-mono">2.000</span>
                    <span className="text-right text-slate-500">18 levels</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-slate-300">
                    <span>reg_892/D</span>
                    <span className="text-right font-mono">0.143</span>
                    <span className="text-right font-mono text-red-400">2.143</span>
                    <span className="text-right text-slate-500">arrival</span>
                  </div>
                </div>
                <p className="text-emerald-400">
                  Diagnosis: High logic depth on adder tree combined with unbalanced clock latency. Resolved by pipeline stage insertion and cell resizing (+12 ps slack met).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. INTERVIEW PRACTICE SPOTLIGHT                              */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              Interview Readiness
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Test Your Engineering Reasoning
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              128 real interview questions covering physical design, synthesis, clock domain crossing, and signoff timing.
            </p>
          </div>
          <Link
            href="/sta-interview-questions"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 shrink-0"
          >
            Open All 128 Questions <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Interactive Scenario Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Static Timing Analysis · CTS Skew
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                Frequently Asked at Qualcomm / TI
              </span>
            </div>

            <blockquote className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed">
              &ldquo;Your design passes timing cleanly before CTS. After CTS, setup slack is violated by −87 ps on a non-default clock group. How do you isolate and debug this?&rdquo;
            </blockquote>

            <button
              onClick={() => setQuestionRevealed(!questionRevealed)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors pt-2"
            >
              {questionRevealed ? "Hide Solution" : "Reveal Engineering Solution"}
              {questionRevealed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {questionRevealed && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 text-sm text-slate-600 leading-relaxed bg-slate-50/60 p-4 rounded-lg border">
                <p>
                  <strong>Step 1: Check Ideal vs. Propagated Clock Model.</strong> Pre-CTS STA models clock pins with zero skew and zero insertion latency. When propagated clocks are enabled post-CTS, real clock path delay differences appear.
                </p>
                <p>
                  <strong>Step 2: Inspect CPPR (Clock Path Pessimism Removal).</strong> Verify whether the launch and capture clock paths share common buffer segments and confirm CPPR credit is correctly calculated in the timing report.
                </p>
                <p>
                  <strong>Step 3: Review Clock Uncertainty.</strong> Pre-CTS SDC constraints often include an explicit margin for expected skew (e.g. 100 ps). If you do not reduce this budget post-CTS when real skew is measured, you double-count skew uncertainty.
                </p>
                <p>
                  <strong>Resolution:</strong> Re-constrain clock uncertainty to jitter-only post-CTS, review tree buffer drive strengths, and re-run path group optimization.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. CURATED GUIDES & RESOURCES                                */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              Practical Guides
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Curated Semiconductor Guides
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              In-depth technical references and study plans to bridge academic theory and silicon design.
            </p>
          </div>
          <Link
            href="/courses"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 shrink-0"
          >
            All Free Resources <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/courses/openlane-rtl-to-gds"
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileCode2 className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                OpenLane RTL-to-GDSII Guide
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Step-by-step complete tapeout walkthrough using OpenLane on the SkyWater 130nm PDK. From Verilog to GDSII.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>Read Guide</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          <Link
            href="/learn/career-roadmap"
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <GitBranch className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                VLSI Career Roadmap
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                8-week structured study roadmap for freshers and electronics graduates targeting physical design and RTL verification roles.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>View Roadmap</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          <Link
            href="/courses/resume-tips"
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                Semiconductor Resume Guide
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Project description formulas, essential EDA tool keywords, and formatting standards that pass ATS filters.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
              <span>View Templates</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. PHILOSOPHY: Why SiliconPath                                */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border border-slate-200 bg-white rounded-xl p-8 sm:p-10 shadow-sm">
          <div className="max-w-2xl mb-8">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              Platform Methodology
            </p>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Built for engineers, by an engineer.
            </h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              SiliconPath was created to provide the structured, hands-on VLSI learning resource that was missing in university and online courses.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                100% Free Forever
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                No paywalls, subscriptions, premium tiers, or required accounts. Every module, assessment, and question is open to all engineers.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Industry EDA Tool Alignment
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Instruction explicitly references standard tool commands (Synopsys PrimeTime, Cadence Innovus, Mentor Calibre) alongside open-source OpenROAD and OpenLane.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Real Signoff Scenarios
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Practice questions and lab cases are drawn directly from real tapeout reviews, timing reports, and physical verification signoff dilemmas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. QUIET FINAL CTA                                           */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12 px-6 bg-slate-100/60 border border-slate-200/80 rounded-2xl max-w-3xl mx-auto space-y-4">
          <h2 className="font-display text-2xl font-bold text-slate-900">
            Ready to master silicon design?
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Choose a path, review EDA reports, and practice technical interview questions at your own pace.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors shadow-sm"
            >
              Start Learning Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/sta-interview-questions"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium px-5 py-2.5 rounded-lg text-sm transition-colors shadow-sm"
            >
              STA Interview Q&amp;A
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
