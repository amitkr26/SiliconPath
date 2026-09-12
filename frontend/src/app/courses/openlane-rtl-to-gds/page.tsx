import React from "react";
import Link from "next/link";
import {
  Zap,
  Terminal,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  Layers,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "OpenLane RTL-to-GDSII Guide — Complete Open-Source Tapeout Walkthrough",
  description:
    "End-to-end guide for running an open-source RTL-to-GDSII physical design flow using OpenLane, OpenROAD, and SkyWater Sky130 PDK.",
};

const FLOW_STEPS = [
  {
    step: "01",
    title: "Synthesis & Logic Optimization",
    tool: "Yosys + ABC",
    desc: "Translates high-level Verilog RTL into a gate-level netlist mapped to standard cells from the SkyWater Sky130 PDK. Analyzes gate count, area, and estimated timing.",
    tcl: "run_synthesis",
    metrics: ["Gate count", "Area (um²)", "Timing WNS / TNS estimate", "Flip-flop count"],
  },
  {
    step: "02",
    title: "Floorplanning & IO Pin Placement",
    tool: "OpenROAD (init_floorplan)",
    desc: "Defines die and core boundaries, aspect ratio, utilization factor, core margins, and assigns IO pins along the chip perimeter based on user constraints.",
    tcl: "run_floorplan",
    metrics: ["Core utilization (e.g. 45-55%)", "Die area", "IO pin pitch", "Halo clearance"],
  },
  {
    step: "03",
    title: "Power Distribution Network (PDN)",
    tool: "OpenROAD (pdn)",
    desc: "Builds power and ground grids (VDD/VSS rails and straps) across upper metal layers (met4, met5) to supply uniform current and minimize IR drop across the macro.",
    tcl: "run_power_grid",
    metrics: ["Strap pitch & width", "Rail connections", "Worst-case IR drop target < 5%"],
  },
  {
    step: "04",
    title: "Standard Cell Placement",
    tool: "OpenROAD (RePlace + OpenDP)",
    desc: "Performs global placement using force-directed algorithms to minimize wirelength, followed by legalization into standard cell rows without overlaps.",
    tcl: "run_placement",
    metrics: ["Half-perimeter wire length (HPWL)", "Overflow % < 0.1", "Congestion heatmaps"],
  },
  {
    step: "05",
    title: "Clock Tree Synthesis (CTS)",
    tool: "OpenROAD (TritonCTS)",
    desc: "Synthesizes balanced clock distribution networks using H-tree or multi-corner buffers to minimize clock skew and insertion delay across all sequential flip-flops.",
    tcl: "run_cts",
    metrics: ["Clock skew < 150 ps", "Max clock insertion delay", "Max transition violations"],
  },
  {
    step: "06",
    title: "Global & Detailed Routing",
    tool: "OpenROAD (FastRoute + TritonRoute)",
    desc: "Connects standard cell pins and clock trees across routing metal layers (met1 through met5), resolving design rule constraints (DRC) and inserting antenna diodes.",
    tcl: "run_routing",
    metrics: ["DRC violation count = 0", "Antenna violations = 0", "Wirelength & via counts"],
  },
  {
    step: "07",
    title: "Physical Verification & Signoff",
    tool: "Magic (DRC) + Netgen (LVS) + OpenSTA",
    desc: "Runs signoff DRC checks against manufacturing rules, extracts the layout netlist, verifies schematic-versus-layout (LVS) equivalence, and generates the final GDSII stream.",
    tcl: "run_magic; run_lvs; run_magic_gds",
    metrics: ["DRC Clean (0 errors)", "LVS Match (Netlists identical)", "Final STA Slack (Setup & Hold >= 0)"],
  },
];

export default function OpenLaneGuidePage() {
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
          <span className="text-slate-900 font-medium truncate">OpenLane RTL-to-GDS Guide</span>
        </nav>

        {/* HEADER */}
        <header className="border-b border-slate-200 pb-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge tone="accent">Practical Tapeout Guide</Badge>
            <Badge tone="neutral">SkyWater Sky130 PDK</Badge>
            <Badge tone="neutral">100% Open-Source EDA</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            OpenLane RTL-to-GDSII Complete Flow Walkthrough
          </h1>
          <p className="text-base text-slate-600 max-w-3xl leading-relaxed">
            A comprehensive, practical guide to implementing a real digital design from Verilog RTL to clean GDSII layout using OpenLane and the 130nm open-source PDK.
          </p>

          <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500 font-mono">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" /> 45 min deep dive
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-400" /> 7 Flow Stages
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Industry Signoff Compliant
            </span>
          </div>
        </header>

        {/* FLOW OVERVIEW CARD */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" /> What is OpenLane?
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            <strong>OpenLane</strong> is an automated RTL to GDSII flow based on several open-source EDA components including <strong>Yosys</strong>, <strong>OpenROAD</strong>, <strong>Magic VLSI</strong>, <strong>Netgen</strong>, and <strong>OpenSTA</strong>. It performs full ASIC physical implementation without proprietary tool licenses, producing verified tapeout-ready GDSII layouts for manufacturing runs such as eFabless chipIgnite and Tiny Tapeout.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Frontend</div>
              <div className="font-semibold text-slate-900 text-sm">Yosys + ABC</div>
              <p className="text-xs text-slate-500 mt-1">Logic synthesis, technology mapping, arithmetic inference</p>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Physical Backend</div>
              <div className="font-semibold text-slate-900 text-sm">OpenROAD</div>
              <p className="text-xs text-slate-500 mt-1">Floorplan, PDN, global placement, CTS, detailed routing</p>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Signoff Verification</div>
              <div className="font-semibold text-slate-900 text-sm">Magic + Netgen + OpenSTA</div>
              <p className="text-xs text-slate-500 mt-1">Design rule checks (DRC), layout vs. schematic (LVS), STA</p>
            </div>
          </div>
        </div>

        {/* STEP-BY-STEP BREAKDOWN */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-2xl font-bold text-slate-900">Step-by-Step Flow Execution</h2>
            <p className="text-sm text-slate-500 mt-1">Run either the interactive step-by-step flow or the one-line automated push-button flow.</p>
          </div>

          <div className="space-y-4">
            {FLOW_STEPS.map((stage) => (
              <div
                key={stage.step}
                className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-sm">
                      {stage.step}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{stage.title}</h3>
                      <span className="text-xs text-slate-500 font-mono">Engine: {stage.tool}</span>
                    </div>
                  </div>
                  <code className="px-2.5 py-1 rounded bg-slate-900 text-emerald-400 font-mono text-xs w-fit">
                    % {stage.tcl}
                  </code>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mb-4">{stage.desc}</p>

                <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-3">
                  <span className="text-xs font-semibold text-slate-700 block mb-2">Key Quality of Results (QoR) Metrics:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {stage.metrics.map((metric, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{metric}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CONFIG.JSON REFERENCE */}
        <section className="bg-slate-900 rounded-xl p-6 sm:p-8 text-white space-y-4 font-mono text-xs overflow-hidden border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="flex items-center gap-2 text-slate-300 font-semibold">
              <Terminal className="w-4 h-4 text-emerald-400" /> config.json — Sky130 Standard Macro Configuration
            </span>
            <span className="text-slate-500">JSON Configuration</span>
          </div>
          <pre className="text-slate-300 overflow-x-auto leading-relaxed p-2">
{`{
  "DESIGN_NAME": "picorv32a",
  "VERILOG_FILES": "dir::src/picorv32a.v",
  "CLOCK_PORT": "clk",
  "CLOCK_PERIOD": 10.0,
  "DESIGN_IS_CORE": 0,
  "FP_SIZING": "relative",
  "FP_CORE_UTIL": 45,
  "PL_TARGET_DENSITY": 0.48,
  "PL_BASIC_PLACEMENT": 0,
  "CTS_TARGET_SKEW": 0.15,
  "GLB_RT_MAXLAYER": 5,
  "ROUTING_CORES": 4,
  "RUN_MAGIC": 1,
  "RUN_KLAYOUT": 1,
  "RUN_LVS": 1,
  "RUN_CVC": 1
}`}
          </pre>
          <p className="text-[11px] text-slate-400 font-sans pt-2 border-t border-slate-800">
            Note: <code>CLOCK_PERIOD</code> is specified in nanoseconds (10.0 ns = 100 MHz target). <code>FP_CORE_UTIL</code> is set to 45% to leave sufficient routing tracks for detailed routing without congestion hot-spots.
          </p>
        </section>

        {/* COMMON TAPE-OUT ISSUES & FIXES */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Common Tapeout Bottlenecks & Fixes
          </h2>

          <div className="space-y-4">
            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 text-sm mb-1">1. Routing Congestion / DRC Exploding</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Symptom:</strong> Detailed router reports hundreds of short / spacing violations on <code>met2</code> and <code>met3</code>.<br />
                <strong>Fix:</strong> Lower <code>FP_CORE_UTIL</code> from 50% to 40-42%, or reduce <code>PL_TARGET_DENSITY</code> to 0.45. Ensure standard cell halo clearance around macros is set to at least 10 um.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 text-sm mb-1">2. Hold Time Violations Post-Routing</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Symptom:</strong> Negative slack on min/fast corner after detailed routing due to clock tree insertion delay variations.<br />
                <strong>Fix:</strong> Enable hold buffer insertion via <code>PL_RESIZER_HOLD_SLACK_MARGIN: 0.1</code> and verify multi-corner CTS with <code>CTS_CLK_BUFFER_LIST</code> using matched inverter pairs.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 text-sm mb-1">3. LVS Pin / Port Discrepancies</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Symptom:</strong> Netgen reports unmatched nets or missing supply connections (VDD/VSS).<br />
                <strong>Fix:</strong> Verify that <code>VDD_NETS</code> and <code>GND_NETS</code> explicitly list <code>vccd1</code> and <code>vssd1</code> for Sky130 standard cells. Ensure tie-high and tie-low cells are inserted properly.
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM NAVIGATION */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white border border-slate-200 rounded-xl">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Ready to build your next tapeout design?</h3>
            <p className="text-xs text-slate-500 mt-0.5">Explore the ASIC Physical Design and STA learning paths for deep-dive theory.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button href="/learn/physical-design" variant="primary" size="md">
              Explore Physical Design Path <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button href="/courses" variant="secondary" size="md">
              All Guides
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
