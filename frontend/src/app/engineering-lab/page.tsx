"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Clock,
  Layers,
  GitBranch,
  ChevronDown,
  ChevronUp,
  Beaker,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

type CaseSeverity = "critical" | "high" | "medium";

interface ViolationCase {
  id: string;
  title: string;
  icon: React.ReactNode;
  severity: CaseSeverity;
  badge: string;
  badgeTone: "danger" | "warning" | "accent" | "purple";
  stats: { label: string; value: string }[];
  report: string;
  question: string;
  analysis: string;
  result: string;
  takeaway: string;
}

const VIOLATION_CASES: ViolationCase[] = [
  {
    id: "setup",
    title: "Setup Violation",
    icon: <Clock className="w-5 h-5" />,
    severity: "critical",
    badge: "TIMING",
    badgeTone: "danger",
    stats: [
      { label: "WNS", value: "-143 ps" },
      { label: "TNS", value: "-2.84 ns" },
    ],
    report: `Path Group:          reg_124_clk
Startpoint:          reg_124 (rising edge-triggered flip-flop)
Endpoint:            reg_892 (rising edge-triggered flip-flop)

------------------------------------------------------------
Delay Type       Delay  Arrival  Required  Slack
------------------------------------------------------------
  Clock            2.000   2.000
  Logic            0.143   2.143
  Net              0.380
  Transition       0.210
------------------------------------------------------------
  Data Required                        1.890
  Data Arrival                         2.143
  Slack (setup)                       -0.143  VIOLATED
------------------------------------------------------------

Clock Uncertainty:    0.050
CPPR Adjustment:      0.012
Logic Depth:          18 levels
Critical Path Net:    data_path_reg[14]_to_reg_892/D
Library Cell:         DFFHQ4X1`,
    question:
      "Your design passes timing before CTS. After CTS, WNS is -87 ps. How do you debug it?",
    analysis:
      "Pre-CTS timing uses ideal clocks with zero skew. After CTS, real clock tree introduces skew and insertion delay. The post-CTS slack drop indicates the clock tree is unbalanced on this path group. Key debugging steps: (1) Analyze CPPR — Clock Path Pessimism Removal may not be accounting for shared clock tree segments. (2) Check clock uncertainty — the tool auto-calculates skew-based uncertainty post-CTS; verify it matches your CTS report. (3) Examine path groups — non-default path groups may have lower optimization priority. (4) Review clock tree QOR — check if this endpoint's clock latency is significantly higher than others in the same domain.",
    result: "After balancing the clock tree and adding path group constraints, WNS improved to +12 ps (met).",
    takeaway:
      "CTS timing closure requires understanding the delta between ideal and real clock models. Always re-constrain non-default path groups post-CTS.",
  },
  {
    id: "hold",
    title: "Hold Violation",
    icon: <AlertTriangle className="w-5 h-5" />,
    severity: "high",
    badge: "HOLD",
    badgeTone: "warning",
    stats: [
      { label: "Failing Endpoints", value: "326" },
      { label: "WHS", value: "-67 ps" },
    ],
    report: `Hold Analysis Report
--------------------
Multi-Corner Analysis:  Enabled (3 corners: ss/0p72v/-40c, tt/0p80v/25c, ff/0p88v/125c)

Corner          Failing   Worst WHS
------------------------------------
ss/0p72v/-40c       326      -67 ps
tt/0p80v/25c          0       0 ps
ff/0p88v/125c         0       0 ps

Worst Hold Path:
  Startpoint: input_reg_5 (rising)
  Endpoint:   output_reg_12 (rising)
  Clock Uncertainty:  0.050
  Contamination Delay: 0.021
  Data Path Delay:     0.108
  Hold Required:       0.175
  Slack:              -0.067  VIOLATED (ss corner only)`,
    question:
      "Hold violations appear only in multi-corner analysis. Single-corner is clean. Why?",
    analysis:
      "Single-corner analysis typically runs at typical (tt) conditions. Multi-corner analysis includes worst-case (ss) and best-case (ff) corners. The ss corner has slower transistor drive strength, which increases clock insertion delay disproportionately on some paths compared to the data path. This creates a larger effective hold window. The tt corner is clean because both clock and data paths scale similarly at nominal conditions. The key insight: hold violations in multi-corner are caused by corner-dependent skew — the clock tree delay scales differently than the data path delay across voltage/temperature corners. Check: (1) Clock tree depth variations across corners. (2) Whether buffer insertion in the clock tree has different effects per corner. (3) On-chip variation (OCV) derating factors.",
    result:
      "Added hold-fix buffers only on the ss-corner-critical paths. All 326 endpoints fixed with 41 buffer insertions. Total area overhead: 0.3%.",
    takeaway:
      "Never trust single-corner hold analysis. Multi-corner hold closure catches corner-dependent skew that typical analysis misses.",
  },
  {
    id: "congestion",
    title: "Congestion",
    icon: <Layers className="w-5 h-5" />,
    severity: "high",
    badge: "CONGESTION",
    badgeTone: "purple",
    stats: [
      { label: "Overflow", value: "18.4%" },
      { label: "Hotspot", value: "Near macros" },
    ],
    report: `Congestion Report
------------------
Global Overflow:     18.4%
Horizontal Overflow: 22.1%
Vertical Overflow:   14.7%

Top 3 Hotspot Regions:
  Region             HV-Routing-Overflow  GRC-Util
  -----------------------------------------------
  (450,320)-(520,380)       42.3%            94.1%
  (180,500)-(240,560)       38.7%            91.8%
  (600,100)-(660,160)       31.2%            88.5%

All hotspots are adjacent to macro boundaries:
  - SRAM_128x32 instance at (440,310)
  - ROM_256x8 instance  at (170,490)
  - PLL_TOP instance     at (590,90)

Pin Access:  Macro pin density 4.7x higher than standard cell average
Track Usage: 97.8% in hotspot GRCs (target: <85%)`,
    question:
      "Congestion hotspots appear near macro boundaries. What's the likely cause?",
    analysis:
      "Macro boundary congestion is almost always pin access related. Macros have fixed pin locations that create high local demand for routing resources. When standard cells are placed too close to macro boundaries, their routes must fan out from the macro pins through a narrow channel. Specific causes: (1) Pin access congestion — macro pins are clustered, requiring many metal layers in a small area. (2) Missing blockages/halos — no routing blockage around macros means cells place right up against them. (3) Macro channel width — the gap between macros may be too narrow for the required routing. (4) Pin direction — pins on the macro facing inward toward other macros create a routing bottleneck. Fix strategy: add routing blockages (1-2 metal layers) around macros, increase halo spacing, or push macro pins outward with pin access optimization.",
    result:
      "Added 5-micron routing blockage around all macros and increased halo to 8 microns. Overflow dropped to 3.2%. DRC-clean with no timing regression.",
    takeaway:
      "Macro-adjacent congestion is a pin access problem first. Fix the physical constraint (blockage/halo) before attempting logical fixes like cell spreading.",
  },
  {
    id: "skew",
    title: "Clock Skew",
    icon: <GitBranch className="w-5 h-5" />,
    severity: "medium",
    badge: "CLOCK TREE",
    badgeTone: "accent",
    stats: [
      { label: "Global Skew", value: "87 ps" },
      { label: "Local Skew", value: "23 ps" },
    ],
    report: `Clock Tree Summary
--------------------
Tree Type:          H-Tree (balanced)
Total Buffers:      1,247
Total Leaf Cells:   3,892
Target Skew:        < 50 ps

Skew Report:
  Domain          Endpoint Count  Global Skew  Local Skew
  -------------------------------------------------------
  clk_main              3,892        87 ps        23 ps
  clk_div2                412        12 ps         8 ps

Clock Latency Distribution (clk_main):
  Endpoint Group     Latency    Count
  ------------------------------------
  reg_group_A         1.42 ns    1,240
  reg_group_B         1.51 ns    1,180
  reg_group_C         1.34 ns    1,472

  Max Delta:          0.17 ns (reg_group_B vs reg_group_C)
  Repeater Chain:     BUFX4 → BUFX8 → BUFX16 (3 levels)
  Physical Distance:  reg_group_B is 840 μm from root`,
    question:
      "Global skew is high despite CTS completing successfully. What do you check?",
    analysis:
      "High global skew with clean local skew means the problem is between endpoint groups, not within them. This is a clock tree balance issue. Debugging steps: (1) Check endpoint ClockLatency differences — the report shows 170 ps delta between reg_group_B and reg_group_C. reg_group_B has 87 ps more latency, likely due to physical distance from the clock root (840 μm). (2) Examine the H-tree topology — an H-tree should balance latencies, but asymmetric physical placement of register groups can force the tree to take longer routes. (3) Check buffer insertion — the 3-level repeater chain may be adding unequal delay on different branches. (4) Review clock tree targets — CTS may have prioritized local skew over global skew. Fix: add clock tree post-processing (clock rebalancing) or manually insert latency buffers on the faster paths to equalize arrival times.",
    result:
      "Ran clock tree post-optimization to rebalance reg_group_C path. Global skew reduced to 41 ps. No timing regression on any path group.",
    takeaway:
      "Global skew = latency imbalance between groups. Local skew = imbalance within a group. Fix the right level — global skew fixes require endpoint-level latency equalization, not buffer insertion.",
  },
];

const severityConfig: Record<CaseSeverity, { color: string; ring: string }> = {
  critical: { color: "bg-red-500", ring: "ring-red-200" },
  high: { color: "bg-amber-500", ring: "ring-amber-200" },
  medium: { color: "bg-blue-500", ring: "ring-blue-200" },
};

function ViolationCaseCard({ violationCase }: { violationCase: ViolationCase }) {
  const [expanded, setExpanded] = useState(false);
  const sev = severityConfig[violationCase.severity];

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-white ring-4",
              sev.color,
              sev.ring,
            )}
          >
            {violationCase.icon}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {violationCase.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge tone={violationCase.badgeTone}>{violationCase.badge}</Badge>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {violationCase.severity}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mt-4">
        {violationCase.stats.map((stat) => (
          <div
            key={stat.label}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
          >
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {stat.label}
            </div>
            <div className="text-sm font-black text-slate-900 mt-0.5">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* EDA Report Excerpt */}
      <div className="mt-4">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          EDA Report Excerpt
        </div>
        <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
          <pre className="text-[11px] leading-relaxed text-emerald-400 font-mono whitespace-pre">
            {violationCase.report}
          </pre>
        </div>
      </div>

      {/* Diagnosis Question */}
      <div className="mt-5 bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">
              Diagnosis Question
            </div>
            <p className="text-sm font-semibold text-amber-900 leading-relaxed">
              {violationCase.question}
            </p>
          </div>
        </div>
      </div>

      {/* Expand/Collapse Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 transition-colors"
      >
        {expanded ? "Hide Analysis" : "Show Analysis"}
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Analysis */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">
              Analysis
            </div>
            <p className="text-sm text-blue-900 leading-relaxed font-medium">
              {violationCase.analysis}
            </p>
          </div>

          {/* Result */}
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
                  Result After Fix
                </div>
                <p className="text-sm text-emerald-900 leading-relaxed font-semibold">
                  {violationCase.result}
                </p>
              </div>
            </div>
          </div>

          {/* Takeaway */}
          <div className="bg-slate-900 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Key Takeaway
                </div>
                <p className="text-sm text-slate-100 leading-relaxed font-medium">
                  {violationCase.takeaway}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function EngineeringLabPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* HERO */}
        <Card tone="accent" className="p-8 sm:p-12 shadow-brutal-lg relative overflow-hidden">
          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-slate-900 text-xs font-black border-2 border-slate-900 shadow-brutal-sm">
              <Beaker className="w-4 h-4 text-purple-600 stroke-[2.5]" />
              <span>REAL VIOLATION DEBUGGING CASES</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Engineering Lab
            </h1>
            <p className="text-blue-50 text-sm sm:text-base font-medium leading-relaxed">
              Walk through real EDA report excerpts, diagnose timing violations, congestion issues, and clock tree problems. Each case presents the data, asks the question, then reveals the debugging methodology.
            </p>
          </div>
        </Card>

        {/* CASES */}
        <div>
          <SectionHeader
            eyebrow="Violation Cases"
            title="Debugging Case Studies"
            description="4 real-world violation scenarios from signoff timing, multi-corner analysis, physical design, and CTS. Expand each case to see the full analysis."
          />

          <div className="space-y-6">
            {VIOLATION_CASES.map((vc) => (
              <ViolationCaseCard key={vc.id} violationCase={vc} />
            ))}
          </div>
        </div>

        {/* BOTTOM CTA */}
        <Card tone="inverse" className="p-8 text-center">
          <h2 className="text-xl font-black text-white mb-2">
            Want more practice?
          </h2>
          <p className="text-slate-300 text-sm font-medium mb-5 max-w-lg mx-auto">
            These cases cover setup, hold, congestion, and clock skew. Practice analyzing real EDA reports to build debugging intuition.
          </p>
          <Button href="/academy" variant="secondary" size="lg">
            Back to Academy
          </Button>
        </Card>
      </div>
    </div>
  );
}
