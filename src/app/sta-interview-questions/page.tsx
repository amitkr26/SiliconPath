"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  BookOpen,
  MessageSquare,
  Search,
  ArrowRight,
  HelpCircle,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface Question {
  id: string;
  question: string;
  answer: string;
}

interface Topic {
  id: string;
  title: string;
  count: number;
  questions: Question[];
}

const TOPICS: Topic[] = [
  {
    id: "sta-fundamentals",
    title: "STA Fundamentals",
    count: 5,
    questions: [
      {
        id: "sf-1",
        question: "What is Static Timing Analysis and why is it preferred over simulation?",
        answer:
          "Static Timing Analysis (STA) is a method of verifying timing constraints in a digital design without requiring dynamic simulation. Instead of applying input vectors and observing outputs over time, STA exhaustively checks every timing path in the design for setup and hold violations.\n\nSTA is preferred because it is exhaustive — it checks all possible paths regardless of input patterns. Dynamic simulation can only verify the paths exercised by specific test vectors, potentially missing critical violations. STA is also significantly faster, as it uses graph-based algorithms rather than event-driven simulation.\n\nIn practice, STA is the industry standard for timing signoff. Tools like PrimeTime and Tempus analyze the design at multiple corners and modes to ensure timing closure across all operating conditions.",
      },
      {
        id: "sf-2",
        question: "What is a timing path in STA?",
        answer:
          "A timing path is a directed acyclic graph (DAG) traversal from a timing startpoint to a timing endpoint through combinational logic. Every path has a launch edge (when data is launched) and a capture edge (when data must be captured).\n\nStartpoints include input ports and clock pins of sequential elements (flip-flops, latches). Endpoints include output ports and data pins of sequential elements. The path consists of cell delays (through logic gates) and net delays (wire parasitics between cells).\n\nThe total path delay is compared against the required time to determine slack. A positive slack means timing is met; a negative slack means a violation exists.",
      },
      {
        id: "sf-3",
        question: "What is the difference between max delay (setup) and min delay (hold) analysis?",
        answer:
          "Max delay analysis (setup check) ensures data arrives at the destination register before the next clock edge. It uses the worst-case (slowest) path delay, typically at slow process, low voltage, and high temperature (SS corner). Setup violations indicate the combinational path is too slow.\n\nMin delay analysis (hold check) ensures data at the destination register does not change too quickly after the capturing clock edge, which would corrupt the previous value. It uses the best-case (fastest) path delay, typically at fast process, high voltage, and low temperature (FF corner). Hold violations indicate the combinational path is too fast.\n\nBoth checks must pass simultaneously across all PVT corners for timing closure. Setup fixes (adding buffers, resizing cells) can worsen hold, and vice versa — making timing closure an iterative process.",
      },
      {
        id: "sf-4",
        question: "What are the different types of timing paths?",
        answer:
          "There are four fundamental path types: (1) Reg-to-Reg: from a flip-flop clock pin to another flip-flop data pin — the most common type, (2) Input-to-Reg: from an input port to a flip-flop data pin, (3) Reg-to-Output: from a flip-flop clock pin to an output port, (4) Input-to-Output: from an input port directly to an output port (combinational path).\n\nReg-to-Reg paths are fully constrained by the clock. Input-to-Reg and Reg-to-Output paths require input/output delay constraints. Input-to-Output paths are constrained by set_max_delay or set_false_path depending on whether the path is real.\n\nEach path type has a different clock relationship and requires specific SDC constraints for proper analysis.",
      },
      {
        id: "sf-5",
        question: "What is the difference between ideal and propagated clocks?",
        answer:
          "Ideal clocks have zero insertion delay and zero skew — the clock arrives at every register simultaneously. They are used during synthesis and pre-CTS stages when the clock tree has not yet been built. STA with ideal clocks is an approximation that helps focus on logic timing first.\n\nPropagated clocks account for the actual clock tree delay, skew, and jitter measured from the synthesized clock network. After CTS, STA uses propagated clock delays to get realistic timing. The clock insertion delay varies across different register clock pins due to tree topology and buffer placement.\n\nSwitching from ideal to propagated clocks typically degrades timing slack because real skew adds uncertainty. This is why designs that pass pre-CTS timing can fail post-CTS — the skew and latency of the real clock tree were not modeled.",
      },
    ],
  },
  {
    id: "timing-paths",
    title: "Timing Paths & Path Types",
    count: 5,
    questions: [
      {
        id: "tp-1",
        question: "How does STA identify the critical path?",
        answer:
          "The critical path is the timing path with the worst (most negative) slack. STA identifies it by computing the arrival time and required time at every endpoint, then finding the endpoint where the difference (slack = required - arrival) is minimized.\n\nThe critical path is not necessarily the longest path in terms of logic depth — it is the path with the smallest timing margin. A shorter path with tight clock constraints can be more critical than a longer path with generous constraints.\n\nTools report the critical path details: startpoint, endpoint, logic depth, total delay, and the specific cells and nets contributing to the delay. This information guides optimization efforts.",
      },
      {
        id: "tp-2",
        question: "What is a clock path and how is it treated differently from a data path?",
        answer:
          "The clock path goes from the clock source (PLL output, input port) through the clock tree to the clock pin of a sequential element. It is treated differently because the clock network is common to many endpoints, and its characteristics (latency, skew) affect all paths sharing that clock.\n\nIn STA, the clock path delay is added to the data path arrival time at the launch register. Clock uncertainty (jitter + skew) is subtracted from the required time. CPPR (Clock Path Pessimism Removal) is applied to remove shared clock path delay differences between launch and capture paths.\n\nData paths are analyzed per-endpoint with unique delays, while clock paths are shared infrastructure — which is why clock tree quality directly impacts overall timing closure.",
      },
      {
        id: "tp-3",
        question: "What is the difference between a constrained and unconstrained path?",
        answer:
          "A constrained path has explicit timing requirements defined through SDC constraints — the tool knows the clock definition, input/output delays, or exceptions applied to it. The tool can compute slack and report violations.\n\nAn unconstrained path has no timing requirement — either the designer forgot to constrain it, or it is intentionally left unconstrained. STA tools typically report unconstrained paths as warnings because the tool cannot determine if timing is met.\n\nUnconstrained paths are dangerous because a violation on an unconstrained path can cause functional failure in silicon. Best practice: constrain every path in the design. Use set_false_path for paths that should not be analyzed, and set_max_delay for paths without a clock relationship.",
      },
      {
        id: "tp-4",
        question: "What is a multicycle path and when would you use one?",
        answer:
          "A multicycle path is a timing path where data is allowed to propagate over multiple clock cycles instead of one. It is defined using set_multicycle_path in SDC. For example, set_multicycle_path 2 -setup -from [get_pins A/Q] -to [get_pins B/D] allows 2 cycles for setup.\n\nMulticycle paths are used when: (1) The logic between registers genuinely needs multiple cycles — for example, a slow computation block, (2) The receiving register only samples data every N cycles, (3) To relax overly pessimistic timing constraints on paths that have guaranteed multi-cycle timing.\n\nImportant: when setting a multicycle path for setup, you must also adjust the hold constraint by (N-1) cycles, or the hold check will be incorrect. This is a common interview gotcha.",
      },
      {
        id: "tp-5",
        question: "What is a false path and how does it differ from a multicycle path?",
        answer:
          "A false path is a timing path that is functionally impossible or should not be analyzed for timing. It is removed from timing analysis using set_false_path. Examples include: asynchronous clock domain crossings (without synchronizers), reset paths, and paths that are logically disabled.\n\nThe key difference from a multicycle path: a false path is never analyzed (zero slack reported as met), while a multicycle path is analyzed with relaxed timing (more cycles allowed). A false path has no timing requirement at all.\n\nCommon misconception: setting a path as false does not mean it won't toggle in silicon — it means STA ignores it. You must ensure the path is functionally safe (e.g., through CDC synchronizers) even though STA does not check it.",
      },
    ],
  },
  {
    id: "setup-hold",
    title: "Setup & Hold Checks",
    count: 5,
    questions: [
      {
        id: "sh-1",
        question: "Write the setup timing equation. What are all the terms?",
        answer:
          "Setup check: Data Required Time = Clock Period + Clock Capture Edge - Setup Time - Clock Uncertainty. Data Arrival Time = Clock Launch Edge + Clock Insertion Delay (launch) + Data Path Delay. Slack_setup = Data Required Time - Data Arrival Time.\n\nBreaking it down: the launch edge is when data leaves the source register; the capture edge is the next clock edge at the destination register. Setup time is the minimum time data must be stable before the capture edge. Clock uncertainty includes jitter and skew.\n\nA negative setup slack means the data arrives too late — the combinational logic is too slow. Fixing setup violations typically involves speeding up the data path (resizing cells, adding buffers) or reducing clock uncertainty.",
      },
      {
        id: "sh-2",
        question: "Write the hold timing equation. Why is hold analysis done at the fast corner?",
        answer:
          "Hold check: Data Required Time = Clock Launch Edge + Clock Insertion Delay (launch) - Hold Time + Clock Uncertainty. Data Arrival Time = Clock Launch Edge + Clock Insertion Delay (launch) + Data Path Delay. Slack_hold = Data Arrival Time - Data Required Time.\n\nHold analysis uses the fast corner (FF: fast process, high voltage, low temperature) because at fast conditions, data races through the combinational logic fastest. If data arrives before the hold window closes, it corrupts the captured value. This is the worst case for hold.\n\nConversely, setup uses the slow corner because slow conditions give data the longest time to propagate — if it still misses setup, the violation is real. Using the wrong corner for each check gives misleading results.",
      },
      {
        id: "sh-3",
        question: "How do you fix a setup violation without creating a hold violation?",
        answer:
          "Setup violations are fixed by either: (1) Reducing combinational delay — resize cells to faster drive strengths, (2) Inserting buffers to break long paths, (3) Logic restructuring to reduce critical path depth, (4) Increasing clock period (if the spec allows).\n\nThe challenge is that these changes can increase data path delay on other paths, potentially causing hold violations. Conversely, adding delay buffers for hold fixes can slow down the setup path.\n\nThe standard approach: fix setup first at the slow corner, then fix hold at the fast corner without regressing setup. This is iterative — tools like PrimeTime handle this automatically, but understanding the tradeoff is critical for debugging.",
      },
      {
        id: "sh-4",
        question: "What is the relationship between setup time, hold time, and clock-to-q delay?",
        answer:
          "Clock-to-Q delay (Tcq) is the time from the clock edge at the source register to valid data appearing at its Q output. Setup time (Ts) is how long data must be stable before the capture clock edge. Hold time (Th) is how long data must remain stable after the capture clock edge.\n\nFor a reg-to-reg path: Data arrives at destination = Tcq + Tlogic + Tnet. Setup requires: Tcq + Tlogic + Tnet < Tperiod - Ts. Hold requires: Tcq + Tlogic + Tnet > Th.\n\nIn other words: setup limits the maximum combinational delay, while hold limits the minimum combinational delay. The gap between max and min delay is the 'allowable logic range' — if this range is too narrow (due to high clock frequency or large OCV), closure becomes difficult.",
      },
      {
        id: "sh-5",
        question: "What happens if you only close setup and ignore hold?",
        answer:
          "Ignoring hold violations leads to silicon failure. Hold violations cause data corruption — the new data overwrites the previous value before it is properly captured. Unlike setup violations (which can sometimes be masked by lower frequency), hold violations are frequency-independent.\n\nA design with only setup clean and hold violated will fail at all frequencies. The capture register will capture incorrect data, leading to functional errors. This is why hold closure is non-negotiable.\n\nIn practice, hold violations are fixed by inserting delay buffers in the data path near the destination register. These buffers add minimum delay to ensure data remains stable long enough for the hold window. Hold fixes are typically done post-CTS and post-route when accurate parasitics are available.",
      },
    ],
  },
  {
    id: "clocks",
    title: "Clocks: Skew, Jitter, Latency, Uncertainty",
    count: 5,
    questions: [
      {
        id: "ck-1",
        question: "What is clock skew and what causes it?",
        answer:
          "Clock skew is the difference in clock arrival time between two sequentially adjacent registers (registers on the same clock domain that share a timing path). It is caused by unequal clock tree path lengths from the clock source to different register clock pins.\n\nPositive skew means the capture register receives the clock later than the launch register. Negative skew means the capture register receives the clock earlier. Skew directly impacts timing: positive skew helps setup but hurts hold, while negative skew does the opposite.\n\nSkew sources include: (1) Unbalanced clock tree topology, (2) Different buffer insertion on clock branches, (3) Physical distance between registers, (4) PVT variation across the die. CTS tools try to minimize skew through balanced tree construction, but some residual skew is inevitable.",
      },
      {
        id: "ck-2",
        question: "What is clock jitter and how does it differ from skew?",
        answer:
          "Clock jitter is the temporal variation of the clock edge from its ideal position on a cycle-to-cycle basis. It is a random phenomenon caused by thermal noise, supply noise, and oscillator imperfections. Unlike skew (which is deterministic and fixed for a given clock tree), jitter varies every cycle.\n\nJitter degrades both setup and hold margins because it makes the capture edge arrive unpredictably early or late. It is modeled in STA as part of clock uncertainty. Typical jitter values range from tens to hundreds of picoseconds depending on the PLL and process node.\n\nKey distinction: skew is the spatial difference (between two registers), while jitter is the temporal variation (cycle-to-cycle at the same register). Both contribute to clock uncertainty, but skew can be measured and partially compensated, while jitter is inherently random.",
      },
      {
        id: "ck-3",
        question: "What is clock latency and what is the difference between network and source latency?",
        answer:
          "Clock latency is the time it takes for a clock signal to travel from its ideal source to a register's clock pin. It has two components: source latency and network latency.\n\nSource latency (also called insertion delay) is the delay from the clock's ideal waveform point (e.g., PLL output) to the clock definition point (e.g., the port where the clock enters the design). Network latency is the delay from the clock definition point through the clock tree to the register.\n\nTotal clock latency = source latency + network latency. Pre-CTS, network latency is estimated. Post-CTS, it is extracted from the actual clock tree. Source latency is specified by the PLL/vendor and typically does not change.",
      },
      {
        id: "ck-4",
        question: "How is clock uncertainty modeled in STA?",
        answer:
          "Clock uncertainty is a catch-all term that accounts for all non-ideal clock behavior: jitter, skew, and any additional margin. In SDC, it is set using set_clock_uncertainty. It is subtracted from the setup required time, reducing setup margin.\n\nFor setup: uncertainty reduces the available time window. For hold: uncertainty is added to the required time, also reducing margin. The tool applies uncertainty to both setup and hold checks unless specified otherwise.\n\nPost-CTS, the tool can auto-calculate skew-based uncertainty from the actual clock tree. Pre-CTS, designers manually specify uncertainty values based on expected jitter and skew budgets. Typical values: 50-200ps for high-performance designs, 200-500ps for lower-frequency designs.",
      },
      {
        id: "ck-5",
        question: "What is the difference between global skew and local skew?",
        answer:
          "Global skew is the maximum clock skew between any two registers in the same clock domain across the entire design. It captures the worst-case latency difference between the farthest-apart endpoints. High global skew indicates an unbalanced clock tree overall.\n\nLocal skew is the maximum clock skew between registers that are physically close to each other or in the same clock subtree. It measures the imbalance within a local cluster. Local skew is often more critical because nearby registers frequently communicate.\n\nA design can have high global skew but low local skew (the tree is balanced locally but branches differ globally), or low global skew with high local skew (overall balanced but a local branch is mismanaged). Both need to be within targets for timing closure.",
      },
    ],
  },
  {
    id: "slack-slew",
    title: "Slack, Slew & Transition",
    count: 5,
    questions: [
      {
        id: "ss-1",
        question: "What is slack and how is it calculated?",
        answer:
          "Slack is the difference between the required time and the arrival time at a timing endpoint. For setup: Slack = Required Time - Arrival Time. A positive slack means timing is met with margin; a negative slack means a violation.\n\nRequired time is derived from the clock constraint (period, multicycle, etc.) minus setup time and clock uncertainty. Arrival time is the sum of clock latency (launch) and data path delay.\n\nWNS (Worst Negative Slack) is the most negative slack across all endpoints — it indicates the worst violation. TNS (Total Negative Slack) is the sum of all negative slacks — it indicates the total timing debt. Both are key metrics in timing signoff.",
      },
      {
        id: "ss-2",
        question: "What is signal slew (transition time) and why does it matter?",
        answer:
          "Slew (transition time) is the time it takes for a signal to transition between logic thresholds — typically from 20% to 80% (or 10% to 90%) of the supply voltage. It is also called transition time or edge rate.\n\nSlew matters because: (1) Slow slew increases cell delay — most cell delay models have slew-dependent delay terms, (2) Slow slew increases short-circuit power consumption, (3) Slow slew can violate min_transition constraints, (4) Crosstalk impact is worse on nets with slow slew.\n\nSTA reports slew violations alongside timing violations. The set_max_transition constraint sets the maximum allowed slew. Fixing slew violations involves resizing driving cells to stronger drive strengths or adding buffers.",
      },
      {
        id: "ss-3",
        question: "What is WNS, TNS, and WHS?",
        answer:
          "WNS (Worst Negative Slack) is the slack of the single worst violating endpoint. It represents the worst-case violation — the deepest hole in timing. This is the primary metric for timing closure progress.\n\nTNS (Total Negative Slack) is the sum of all negative slacks across all endpoints. It represents the total amount of timing violation across the design. A design with many small violations can have worse TNS than one with a single large violation.\n\nWHS (Worst Hold Slack) and THS (Total Hold Slack) are the equivalent metrics for hold analysis. All four metrics are tracked during timing closure iterations to monitor progress.",
      },
      {
        id: "ss-4",
        question: "How do slew and capacitance affect each other?",
        answer:
          "Slew and capacitance are coupled in a feedback loop. A net with high capacitance requires more charge to transition, which slows down the driving cell's output slew. In turn, slow slew on a net increases the effective capacitance seen by the next stage (because the input capacitance of a gate is slew-dependent).\n\nThis coupling is modeled in liberty (.lib) files as composite current source (CCS) or nonlinear delay model (NLDM) tables. The delay and slew of a cell are functions of input slew and output capacitance.\n\nIn STA, the tool iterates to converge on consistent slew and capacitance values across the design. This is why parasitic extraction (RC extraction) is critical — accurate capacitance values are needed for accurate slew and delay calculation.",
      },
      {
        id: "ss-5",
        question: "What is the difference between max_transition and max_capacitance constraints?",
        answer:
          "Max_transition (set_max_transition) limits the maximum slew on a net. It ensures signals transition fast enough to meet timing and power requirements. The constraint can be applied globally or to specific pins/nets.\n\nMax_capacitance (set_max_capacitance) limits the total load capacitance on a net. It ensures the driving cell is not overloaded — too much capacitance degrades slew, increases delay, and can cause reliability issues (electromigration).\n\nBoth constraints work together: max_capacitance prevents the designer from connecting too many loads to one driver, while max_transition ensures the resulting slew is acceptable. Violations of either indicate a drive strength problem that needs resizing or buffering.",
      },
    ],
  },
  {
    id: "exceptions",
    title: "Timing Exceptions",
    count: 5,
    questions: [
      {
        id: "ex-1",
        question: "What are the main types of timing exceptions in SDC?",
        answer:
          "The main timing exceptions are: (1) set_false_path — removes a path from timing analysis entirely, (2) set_multicycle_path — allows data multiple clock cycles to propagate, (3) set_max_delay / set_min_delay — constrains path delay to a specific value instead of the clock, (4) set_clock_groups — defines asynchronous clock domains, (5) set_disable_timing — removes specific pins/transistors from timing.\n\nEach exception serves a different purpose. False paths are for paths that should never be analyzed (async crossings, test modes). Multicycle paths are for paths that genuinely need multiple cycles. Max/min delay replaces the clock-based constraint with a manual one.\n\nOverusing exceptions is dangerous — every exception is a blind spot in timing analysis. Best practice: minimize exceptions, document them thoroughly, and review them regularly.",
      },
      {
        id: "ex-2",
        question: "When would you use set_false_path vs set_clock_groups?",
        answer:
          "set_false_path is applied between specific startpoints and endpoints. It removes individual paths from analysis. Use it for: reset paths, test mode paths, paths between non-communicating logic blocks.\n\nset_clock_groups -asynchronous defines groups of clocks that are asynchronous to each other. All paths between clocks in different groups are automatically treated as false paths. It is cleaner and safer for clock domain crossings.\n\nThe key advantage of set_clock_groups: it automatically handles all paths between the two clock domains, including future paths added during design changes. set_false_path must be updated if the design changes. For CDC paths, set_clock_groups is preferred because it is more maintainable and less error-prone.",
      },
      {
        id: "ex-3",
        question: "What is a multicycle path exception and what is the common pitfall?",
        answer:
          "A multicycle path allows data to propagate over N clock cycles instead of one. It is set with set_multicycle_path N -setup -from <start> -to <end>. The hold multicycle must be adjusted to N-1 to maintain correct hold checking.\n\nThe common pitfall: forgetting to set the hold multicycle. If you set setup for 2 cycles but leave hold at 1 cycle, the hold check will be wrong — it checks at the wrong edge, making the hold constraint either too tight or too loose. The correct pair is: set_multicycle_path 2 -setup and set_multicycle_path 1 -hold.\n\nAnother pitfall: applying multicycle to only the setup without considering the actual clock relationship. The multicycle value must match the real design intent — using it to 'fix' timing without understanding the functional behavior leads to silicon bugs.",
      },
      {
        id: "ex-4",
        question: "What does set_disable_timing do and when should you use it?",
        answer:
          "set_disable_timing removes specific timing arcs from analysis. It can disable timing from a specific pin to another pin on a cell, effectively telling STA to ignore that arc. It is applied at the cell level: set_disable_timing -from A -to Y [get_cells U1].\n\nUse cases: (1) cells that have timing arcs for test modes but not functional modes, (2) cells with always-on paths that should not be analyzed in certain modes, (3) specific pins that are functionally unused but have timing arcs.\n\nUnlike false paths (which remove entire paths), disable_timing removes specific arcs while keeping others on the same cell intact. This is more surgical but also more dangerous — disabling the wrong arc can hide real violations.",
      },
      {
        id: "ex-5",
        question: "How do you handle cross-clock domain paths in STA?",
        answer:
          "Cross-clock domain paths (paths where the launch and capture registers use different clocks) require careful handling. There are three scenarios:\n\n(1) Synchronous clocks (same frequency, known phase): analyze normally with clock uncertainty for skew. (2) Asynchronous clocks (no known relationship): use set_clock_groups -asynchronous or set_false_path. (3) Quasi-synchronous (related but different frequencies): use set_multicycle_path or set_max_delay.\n\nThe key principle: STA can only analyze paths with a known clock relationship. For truly asynchronous crossings, STA cannot determine the timing requirement — that is why CDC synchronizers are needed (which STA does not verify). For CDC verification, you need formal tools like Spyglass CDC or QDC.",
      },
    ],
  },
  {
    id: "ocv",
    title: "OCV, AOCV, POCV & Derating",
    count: 5,
    questions: [
      {
        id: "ocv-1",
        question: "What is On-Chip Variation (OCV) and why is it needed?",
        answer:
          "On-Chip Variation (OCV) accounts for the fact that transistors on the same die do not all operate at the same speed. Process variations cause some cells to be faster or slower than the nominal model. Without OCV derating, STA would be overly optimistic.\n\nOCV applies derating factors to cell delays: the launch path is derated to be slower (for setup) or faster (for hold), and the capture path is derated in the opposite direction. This creates a pessimistic timing window that covers worst-case variation.\n\nTraditional OCV uses a single derating factor for all cells regardless of distance. This is overly pessimistic because cells that are physically close to each other have correlated variation — they tend to vary in the same direction. This led to AOCV and POCV.",
      },
      {
        id: "ocv-2",
        question: "What is AOCV (Advanced OCV) and how does it improve over basic OCV?",
        answer:
          "Advanced OCV (AOCV) reduces OCV pessimism by considering two factors: (1) path depth — deeper paths have more variation opportunity, and (2) physical distance — cells closer together have more correlated variation.\n\nAOCV uses lookup tables derived from silicon data. The derating factor decreases with increasing path depth (because deeper paths average out more variation) and decreases with decreasing physical distance (because nearby cells track each other better).\n\nAOCV tables are provided by the foundry in the technology library. The tool looks up the derating factor based on the path's hop count (number of cells) and physical distance. This can recover 10-30% of the pessimism from basic OCV, significantly helping timing closure.",
      },
      {
        id: "ocv-3",
        question: "What is POCV (Parametric OCV) and how does it differ from AOCV?",
        answer:
          "Parametric OCV (POCV), also called LVF (Liberty Variance Format), is the most advanced derating method. Instead of using derating tables, POCV uses statistical variance data from the foundry. It models variation as a statistical distribution rather than a fixed derating factor.\n\nPOCV computes timing as a statistical mean plus sigma. The tool reports timing at a specified confidence level (e.g., 3-sigma = 99.87% coverage). This is more accurate than AOCV because it captures the actual distribution shape, not just a worst-case factor.\n\nPOCV requires foundry-provided LVF libraries. It reduces pessimism further than AOCV by 5-15%, which can be the difference between closure and non-closure on tight designs. The tradeoff is more complex characterization data and longer runtime.",
      },
      {
        id: "ocv-4",
        question: "What is the difference between setup derating and hold derating?",
        answer:
          "Setup derating makes the launch path slower and the capture path faster — this models the worst case where data is launched late and captured early. The late derating factor is applied to the launch clock and data path; the early factor to the capture clock.\n\nHold derating does the opposite: it makes the launch path faster and the capture path slower — modeling the case where data races through quickly and the capture edge arrives late. This is the worst case for hold because data arrives early and must remain stable.\n\nIn basic OCV: setup uses late derating on launch, early on capture. Hold uses early on launch, late on capture. AOCV and POCV apply the same concept but with distance/depth-dependent or statistical factors instead of fixed multipliers.",
      },
      {
        id: "ocv-5",
        question: "What isCPPR and how does it relate to OCV?",
        answer:
          "CPPR (Clock Path Pessimism Removal) removes the portion of OCV derating that applies to the shared clock path between launch and capture registers. Without CPPR, the shared clock path is derated twice (once for launch, once for capture) — but since it is the same physical path, the variation must be the same for both.\n\nCPPR identifies the common clock path prefix between launch and capture clock paths and removes the derating difference on that shared segment. This recovers pessimism that OCV incorrectly adds.\n\nCPPR is applied after OCV derating. With basic OCV, CPPR can recover significant pessimism. With AOCV and POCV, CPPR still helps but less dramatically because AOCV/POCV already account for path correlation. Modern tools apply CPPR automatically.",
      },
    ],
  },
  {
    id: "crpr",
    title: "CRPR & Clock Reconvergence",
    count: 5,
    questions: [
      {
        id: "cr-1",
        question: "What is CRPR (Clock Path Pessimism Removal)?",
        answer:
          "CRPR is the same concept as CPPR — it removes pessimism from the shared clock path between launch and capture registers. When OCV derating is applied, the shared clock path is derated in opposite directions for launch and capture, which is physically impossible (the same wire cannot be both fast and slow).\n\nCRPR identifies the common ancestor point in the clock tree where the launch and capture paths diverge. From the clock source to that divergence point, the derating is removed or made common. Only the divergent portions receive different derating.\n\nThe amount of recovery depends on how much of the clock path is shared. Registers close together in the clock tree share more path and recover more pessimism. Registers far apart share less and recover less.",
      },
      {
        id: "cr-2",
        question: "What is clock reconvergence and why is it a problem?",
        answer:
          "Clock reconvergence occurs when two clock paths diverge and then reconverge at a common point — for example, when a clock branches to two register groups and then the data paths from those groups reconverge at a downstream register. The skew between the two branches may be different for different data paths.\n\nThe problem: STA computes skew globally, but the actual skew experienced by a specific data path depends on the exact launch and capture clock paths. If the clock tree is not perfectly balanced, the effective skew varies per path, and a single global skew value may be too pessimistic or too optimistic.\n\nAOCV and POCV partially address this by considering physical distance, but clock reconvergence analysis requires understanding the specific clock topology. Tools can perform reconvergence-aware timing to reduce remaining pessimism.",
      },
      {
        id: "cr-3",
        question: "How does the tool handle the difference between CPPR and CRPR?",
        answer:
          "CPPR (Clock Path Pessimism Removal) and CRPR (Clock Path Pessimism Removal) are actually the same concept — different tools use different names. PrimeTime uses CPPR; some other tools and papers use CRPR. Both remove OCV pessimism from shared clock paths.\n\nThe implementation varies slightly: some tools compute CPPR at the timing path level (per path), while others compute it at the clock tree level (globally). The result is effectively the same — shared clock path derating is removed.\n\nIn interview contexts, if asked about the difference, clarify that they refer to the same technique. The key understanding is recognizing that OCV on shared paths is pessimistic and must be removed.",
      },
      {
        id: "cr-4",
        question: "What is the role of clock tree topology in CRPR effectiveness?",
        answer:
          "The clock tree topology determines how much clock path is shared between launch and capture registers. In an H-tree or balanced tree, registers in the same subtree share more clock path, leading to more CRPR recovery. In an unbalanced tree, less is shared.\n\nCRPR is most effective when: (1) The clock tree is well-balanced (more shared path), (2) Registers are physically close (share more tree), (3) The clock tree has fewer levels (less divergent path). It is least effective when: registers are far apart with minimal shared path.\n\nThis is why CTS quality directly impacts CRPR effectiveness — a well-built clock tree not only reduces skew but also maximizes CRPR recovery, creating a double benefit for timing closure.",
      },
      {
        id: "cr-5",
        question: "Can CRPR ever be harmful or over-applied?",
        answer:
          "CRPR itself is always beneficial — it removes physically impossible pessimism. However, it can mask real problems if the designer relies on it too heavily. If the clock tree is severely unbalanced, CRPR recovery may make timing appear clean when the skew is still problematic.\n\nOver-reliance on CRPR can lead to: (1) Designs that close in STA but fail in silicon due to excessive skew, (2) Reduced margin for clock tree quality degradation in manufacturing, (3) Masking of clock tree problems that should be fixed at the source.\n\nBest practice: use CRPR as intended (remove pessimism), but also monitor raw skew values independently. If skew is high even with CRPR recovery, fix the clock tree rather than relying on CRPR to compensate.",
      },
    ],
  },
  {
    id: "crosstalk",
    title: "Crosstalk & Signal Integrity",
    count: 5,
    questions: [
      {
        id: "ct-1",
        question: "What is crosstalk and how does it affect timing?",
        answer:
          "Crosstalk is the unwanted coupling of signals between adjacent metal interconnects. When a neighboring net (aggressor) switches, it capacitively couples to the target net (victim), inducing a voltage glitch or altering the victim's transition time.\n\nCrosstalk affects timing in two ways: (1) Crosstalk delay — the aggressor's transition changes the effective capacitance seen by the victim, speeding up or slowing down the victim's transition depending on the direction. (2) Crosstalk noise — the aggressor induces a glitch on the victim that can cause functional failure if the glitch exceeds the noise margin.\n\nIn STA, crosstalk delay is modeled by the CCS noise or timing models. The tool considers all aggressors simultaneously — the worst-case crosstalk occurs when all aggressors switch in the same direction as the victim.",
      },
      {
        id: "ct-2",
        question: "What is the difference between crosstalk delay and crosstalk noise?",
        answer:
          "Crosstalk delay affects the timing of the victim net. When aggressors switch simultaneously with the victim, the coupled capacitance either speeds up (if same direction) or slows down (if opposite direction) the victim's transition. This changes the cell delay downstream.\n\nCrosstalk noise is a voltage glitch on the victim when the aggressor switches but the victim is stable. The induced glitch can momentarily exceed the logic threshold, causing a false signal to propagate. This is a functional failure, not a timing failure.\n\nCrosstalk delay is handled in STA timing analysis. Crosstalk noise is handled in a separate static noise analysis (SI analysis). Both must be clean for signoff. Noise violations are typically fixed by adding spacing, shielding, or buffering.",
      },
      {
        id: "ct-3",
        question: "What design techniques mitigate crosstalk?",
        answer:
          "Common crosstalk mitigation techniques: (1) Wire spacing — increase distance between critical nets to reduce coupling capacitance, (2) Shielding — place grounded or VDD wires between sensitive nets, (3) Buffer insertion — break long nets into shorter segments with buffers, reducing coupling length, (4) Wire ordering — arrange nets to minimize worst-case coupling scenarios.\n\nAt the physical design stage: (1) Use non-default routing rules (wider wires, extra spacing) for critical nets, (2) Route sensitive nets on different metal layers when possible, (3) Use upper metal layers for long routes (thicker wires have less coupling per unit length).\n\nIn STA: set_max_transition on critical nets helps limit slew, which reduces crosstalk sensitivity. The tool can also apply SI-aware timing that considers actual aggressor activities.",
      },
      {
        id: "ct-4",
        question: "How does crosstalk analysis differ from timing analysis?",
        answer:
          "Timing analysis computes path delay and checks setup/hold constraints — it is a static, path-based analysis. Crosstalk analysis (SI analysis) considers the physical proximity and switching activity of neighboring nets — it is a net-based, noise-aware analysis.\n\nCrosstalk-aware STA (SI-aware timing) modifies the cell delay calculation by accounting for aggressor coupling. The tool adjusts the effective capacitance on each net based on actual neighbor switching. This can either improve or degrade timing compared to non-SI analysis.\n\nStandard STA (without SI) is optimistic for victim nets that slow down and pessimistic for victim nets that speed up. SI-aware STA gives more accurate results but requires parasitic data (SPEF/DSPF) and aggressor switching information. For signoff, SI-aware analysis is mandatory.",
      },
      {
        id: "ct-5",
        question: "What is a crosstalk-induced hold violation and how do you fix it?",
        answer:
          "Crosstalk-induced hold violation occurs when crosstalk from an aggressor slows down the victim net's transition, effectively increasing the data path delay on a hold-critical path. This extra delay can cause hold violation on paths that were clean without SI.\n\nFixing crosstalk hold violations: (1) Add delay buffers on the victim path to increase the data delay margin, (2) Reduce the aggressor's coupling — spacing, shielding, or buffering the aggressor, (3) Increase the hold margin through OCV derating or uncertainty.\n\nThe most targeted fix is to buffer the victim net to add intentional delay, ensuring the hold requirement is met even with crosstalk degradation. Aggressor-side fixes (spacing, shielding) are more general but may require re-routing.",
      },
    ],
  },
  {
    id: "sdc",
    title: "SDC Constraints",
    count: 5,
    questions: [
      {
        id: "sd-1",
        question: "What is SDC and what are its main constraint types?",
        answer:
          "SDC (Synopsys Design Constraints) is the industry-standard format for specifying timing, power, and area constraints. It uses Tcl commands to define the design's behavioral and timing requirements.\n\nMain constraint types: (1) Clock definitions — create_clock, create_generated_clock, (2) Input/output delays — set_input_delay, set_output_delay, (3) Timing exceptions — set_false_path, set_multicycle_path, set_max_delay, (4) Design rules — set_max_transition, set_max_capacitance, set_max_fanout, (5) Operating conditions — set_timing_derate, set_clock_uncertainty.\n\nSDC is read by synthesis, P&R, and STA tools. Consistent SDC across all tools ensures the design is optimized and verified against the same requirements.",
      },
      {
        id: "sd-2",
        question: "How do you define a clock in SDC? What about generated clocks?",
        answer:
          "A base clock is defined with: create_clock -name CLK -period 10 [get_ports clk]. This defines a 100 MHz clock at the clk port with 50% duty cycle (default). The period is in nanoseconds.\n\nA generated clock (derived from another clock) is defined with: create_generated_clock -name CLK_DIV2 -divide_by 2 -source [get_ports clk] [get_pins U Divider/Q]. This creates a clock that is a divided version of the source clock.\n\nGenerated clocks are used for: clock dividers, PLLs, clock muxes, and any logic that creates a new clock frequency. The -source pin must be the pin where the source clock is defined. The tool automatically computes the phase relationship from the source.",
      },
      {
        id: "sd-3",
        question: "What is the difference between set_input_delay and set_output_delay?",
        answer:
          "set_input_delay specifies the delay from the external world to the design's input port. It models the time data is available at the input relative to the clock edge. For example: set_input_delay 2.0 -clock CLK [get_ports data_in] means data_in arrives 2.0ns after the CLK edge.\n\nset_output_delay specifies the delay from the design's output port to the external world's capture register. It models how much time the external world needs after the output is driven. For example: set_output_delay 1.5 -clock CLK [get_ports data_out] means data_out must be valid 1.5ns before the next CLK edge.\n\nBoth constraints define the interface timing budget between the design and its environment. They are critical for chip-level timing closure where multiple blocks interact.",
      },
      {
        id: "sd-4",
        question: "What are set_clock_groups and when should you use them?",
        answer:
          "set_clock_groups defines groups of clocks that are asynchronous to each other. All paths between clocks in different groups are excluded from timing analysis (treated as false paths). For example: set_clock_groups -asynchronous -group {CLKA CLKB} -group {CLKC}.\n\nUse set_clock_groups for: (1) Async clock domain crossings — the most common use case, (2) Clock mux outputs — when a mux selects between unrelated clocks, (3) Test clocks vs functional clocks.\n\nAdvantages over set_false_path: (1) It handles all paths between groups automatically, not just specific start/end points, (2) It is more maintainable — adding new clocks to a group automatically gets the right exception, (3) It is less error-prone than listing individual false paths.",
      },
      {
        id: "sd-5",
        question: "How do you handle multiple operating modes in SDC?",
        answer:
          "Multiple operating modes (functional, test, sleep, etc.) are handled by reading different SDC files for each mode. Each mode has its own clock definitions, I/O constraints, and exceptions. The tool analyzes each mode separately and reports timing for each.\n\nIn practice: (1) Create separate SDC files per mode — func.sdc, test.sdc, sleep.sdc, (2) Read the appropriate SDC for each analysis run, (3) Use set_case_analysis to fix mode-select signals (e.g., test_mode = 0 for functional), (4) Use set_false_path between modes that are mutually exclusive.\n\nThe worst-case corner is typically the mode with the tightest constraints. For multi-mode multi-corner (MMMC) analysis, the tool crosses all modes with all corners to find the worst case.",
      },
    ],
  },
  {
    id: "advanced",
    title: "Advanced & Signoff",
    count: 5,
    questions: [
      {
        id: "ad-1",
        question: "What is MMMC (Multi-Mode Multi-Corner) analysis?",
        answer:
          "MMMC analysis evaluates timing across all combinations of operating modes and PVT corners. A mode defines the functional state (functional, test, sleep) with its own clocks and constraints. A corner defines the process/voltage/temperature condition (SS/0.72V/-40C, TT/0.8V/25C, FF/0.88V/125C).\n\nMMMC creates a matrix of analysis points. For each (mode, corner) pair, the tool applies the mode-specific SDC and the corner-specific library and reports timing. The worst slack across all analysis points is the signoff slack.\n\nThis is essential because a design that passes at TT/25C may fail at SS/-40C or FF/125C. MMMC ensures timing closure across all realistic operating conditions. Tools like PrimeTime support MMMC natively through scenario definitions.",
      },
      {
        id: "ad-2",
        question: "What is timing signoff and what does it guarantee?",
        answer:
          "Timing signoff is the formal verification that the design meets all timing constraints across all PVT corners and operating modes. It is the final step before tape-out, performed by the timing signoff team using golden STA tools (PrimeTime, Tempus).\n\nSignoff guarantees: (1) All setup paths have positive slack at the slowest corner, (2) All hold paths have positive slack at the fastest corner, (3) All design rule constraints (max_transition, max_capacitance) are met, (4) All timing exceptions are correctly applied.\n\nSignoff does NOT guarantee: (1) Functional correctness — that is verified by simulation/formal, (2) Signal integrity — that requires separate SI signoff, (3) Power — that requires power analysis. Timing signoff is one of several parallel signoff activities.",
      },
      {
        id: "ad-3",
        question: "What is timing derating and how do you set it?",
        answer:
          "Timing derating applies factors to cell delays to model on-chip variation. It is set using set_timing_derate in SDC. For example: set_timing_derate -late 1.05 on all cells (5% slower for setup), set_timing_derate -early 0.95 (5% faster for hold).\n\nThe derate values come from foundry recommendations or silicon characterization. Typical values: basic OCV: 1.05-1.10 late, 0.90-0.95 early. AOCV: depth/distance-dependent tables. POCV: statistical variance libraries.\n\nDerating is applied differently for setup and hold: setup applies late derating on launch path, early on capture. Hold applies early on launch, late on capture. The tool handles this automatically based on the check type.",
      },
      {
        id: "ad-4",
        question: "What is SI-aware timing and why is it needed for signoff?",
        answer:
          "SI-aware timing (crosstalk-aware timing) accounts for the impact of neighboring net switching on timing. It modifies cell delay calculations by considering actual aggressor coupling and switching activity. Without SI-aware analysis, timing results are optimistic for nets that slow down due to crosstalk.\n\nFor signoff, SI-aware timing is mandatory because: (1) Crosstalk delay can add 5-15% to cell delay on affected nets, (2) A path that meets timing without SI may violate with SI, (3) Foundries require SI-aware signoff for tape-out.\n\nSI-aware analysis requires: (1) Accurate parasitic data (SPEF/DSPF), (2) Aggressor switching information (from simulation or activity estimation), (3) SI-aware liberty models (CCS noise). The runtime is higher than standard STA but the accuracy is necessary.",
      },
      {
        id: "ad-5",
        question: "What is timing margin borrowing and how does it work?",
        answer:
          "Timing margin borrowing (also called slack sharing or cycle borrowing) allows a path with positive slack to lend some of its margin to a neighboring path with negative slack. This is common in multi-cycle paths or time-borrowing flip-flops.\n\nIn latch-based designs, the transparency window allows data to pass through during a portion of the clock cycle. If data arrives early, it is captured immediately (no borrowing). If data arrives during the transparency window, it 'borrows' time from the next cycle. The borrowed time reduces the margin available for the next cycle's logic.\n\nIn STA, time borrowing is modeled through latch constraint analysis. The tool tracks the borrow amount and ensures the total borrow across consecutive cycles does not exceed the cycle limit. Excessive borrowing cascades violations to downstream logic.",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Question Card Component                                            */
/* ------------------------------------------------------------------ */

function QuestionCard({
  question,
  topicTitle,
  index,
}: {
  question: Question;
  topicTitle: string;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-sm transition-all hover:border-slate-300">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3.5 p-4 sm:p-5 text-left transition-colors hover:bg-slate-50/70"
      >
        <span className="shrink-0 mt-0.5 w-6 h-6 rounded-md bg-blue-50 text-blue-700 text-xs font-mono font-bold flex items-center justify-center border border-blue-200/60">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0 pr-2">
          <span className="text-xs font-mono text-slate-400 block mb-1">
            {topicTitle}
          </span>
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
            {question.question}
          </h3>
        </div>
        <span className="shrink-0 mt-1 text-slate-400">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-blue-600" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-5 sm:px-6 sm:pb-6 pt-1 border-t border-slate-100 bg-slate-50/40">
          <div className="pl-3 sm:pl-4 border-l-2 border-blue-600 space-y-3 mt-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 font-mono">
              Engineering Answer
            </p>
            {question.answer.split("\n\n").map((para, i) => (
              <p
                key={i}
                className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal"
              >
                {para}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main STA Interview Questions Page                                  */
/* ------------------------------------------------------------------ */

export default function STAInterviewPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("all");

  const totalQuestions = TOPICS.reduce((acc, t) => acc + t.questions.length, 0);

  const filteredTopics = useMemo(() => {
    return TOPICS.map((topic) => {
      const matchesTopicFilter = selectedTopicId === "all" || topic.id === selectedTopicId;
      if (!matchesTopicFilter) return null;

      const matchingQuestions = topic.questions.filter((q) => {
        if (!searchQuery.trim()) return true;
        const qText = q.question.toLowerCase();
        const aText = q.answer.toLowerCase();
        const sText = searchQuery.toLowerCase();
        return qText.includes(sText) || aText.includes(sText);
      });

      if (matchingQuestions.length === 0) return null;

      return {
        ...topic,
        questions: matchingQuestions,
      };
    }).filter(Boolean) as Topic[];
  }, [searchQuery, selectedTopicId]);

  const matchingCount = filteredTopics.reduce((acc, t) => acc + t.questions.length, 0);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-8 space-y-6">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Practice Repository
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            55 STA Interview Questions &amp; Answers
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Exhaustive Static Timing Analysis interview preparation. Covering setup/hold closure, clock uncertainty, CRPR, crosstalk noise, multi-corner analysis, and SDC constraints.
          </p>
        </div>

        {/* Search & Topic Filters */}
        <div className="space-y-4 pt-2">
          {/* Search Box */}
          <div className="relative max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 55 questions... (e.g. CRPR, crosstalk, OCV, setup slack, jitter)"
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 placeholder:text-slate-400 shadow-sm"
            />
          </div>

          {/* Topic Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-xs">
            <button
              onClick={() => setSelectedTopicId("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap",
                selectedTopicId === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              )}
            >
              All Topics ({totalQuestions})
            </button>
            {TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setSelectedTopicId(topic.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap",
                  selectedTopicId === topic.id
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                )}
              >
                {topic.title} ({topic.count})
              </button>
            ))}
          </div>

          {/* Active Result Count */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-1">
            <span>
              Showing {matchingCount} of {totalQuestions} questions
            </span>
            {(searchQuery || selectedTopicId !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTopicId("all");
                }}
                className="text-blue-600 hover:underline font-semibold"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-10">
        {filteredTopics.map((topic) => (
          <div key={topic.id} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                {topic.title}
              </h2>
              <span className="text-xs text-slate-400 font-mono font-medium">
                {topic.questions.length} questions
              </span>
            </div>

            <div className="space-y-3">
              {topic.questions.map((q, idx) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  topicTitle={topic.title}
                  index={idx}
                />
              ))}
            </div>
          </div>
        ))}

        {filteredTopics.length === 0 && (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-xl p-8 space-y-3">
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-900">No matching questions found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn&apos;t find any questions matching &quot;{searchQuery}&quot;. Try broader terms like &quot;hold&quot;, &quot;clock&quot;, or &quot;SDC&quot;.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedTopicId("all");
              }}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Reset Search &amp; Filters
            </button>
          </div>
        )}
      </div>

      {/* Bottom Practice Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="font-display font-bold text-base text-slate-900">
            Want to test these concepts on real reports?
          </h3>
          <p className="text-xs text-slate-500">
            Head to the Engineering Lab to diagnose setup, hold, and clock skew violations on actual EDA outputs.
          </p>
        </div>
        <Link
          href="/engineering-lab"
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors shadow-sm shrink-0"
        >
          Open Engineering Lab <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
