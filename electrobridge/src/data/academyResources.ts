/**
 * Curated, confidence-rated learning resources for the VLSI Academy tracks.
 * Sourced from the maintainer's trusted_sources_v2 catalog.
 *
 * `confidence` reflects how strongly the source is trusted:
 *   - 'high'         : verified free + high quality, safe to feature
 *   - 'conditional'  : partly paid or offering-dependent; verify each item
 *   - 'unverified'   : do NOT feature until a human review pass confirms it
 */

export type ResourceType =
  | "course"
  | "tutorial"
  | "tutorial+lab"
  | "reference"
  | "article"
  | "workshop"
  | "tool+docs"
  | "interactive-practice";

export type Difficulty =
  | "beginner"
  | "beginner-intermediate"
  | "intermediate"
  | "intermediate-advanced"
  | "advanced";

export type Confidence = "high" | "conditional" | "unverified";

export interface LearningResource {
  name: string;
  url: string;
  type: ResourceType;
  topicTags: string[];
  difficulty: Difficulty;
  confidence: Confidence;
  notes?: string;
}

export interface YouTubeChannel {
  name: string;
  url: string;
  region: string;
  topicTags: string[];
  difficulty: string;
  confidence: Confidence;
  notes?: string;
}

export interface FreeTool {
  name: string;
  url: string;
  type: string;
  notes: string;
  confidence: Confidence;
}

// Track 1 + 2: Digital Design / RTL foundations
export const TRACK_DIGITAL_RTL: LearningResource[] = [
  {
    name: "NPTEL – Digital Circuits (IIT Kharagpur, Prof. Santanu Chattopadhyay)",
    url: "https://onlinecourses.nptel.ac.in/",
    type: "course",
    topicTags: ["digital-logic", "boolean-algebra", "combinational", "sequential"],
    difficulty: "beginner",
    confidence: "high",
  },
  {
    name: "NPTEL – Hardware Modeling using Verilog (IIT Kharagpur, Prof. Indranil Sengupta)",
    url: "https://onlinecourses.nptel.ac.in/",
    type: "course",
    topicTags: ["verilog", "hdl", "rtl"],
    difficulty: "beginner",
    confidence: "high",
  },
  {
    name: "NPTEL – Digital Design with Verilog (IIT Guwahati, Prof. Chandan Karfa)",
    url: "https://onlinecourses.nptel.ac.in/noc24_cs61/preview",
    type: "course",
    topicTags: ["verilog", "fsm", "rtl", "digital-design"],
    difficulty: "beginner",
    confidence: "high",
  },
  {
    name: "ChipVerify – Verilog & Digital Design",
    url: "https://chipverify.com/",
    type: "tutorial+lab",
    topicTags: ["verilog", "digital-design", "rtl-synthesis"],
    difficulty: "beginner-intermediate",
    confidence: "high",
  },
  {
    name: "ASIC World – Verilog Reference",
    url: "http://www.asic-world.com/verilog/",
    type: "reference",
    topicTags: ["verilog", "syntax-reference"],
    difficulty: "beginner-intermediate",
    confidence: "high",
  },
  {
    name: "HDLBits",
    url: "https://hdlbits.01xz.net/",
    type: "interactive-practice",
    topicTags: ["verilog", "practice-problems", "combinational", "sequential", "fsm"],
    difficulty: "beginner-intermediate",
    confidence: "high",
    notes: "Auto-graded interactive Verilog exercises. Ideal for day-end lab tasks.",
  },
];

// Track 3 + 4: Verification (SystemVerilog / UVM)
export const TRACK_VERIFICATION: LearningResource[] = [
  {
    name: "ChipVerify – SystemVerilog & UVM",
    url: "https://chipverify.com/systemverilog",
    type: "tutorial+lab",
    topicTags: ["systemverilog", "oop", "coverage", "assertions"],
    difficulty: "intermediate",
    confidence: "high",
  },
  {
    name: "ChipVerify – UVM Tutorial",
    url: "https://chipverify.com/uvm/",
    type: "tutorial",
    topicTags: ["uvm", "testbench", "verification"],
    difficulty: "intermediate-advanced",
    confidence: "high",
  },
  {
    name: "Verification Guide – UVM Tutorial",
    url: "https://verificationguide.com/uvm/uvm-tutorial/",
    type: "tutorial",
    topicTags: ["uvm", "sequences", "config-db"],
    difficulty: "intermediate-advanced",
    confidence: "high",
  },
  {
    name: "VLSIVerify – SystemVerilog",
    url: "https://vlsiverify.com/systemverilog/",
    type: "tutorial",
    topicTags: ["systemverilog", "verification"],
    difficulty: "intermediate",
    confidence: "high",
  },
  {
    name: "Doulos Knowhow – UVM Verification Primer",
    url: "https://www.doulos.com/knowhow/systemverilog/uvm/uvm-verification-primer/",
    type: "article",
    topicTags: ["uvm", "methodology", "coverage", "constrained-random"],
    difficulty: "advanced",
    confidence: "high",
  },
  {
    name: "Verification Academy (Siemens EDA)",
    url: "https://verificationacademy.com/",
    type: "course",
    topicTags: ["uvm", "systemverilog", "coverage", "formal-verification", "methodology"],
    difficulty: "intermediate-advanced",
    confidence: "conditional",
    notes: "Industry-standard, free registration for some content. Confirm which sections are free.",
  },
];

// Track 6: Physical Design / Backend
export const TRACK_PHYSICAL_DESIGN: LearningResource[] = [
  {
    name: "NPTEL – VLSI Design Flow: RTL to GDS (IIIT Delhi, Prof. Sneh Saurabh)",
    url: "https://nptel.ac.in/courses/108106191",
    type: "course",
    topicTags: ["physical-design", "rtl-to-gds", "sta"],
    difficulty: "advanced",
    confidence: "high",
  },
  {
    name: "OpenLane (open-source RTL-to-GDSII flow)",
    url: "https://github.com/The-OpenROAD-Project/OpenLane",
    type: "tool+docs",
    topicTags: ["openlane", "openroad", "yosys", "sky130"],
    difficulty: "advanced",
    confidence: "high",
  },
  {
    name: "OpenROAD Project Documentation",
    url: "https://openroad.readthedocs.io/",
    type: "tool+docs",
    topicTags: ["place-and-route", "openroad", "physical-design", "sta"],
    difficulty: "advanced",
    confidence: "high",
  },
  {
    name: "SkyWater Sky130 PDK Documentation",
    url: "https://skywater-pdk.readthedocs.io/",
    type: "reference",
    topicTags: ["sky130", "pdk", "process-design-kit"],
    difficulty: "advanced",
    confidence: "high",
  },
  {
    name: "VSD – Advanced Physical Design using OpenLANE/Sky130",
    url: "https://www.vlsisystemdesign.com/advanced-physical-design-using-openlane-sky130/",
    type: "workshop",
    topicTags: ["openlane", "sky130", "place-and-route"],
    difficulty: "advanced",
    confidence: "conditional",
    notes: "VSD is largely paid. Verify each specific video is free/public before featuring.",
  },
];

export const VERIFIED_CHANNELS: YouTubeChannel[] = [
  {
    name: "Neso Academy",
    url: "https://www.youtube.com/c/nesoacademy",
    region: "India",
    topicTags: ["digital-logic", "digital-electronics", "foundations"],
    difficulty: "beginner",
    confidence: "high",
    notes: "Strong for foundational digital electronics concepts.",
  },
  {
    name: "Nandland (Russell Merrick)",
    url: "https://www.youtube.com/c/Nandland",
    region: "USA",
    topicTags: ["fpga", "verilog", "vhdl", "beginner-hdl"],
    difficulty: "beginner",
    confidence: "high",
    notes: "Well-reviewed beginner Verilog/VHDL tutorials.",
  },
  {
    name: "VLSI System Design (Kunal Ghosh)",
    url: "https://www.youtube.com/c/VLSISystemDesign",
    region: "India",
    topicTags: ["physical-design", "openlane", "sky130", "risc-v"],
    difficulty: "intermediate-advanced",
    confidence: "conditional",
    notes: "Real credibility but content mix includes paid material. Verify per-video.",
  },
];

export const FREE_TOOLS: FreeTool[] = [
  {
    name: "EDA Playground",
    url: "https://www.edaplayground.com/",
    type: "browser-simulator",
    notes: "Free browser-based Verilog/SystemVerilog simulation, no install.",
    confidence: "high",
  },
  {
    name: "Icarus Verilog + GTKWave",
    url: "http://iverilog.icarus.com/",
    type: "local-tool",
    notes: "Free open-source simulator + waveform viewer.",
    confidence: "high",
  },
  {
    name: "Verilator",
    url: "https://www.veripool.org/verilator/",
    type: "local-tool",
    notes: "High-performance, industry-used simulator for advanced capstone work.",
    confidence: "high",
  },
  {
    name: "Yosys Open SYnthesis Suite",
    url: "https://yosyshq.net/yosys/",
    type: "local-tool",
    notes: "Open-source synthesis engine underlying OpenLane.",
    confidence: "high",
  },
];
