"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  AlertTriangle,
  Layers,
  GitBranch,
  Terminal,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Cpu,
  Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CaseSeverity = "critical" | "high" | "medium";

interface ViolationCase {
  id: string;
  title: string;
  category: string;
  icon: typeof Clock;
  severity: CaseSeverity;
  domain: string;
  metrics: { label: string; value: string; isBad?: boolean }[];
  reportTitle: string;
  report: string;
  question: string;
  analysis: string;
  result: string;
  takeaway: string;
}

const VIOLATION_CASES: ViolationCase[] = [
  {
    id: "setup",
    title: "Setup Timing Violation",
    category: "Static Timing Analysis",
    icon: Clock,
    severity: "critical",
    domain: "core_clock_clk (1 GHz)",
    metrics: [
      { label: "WNS", value: "−143 ps", isBad: true },
      { label: "TNS", value: "−2.84 ns", isBad: true },
      { label: "Logic Depth", value: "18 levels" },
      { label: "Corner", value: "ss/0.72V/125°C" },
    ],
    reportTitle: "PrimeTime :: report_timing -delay_type max -nworst 1",
    report: `Path Group:          core_clock_clk
Startpoint:          reg_124 (rising edge-triggered flip-flop)
Endpoint:            reg_892 (rising edge-triggered flip-flop)
Analysis Corner:     ss/0.72V/125°C (Worst Setup PVT)

Point                                Incr       Path
-------------------------------------------------------------
clock clk (rise edge)               0.000      0.000
clock network delay (propagated)    0.120      0.120
reg_124/CLK                         0.000      0.120 r
reg_124/Q (DFFHQ4X1)                0.115      0.235 f
u_alu/adder_18/S                    1.798      2.033 r (18 levels)
u_mux/out                           0.110      2.143 f
data arrival time                              2.143

clock clk (rise edge)               2.000      2.000
clock network delay (propagated)    0.090      2.090
clock reconvergence pessimism       0.012      2.102
clock uncertainty                  -0.080      2.022
reg_892/CLK                         0.000      2.022 r
library setup time                 -0.132      1.890
data required time                             1.890
-------------------------------------------------------------
slack (VIOLATED)                              -0.143 ns`,
    question:
      "Your design passes timing cleanly before CTS. After CTS, setup slack is violated by −143 ps. What is the root cause and diagnostic procedure?",
    analysis:
      "Pre-CTS STA operates with an ideal clock network where all register clock pins receive clock edges with zero insertion delay and zero skew. Once CTS is run and propagated clocks are enabled, physical clock tree variations introduce latency differences between the launch register (120 ps) and capture register (90 ps) — creating a 30 ps skew deficit on this path. Furthermore, 18 combinational logic levels through the ALU adder tree cannot meet the 2.0 ns clock period at the slow-slow (ss) corner. To isolate: (1) Check clock uncertainty values — verify you did not leave pre-CTS skew budgets in SDC. (2) Inspect CPPR common-path credit. (3) Restructure the critical adder tree or insert an intermediate pipeline stage.",
    result:
      "Inserted a pipeline register stage at the ALU output and upsized the driving buffer on u_mux. WNS improved to +18 ps (timing met across all corners).",
    takeaway:
      "CTS timing closure requires understanding the delta between ideal and real clock distribution networks. Always re-evaluate logic depth before attempting physical cell resizing.",
  },
  {
    id: "hold",
    title: "Multi-Corner Hold Failure",
    category: "Signoff Verification",
    icon: AlertTriangle,
    severity: "high",
    domain: "io_clock_sync",
    metrics: [
      { label: "WHS", value: "−67 ps", isBad: true },
      { label: "Failing Pins", value: "326 pins", isBad: true },
      { label: "Critical Corner", value: "ss/0.72V/-40°C" },
      { label: "Nominal tt", value: "+45 ps (met)" },
    ],
    reportTitle: "Tempus :: report_timing -delay_type min -multi_corner",
    report: `Multi-Corner Hold Signoff Summary
-------------------------------------------------------------
Corner               Failing Endpoints     Worst Slack (WHS)
-------------------------------------------------------------
ss/0.72V/-40°C              326                -0.067 ns (VIOLATED)
tt/0.80V/25°C                 0                 +0.045 ns (MET)
ff/0.88V/125°C                0                 +0.092 ns (MET)

Critical Path Detail (ss/-40°C):
Startpoint:          input_reg_5/CLK
Endpoint:            output_reg_12/D
Contamination Delay: 0.021 ns
Data Path Delay:     0.108 ns
Clock Skew (delta):  0.115 ns (capture clock arrives late)
Hold Required:       0.175 ns
-------------------------------------------------------------
slack (VIOLATED)                              -0.067 ns`,
    question:
      "Hold violations appear only in multi-corner temperature inversion analysis (ss/-40°C). Single-corner nominal analysis is completely clean. Why?",
    analysis:
      "Single-corner analysis typically runs at nominal (tt) conditions where NMOS and PMOS transistor delays scale symmetrically. However, modern FinFET technologies exhibit temperature inversion: at ultra-low voltages, cells may run slower or faster depending on temperature and threshold voltage. At ss/-40°C, high local resistance and uneven clock tree branch loading cause the capture flip-flop clock edge to arrive 115 ps late. Because data path contamination delay is only 21 ps, the new data arrives before the previous value has cleared the hold window. Hold violations are fatal in silicon — they cannot be resolved by reducing the clock frequency.",
    result:
      "Inserted 41 delay buffers in the data path near destination registers specifically calibrated to ss/-40°C. Total area impact: 0.28%. Zero hold violations across all 12 PVT corners.",
    takeaway:
      "Never trust nominal-corner hold analysis. Hold closure must be verified at fast-fast and extreme temperature inversion corners before tapeout signoff.",
  },
  {
    id: "congestion",
    title: "Routing Congestion Hotspot",
    category: "Place & Route (P&R)",
    icon: Layers,
    severity: "high",
    domain: "SRAM Subsystem Boundary",
    metrics: [
      { label: "Global Overflow", value: "18.4%", isBad: true },
      { label: "Horizontal", value: "22.1% max" },
      { label: "GRC Utilization", value: "94.1%" },
      { label: "Layer", value: "Metal 3 / Metal 4" },
    ],
    reportTitle: "Innovus :: report_congestion -hotspot -layers M2-M5",
    report: `Global Routing Congestion Report
-------------------------------------------------------------
Global Routing Cells (GRC) Checked:  148,200
Target Utilization Limit:            85.0%

Top Hotspot Coordinates (X, Y):
Region                 H-Overflow   V-Overflow   GRC-Util
-------------------------------------------------------------
(450, 320)-(520, 380)    42.3%        28.1%       94.1%
(180, 500)-(240, 560)    38.7%        19.4%       91.8%

Hotspot Diagnosis:
  - SRAM_128x32 instance placed at coordinate (440, 310)
  - Macro pin access density: 4.7x higher than core average
  - Standard cells placed within 2 µm of macro boundaries
  - Insufficient routing tracks remaining for horizontal bus lines`,
    question:
      "Congestion hotspots concentrate heavily along SRAM macro boundaries. What is the root cause and standard remediation?",
    analysis:
      "Macro boundary congestion is fundamentally a pin access and channel width problem. Memory compilers cluster hundreds of address and data pins onto narrow metal layers. When placer algorithms place standard cells right up against the macro edge without a halo, signal routes must compete for the same metal tracks needed to reach the SRAM pins. Attempting to fix this by spreading standard cells via global placement density bounds rarely succeeds and often creates setup timing regressions. The correct fix is physical constraints: establish routing blockages and keep-out halos around macros.",
    result:
      "Applied a 6 µm placement halo around all memory macros and created a Metal 2/3 routing blockage over macro pin channels. Global overflow dropped from 18.4% to 2.1%. DRC clean.",
    takeaway:
      "Fix physical macro boundary congestion with placement halos and layer-specific blockages first before adjusting global placer heuristics.",
  },
  {
    id: "skew",
    title: "Clock Skew Imbalance",
    category: "Clock Tree Synthesis",
    icon: GitBranch,
    severity: "medium",
    domain: "clk_main (H-Tree)",
    metrics: [
      { label: "Global Skew", value: "87 ps", isBad: true },
      { label: "Target Skew", value: "< 40 ps" },
      { label: "Leaf Count", value: "3,892 flops" },
      { label: "Total Buffers", value: "1,247 cells" },
    ],
    reportTitle: "ICC2 :: report_clock_tree_summary -domain clk_main",
    report: `Clock Tree Summary :: clk_main (H-Tree Topology)
-------------------------------------------------------------
Total Leaf Cells (Registers):       3,892
Clock Inverters / Buffers:          1,247
Target Skew Bound:                  0.040 ns

Latency Distribution across Register Groups:
Group Name           Leaf Count   Latency Range      Max Skew
-------------------------------------------------------------
reg_core_bank_A        1,240      1.38 - 1.42 ns      40 ps
reg_core_bank_B        1,180      1.49 - 1.53 ns      40 ps
reg_core_bank_C        1,472      1.32 - 1.35 ns      30 ps

Inter-Group Skew Analysis:
  Worst Group Delta:  0.180 ns (reg_core_bank_B vs. reg_core_bank_C)
  Physical Distance:  reg_core_bank_B is located 840 µm from clock root`,
    question:
      "Local skew within register banks is under 40 ps, but global clock skew across the entire domain is 87 ps. How do you resolve this discrepancy?",
    analysis:
      "When local skew is tight but global skew is high, the clock tree has balanced leaf clusters well, but the primary distribution branches feeding those clusters have unequal insertion delays. In this case, reg_core_bank_B is placed 840 µm away from the clock root near the die periphery, requiring longer wire runs and additional repeater buffers (1.51 ns average latency) compared to centrally placed bank C (1.34 ns). Adding buffers randomly will only increase power and jitter. The proper procedure is clock tree rebalancing: equalize root-to-cluster latency by optimizing trunk buffer drive strengths and applying target latency bounds in CTS setup.",
    result:
      "Applied custom clock trunk constraints (`set_clock_tree_options -target_latency 1.45ns`). Re-synthesized tree trunks; global skew dropped from 87 ps to 36 ps.",
    takeaway:
      "Global skew measures latency differences between functional register banks; local skew measures differences between neighboring flops. Fix global skew at the trunk level.",
  },
];

export default function EngineeringLabPage() {
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const activeCase = VIOLATION_CASES[selectedCaseIndex];
  const Icon = activeCase.icon;

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-8">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Signoff Diagnostics
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Engineering Lab: Violation Case Studies
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Inspect real EDA log excerpts from Synopsys PrimeTime, Cadence Innovus, and Tempus. Learn the exact reasoning used by physical design and signoff engineers to diagnose and resolve tapeout violations.
          </p>
        </div>

        {/* Case Study Switcher */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {VIOLATION_CASES.map((c, idx) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCaseIndex(idx);
                setRevealed(false);
              }}
              className={cn(
                "p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between gap-2",
                selectedCaseIndex === idx
                  ? "bg-white border-blue-600 shadow-sm ring-1 ring-blue-600"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-semibold",
                    c.severity === "critical" && "bg-red-50 text-red-700 border border-red-200",
                    c.severity === "high" && "bg-amber-50 text-amber-800 border border-amber-200",
                    c.severity === "medium" && "bg-blue-50 text-blue-700 border border-blue-200"
                  )}
                >
                  {c.severity}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Case 0{idx + 1}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{c.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{c.category}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Inspection View */}
      <div className="space-y-8">
        {/* Top Status Banner */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <Icon className="w-4 h-4" />
              </span>
              <div>
                <h2 className="font-display font-bold text-xl text-slate-900">
                  {activeCase.title}
                </h2>
                <p className="text-xs text-slate-500">Domain: {activeCase.domain}</p>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="flex items-center gap-4 flex-wrap">
            {activeCase.metrics.map((m) => (
              <div key={m.label} className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-center">
                <p className="text-[10px] text-slate-400 uppercase font-mono">{m.label}</p>
                <p
                  className={cn(
                    "text-xs font-mono font-bold mt-0.5",
                    m.isBad ? "text-red-600" : "text-slate-800"
                  )}
                >
                  {m.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostic Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: EDA Report Output */}
          <div className="lg:col-span-7 bg-[#0B1120] rounded-xl border border-slate-800 p-5 font-mono text-xs text-slate-300 shadow-inner overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400 text-[11px]">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                <span className="truncate">{activeCase.reportTitle}</span>
              </div>
              <span className="text-slate-500 text-[10px]">RAW LOG EXCERPT</span>
            </div>

            <pre className="overflow-x-auto text-[11px] leading-relaxed text-slate-300 whitespace-pre font-mono">
              {activeCase.report}
            </pre>
          </div>

          {/* Right: Diagnostic Analysis & Solution */}
          <div className="lg:col-span-5 space-y-6">
            {/* The Engineering Problem */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
              <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                Diagnostic Question
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                &ldquo;{activeCase.question}&rdquo;
              </p>

              <button
                onClick={() => setRevealed(!revealed)}
                className="pt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition-colors"
              >
                {revealed ? "Hide Diagnostic Analysis" : "Reveal Engineering Analysis & Fix"}
                {revealed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {revealed && (
              <>
                {/* Root Cause Analysis */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
                  <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-600" />
                    Root Cause Analysis
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activeCase.analysis}
                  </p>
                </div>

                {/* Practical Fix & Silicon Result */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
                  <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Fix Applied &amp; Result
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activeCase.result}
                  </p>
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tapeout Signoff Takeaway:
                    </p>
                    <p className="text-xs text-slate-600 italic">
                      &ldquo;{activeCase.takeaway}&rdquo;
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
