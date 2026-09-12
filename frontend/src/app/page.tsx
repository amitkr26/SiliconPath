"use client";

import Link from "next/link";
import { ArrowRight, GitBranch, Layers, Timer } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const stats = [
  { value: "15", label: "paths" },
  { value: "40+", label: "topics" },
  { value: "128", label: "STA Q&A" },
];

const paths = {
  Foundation: [
    { name: "Digital Electronics", href: "/learn/digital-electronics", count: 11 },
    { name: "Verilog", href: "/learn/verilog", count: 14 },
  ],
  "Front-end": [
    { name: "Design Verification", href: "/learn/design-verification", count: 13 },
    { name: "Clock Domain Crossing", href: "/learn/clock-domain-crossing", count: 8 },
    { name: "Hardware Protocols", href: "/learn/hardware-protocols", count: 8 },
  ],
  "Back-end": [
    { name: "Synthesis", href: "/learn/synthesis", count: 11 },
    { name: "Physical Design", href: "/learn/physical-design", count: 11 },
    { name: "Static Timing Analysis", href: "/learn/static-timing-analysis", count: 13 },
    { name: "Physical Verification", href: "/learn/physical-verification", count: 12 },
  ],
  Specialized: [
    { name: "Low Power Design & UPF", href: "/learn/low-power", count: 13 },
    { name: "Design for Test", href: "/learn/design-for-test", count: 8 },
  ],
  "EDA & workflow": [
    { name: "TCL for EDA", href: "/learn/tcl-for-eda", count: 7 },
    { name: "Linux for VLSI", href: "/learn/linux-for-vlsi", count: 7 },
  ],
};

const flowStages = [
  { num: "01", name: "RTL", from: "spec → RTL", desc: "Describe the hardware in Verilog / SystemVerilog — the behaviour, cycle by cycle.", tools: ["Verilog", "SystemVerilog"], href: "/learn/verilog" },
  { num: "02", name: "Synthesis", from: "RTL → netlist", desc: "Map the RTL onto real standard cells, optimized for timing, area and power.", tools: ["Design Compiler", "Genus"], href: "/learn/synthesis" },
  { num: "03", name: "Floorplan", from: "netlist → floorplan", desc: "Set die size and core area, place the macros, build the power grid.", tools: ["ICC2", "Innovus"], href: "/learn/physical-design" },
  { num: "04", name: "Placement", from: "floorplan → placed", desc: "Place every standard cell — balancing timing against routing congestion.", tools: ["ICC2", "Innovus"], href: "/learn/physical-design" },
  { num: "05", name: "Clock Tree", from: "placed → CTS", desc: "Build a balanced clock tree so the clock reaches every flop with minimal skew.", tools: ["ICC2", "Innovus"], href: "/learn/physical-design" },
  { num: "06", name: "Routing", from: "CTS → routed", desc: "Connect every net across the metal stack — DRC-correct, on-grid.", tools: ["ICC2", "OpenROAD"], href: "/learn/physical-design" },
  { num: "07", name: "Timing Signoff", from: "routed → timing clean", desc: "Close setup and hold across every corner and mode. Sign the timing off.", tools: ["PrimeTime", "Tempus"], href: "/learn/static-timing-analysis" },
  { num: "08", name: "Physical Verification", from: "routed → signoff", desc: "DRC, LVS and antenna checks — prove the layout is actually manufacturable.", tools: ["Calibre", "IC Validator"], href: "/learn/physical-verification" },
  { num: "09", name: "GDSII", from: "signoff → GDSII", desc: "Tape-out. The final layout the foundry turns into silicon.", tools: ["Tape-out"], href: "/learn/physical-design" },
];

const labCases = [
  { type: "Setup", wns: "−143 ps", tns: "−2.84 ns", critical: "reg_124/Q → reg_892/D", icon: Timer },
  { type: "Hold", wns: "−38 ps", tns: "−0.95 ns", critical: "reg_510/Q → reg_511/D", icon: Timer },
  { type: "Congestion", wns: "92%", tns: "overflow", critical: "GlobalRoute layer 2", icon: Layers },
  { type: "CTS / Skew", wns: "210 ps", tns: "skew", critical: "clk → reg_301", icon: GitBranch },
];

const toolsGrid = [
  { category: "Synthesis", names: "Design Compiler · Genus" },
  { category: "Physical Design", names: "ICC2 · Innovus · Fusion Compiler" },
  { category: "STA", names: "PrimeTime · Tempus" },
  { category: "Physical Verification", names: "Calibre · IC Validator" },
  { category: "Open source", names: "OpenROAD · OpenLane" },
];



/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* ============================================================ */}
      {/* HERO                                                         */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            100% free VLSI learning for{" "}
            <span className="text-blue-400">semiconductor engineers</span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Practical VLSI learning from RTL to GDSII — 15 paths, 148 modules, 128 interview questions. No login required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
            >
              Start Learning Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/sta-interview-questions"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
            >
              128 STA interview questions <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-400 font-medium">
            <span>Learn</span><span className="text-blue-400">→</span>
            <span>Build</span><span className="text-blue-400">→</span>
            <span>Debug</span><span className="text-blue-400">→</span>
            <span>Prove</span><span className="text-blue-400">→</span>
            <span>Get hired</span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* THE WHOLE CHIP-DESIGN STACK                                  */}
      {/* ============================================================ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-2">The stack</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">The whole chip-design stack</h2>
              <p className="mt-2 text-slate-500">15 paths. One connected flow.</p>
            </div>
            <div className="flex gap-6 text-center">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                  <div className="text-xs text-slate-500 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {Object.entries(paths).map(([category, items]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{category}</h3>
                <div className="space-y-2">
                  {items.map((path) => (
                    <Link
                      key={path.href}
                      href={path.href}
                      className="group flex items-center justify-between bg-slate-50 hover:bg-blue-50 rounded-lg px-4 py-3 transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">
                        {path.name}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 bg-white px-2 py-0.5 rounded-full">
                        {path.count}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/learn" className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
              Browse all paths <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FROM RTL TO GDSII                                             */}
      {/* ============================================================ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-2">The flow</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-4">From RTL to GDSII</h2>
          <p className="text-slate-500 mb-12 max-w-xl">Follow a design through the complete RTL-to-GDSII flow, from RTL through signoff.</p>

          <div className="space-y-4">
            {flowStages.map((stage, i) => (
              <div
                key={stage.num}
                className="group bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-5 sm:p-6 transition-all hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 w-8 h-8 rounded-lg flex items-center justify-center">
                      {stage.num}
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-bold text-slate-900">{stage.name}</h3>
                      <p className="text-xs text-slate-400 font-medium">{stage.from}</p>
                    </div>
                  </div>
                  <div className="flex-1 sm:ml-4">
                    <p className="text-sm text-slate-600 leading-relaxed mb-3">{stage.desc}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {stage.tools.map((t) => (
                        <span key={t} className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
                          {t}
                        </span>
                      ))}
                      <Link href={stage.href} className="text-xs font-semibold text-blue-600 hover:text-blue-700 ml-2 inline-flex items-center gap-1">
                        Learn {stage.name} <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* ENGINEERING LAB                                              */}
      {/* ============================================================ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-2">Engineering Lab</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            Real design. Real violations.<br />Real engineering.
          </h2>
          <p className="text-slate-500 mb-10">Debug real design problems from real reports.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {labCases.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.type} className="bg-slate-950 text-white rounded-xl p-5 font-mono text-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-blue-400">{c.type} violation</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">WNS</span>
                      <div className="font-bold text-red-400">{c.wns}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">TNS</span>
                      <div className="font-bold text-red-400">{c.tns}</div>
                    </div>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500">Critical path</span>
                    <div className="text-slate-300">{c.critical}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Link href="/engineering-lab" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm">
              Analyze path <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* KNOWLEDGE MEETS TOOLS                                        */}
      {/* ============================================================ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-2">Knowledge → tools</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Where knowledge meets the tools</h2>
          <p className="text-slate-500 mb-10">Concept → Command → Report → Debug.</p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            {["Concept", "CPPR", "Command", "report_timing", "Report", "slack · latency · delay", "Debug", "shared clock over-pessimism"].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-700">{step}</span>
                {i < 7 && i % 2 === 1 && <ArrowRight className="w-4 h-4 text-blue-400" />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {toolsGrid.map((t) => (
              <div key={t.category} className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="font-display font-bold text-slate-900 mb-1">{t.category}</h3>
                <p className="text-sm text-slate-500 font-mono">{t.names}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/learn" className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
              Browse all paths <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PROVE YOUR ENGINEERING SKILLS                                 */}
      {/* ============================================================ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-2">Prove</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Prove your engineering skills</h2>
          <p className="text-slate-500 mb-8">Real scenarios. Real reasoning.</p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-8 max-w-2xl">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">interview · physical design</p>
            <blockquote className="text-lg font-medium text-slate-800 leading-relaxed italic">
              &ldquo;Your design passes timing before CTS. After CTS, WNS −87 ps. How do you debug it?&rdquo;
            </blockquote>
            <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
              <span>Analyze</span><span className="text-blue-400">→</span>
              <span>Answer</span><span className="text-blue-400">→</span>
              <span>Get feedback</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link href="/sta-interview-questions" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm">
              128 STA interview questions <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/learn/interview" className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm">
              Q&A across the flow
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* WHY SILICONPATH                                              */}
      {/* ============================================================ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-2">Why SiliconPath</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Built for engineers, by an engineer</h2>
          <p className="text-slate-500 mb-12 max-w-xl">Every path, every lab case, every interview question is drawn from real industry experience in physical design and timing signoff.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: "Structured", desc: "15 paths organized into a coherent progression — Foundations → Backend → Tools & Career. Follow the sequence or jump to what you need." },
              { label: "Practical", desc: "Engineering Lab cases come from real EDA reports. Interview questions are drawn from real VLSI interviews. No textbook filler." },
              { label: "Free — always", desc: "No paywall. No premium tier. No login required. Every module, every question, every lab case is open to everyone." },
              { label: "RTL to GDSII", desc: "The full chip-design flow in one place — from writing your first Verilog module to signing off timing at the last metal layer." },
              { label: "Tool-aware", desc: "Content explicitly covers industry EDA tools — PrimeTime, ICC2, Innovus, Design Compiler, Calibre — alongside open-source alternatives." },
              { label: "Career-focused", desc: "128 STA interview questions. A structured 8-week study plan. Resume guidance specific to VLSI roles. Built to get you hired." },
            ].map((item) => (
              <div key={item.label} className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-display font-bold text-slate-900 mb-2">{item.label}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FREE RESOURCES                                               */}
      {/* ============================================================ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-2">100% free resources</h2>
          <p className="text-slate-500 mb-10">Everything you need. No paywall.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "OpenLane RTL-to-GDS", level: "Intermediate", detail: "Step-by-step guide", desc: "Full RTL to GDSII flow using OpenLane on a real design, step by step. Free.", href: "/courses/openlane-rtl-to-gds" },
              { name: "Interview Q&A", level: "All levels", detail: "90+ questions", desc: "90+ real interview questions with detailed answers across PD, Synthesis, STA, and PV. Free.", href: "/sta-interview-questions" },
              { name: "Career Roadmap", level: "Beginner", detail: "Structured plan", desc: "Complete beginner roadmap for VLSI freshers, with an 8-week structured study plan. Free.", href: "/learn/career-roadmap" },
              { name: "Resume Tips", level: "All levels", detail: "Templates", desc: "VLSI-specific resume templates and tips that get you shortlisted. Free.", href: "/courses/resume-tips" },
            ].map((c) => (
              <Link
                key={c.name}
                href={c.href}
                className="group bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-5 transition-all hover:shadow-md"
              >
                <h3 className="font-display font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{c.name}</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{c.desc}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <span>{c.level}</span>
                  <span>·</span>
                  <span>{c.detail}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* ============================================================ */}
      {/* CTA                                                          */}
      {/* ============================================================ */}
      <section className="py-20 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Start building real-chip skills today</h2>
          <p className="text-slate-400 mb-8">100% free, structured, built by engineers who ship silicon.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/learn" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm">
              Start Learning Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/sta-interview-questions" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm">
              STA Interview Q&amp;A
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
