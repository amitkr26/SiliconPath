"use client";

import Link from "next/link";
import {
  ArrowRight,
  GitBranch,
  Layers,
  Timer,
} from "lucide-react";

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

const testimonials = [
  { name: "Rahul Menon", role: "STA Engineer · Qualcomm India, Bangalore", text: "I cracked my Qualcomm STA round purely on the back of this site. The OCV vs AOCV explanation, the CPPR section, the timing equation diagrams — all exactly what was asked. No other free resource comes close to this depth." },
  { name: "Priya Krishnamurthy", role: "Physical Design Engineer · MediaTek, Hyderabad", text: "The resume template from the course got me shortlisted at MediaTek within 3 days of applying. Before this, I had been applying for 2 months with zero callbacks." },
  { name: "Aditya Sharma", role: "VLSI Design Engineer · Samsung R&D, Noida", text: "As a fresher from NIT, I had no real tool exposure. The 16-week study plan was my bible. I followed it from week 1 to week 16 and landed an offer at Samsung." },
  { name: "Sneha Rao", role: "DFT Engineer · Capgemini Engineering", text: "Free content alone is better than any VLSI YouTube playlist. The depth of explanation on DFT concepts is unmatched." },
  { name: "Karthik Iyer", role: "PD Engineer · Samsung R&D, Noida", text: "16-week plan actually works. Got my first offer in month 4. The structured approach made all the difference." },
  { name: "Divya Nair", role: "Low Power Engineer · Astra Silica", text: "UPF section explained better than my M.Tech textbook. The practical examples from real tape-outs are gold." },
  { name: "Arjun Pillai", role: "STA Engineer · Wipro VLSI, Bangalore", text: "Best VLSI resource in India. Real depth, zero click-bait. Every section is written by someone who's actually done the work." },
  { name: "Meghana Tiwari", role: "Verification Engineer · Texas Instruments", text: "Cracked TI written test after 2 weeks on SiliconPath. The interview questions are exactly what gets asked." },
];

const courses = [
  { name: "Interview Bootcamp", price: "₹299", originalPrice: "₹499", level: "All levels", detail: "90+ Q&A", desc: "90+ real interview questions with detailed answers across PD, Synthesis, STA, and PV.", href: "/courses/interview-bootcamp" },
  { name: "OpenLane RTL-to-GDS", price: "₹999", originalPrice: "₹1,999", level: "Intermediate", detail: "Step-by-step lessons", desc: "Full RTL to GDSII flow using OpenLane on a real design, step by step.", href: "/courses/openlane-rtl-to-gds" },
  { name: "Fresher Pack", price: "₹199", originalPrice: "₹299", level: "Beginner", detail: "Roadmap + 8-week plan", desc: "Complete beginner roadmap for VLSI freshers, with an 8-week structured study plan.", href: "/courses/fresher-pack" },
  { name: "Resume Tips", price: "Free", originalPrice: null, level: "All levels", detail: "Templates", desc: "VLSI-specific resume templates and tips that get you shortlisted.", href: "/courses/resume-tips" },
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
            The engineering platform for{" "}
            <span className="text-blue-400">semiconductor design</span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Practical VLSI learning from RTL to GDSII — real workflows, tools, and interview-ready practice.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
            >
              Start Learning Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/vlsi"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
            >
              Explore the knowledge hub <ArrowRight className="w-4 h-4" />
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
            <Link href="/vlsi" className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
              Knowledge hub <ArrowRight className="w-3.5 h-3.5" />
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
      {/* CAREER                                                       */}
      {/* ============================================================ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-2">Career</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-4">From learning to a silicon role</h2>
          <p className="text-slate-500 mb-10">Learn. Practice. Prove. Get hired.</p>

          <div className="flex flex-col sm:flex-row items-start gap-6 mb-10">
            {["Learn", "Practice", "Prove", "Get hired"].map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm font-semibold text-slate-700">{step}</span>
                {i < 3 && <ArrowRight className="w-4 h-4 text-slate-300 hidden sm:block" />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <Link href="/jobs" className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-5 transition-all hover:shadow-md">
              <h3 className="font-display font-bold text-slate-900 mb-1">A VLSI job board</h3>
              <p className="text-sm text-slate-500">Physical Design · STA · Verification · DFT</p>
            </Link>
            <Link href="/mentorship" className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-5 transition-all hover:shadow-md">
              <h3 className="font-display font-bold text-slate-900 mb-1">Mock interviews</h3>
              <p className="text-sm text-slate-500">With working engineers</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* TESTIMONIALS                                                 */}
      {/* ============================================================ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Engineers choose SiliconPath</h2>
          <p className="text-slate-500 mb-10">1k+ engineers · 4.9★ average</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col">
                <div className="flex items-center gap-1 text-amber-400 text-sm mb-3">
                  {"★★★★★"}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed flex-1 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* COURSES                                                      */}
      {/* ============================================================ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Structured programs, focused outcomes</h2>
          <p className="text-slate-500 mb-10">Go further.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {courses.map((c) => (
              <Link
                key={c.name}
                href={c.href}
                className="group bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-5 transition-all hover:shadow-md"
              >
                <h3 className="font-display font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{c.name}</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{c.desc}</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-lg font-bold text-slate-900">{c.price}</span>
                  {c.originalPrice && <span className="text-sm text-slate-400 line-through">{c.originalPrice}</span>}
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                  <span>{c.level}</span>
                  <span>·</span>
                  <span>{c.detail}</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/courses" className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
              All courses &amp; bundle <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CTA + NEWSLETTER                                             */}
      {/* ============================================================ */}
      <section className="py-20 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Start building real-chip skills today</h2>
          <p className="text-slate-400 mb-8">Free, structured, built by engineers who ship silicon.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/learn" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm">
              Start Learning Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/vlsi" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm">
              Explore VLSI topics
            </Link>
          </div>

          {/* Newsletter */}
          <div className="max-w-md mx-auto">
            <h3 className="font-display text-xl font-bold mb-3">Stay ahead of the flow</h3>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-400"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors shrink-0"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
