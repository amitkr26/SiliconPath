export const TRACK_1_RESOURCES = [
  {
    name: "NPTEL - Digital Circuits (IIT Kharagpur, Prof. Santanu Chattopadhyay)",
    url: "https://onlinecourses.nptel.ac.in/",
    type: "course",
    topic_tags: ["digital-logic", "boolean-algebra", "combinational", "sequential"],
    difficulty: "beginner",
    confidence: "high"
  },
  {
    name: "NPTEL - Hardware Modeling using Verilog (IIT Kharagpur, Prof. Indranil Sengupta)",
    url: "https://onlinecourses.nptel.ac.in/",
    type: "course",
    topic_tags: ["verilog", "hdl", "rtl"],
    difficulty: "beginner",
    confidence: "high"
  },
  {
    name: "NPTEL - Digital Design with Verilog (IIT Guwahati, Prof. Chandan Karfa)",
    url: "https://onlinecourses.nptel.ac.in/noc24_cs61/preview",
    type: "course",
    topic_tags: ["verilog", "fsm", "rtl", "digital-design"],
    difficulty: "beginner",
    confidence: "high"
  },
  {
    name: "ChipVerify - Verilog & Digital Design",
    url: "https://chipverify.com/",
    type: "tutorial+lab",
    topic_tags: ["verilog", "digital-design", "rtl-synthesis"],
    difficulty: "beginner-intermediate",
    confidence: "high"
  },
  {
    name: "ASIC World - Verilog Reference",
    url: "http://www.asic-world.com/verilog/",
    type: "reference",
    topic_tags: ["verilog", "syntax-reference"],
    difficulty: "beginner-intermediate",
    confidence: "high"
  },
  {
    name: "HDLBits (01xz)",
    url: "https://hdlbits.01xz.net/",
    type: "interactive-practice",
    topic_tags: ["verilog", "practice-problems", "combinational", "sequential", "fsm"],
    difficulty: "beginner-intermediate",
    confidence: "high",
    notes: "Free, widely-used interactive Verilog exercise site with auto-graded problems — excellent fit for the day-end coding/lab task component, not just a video substitute."
  },
  {
    name: "NPTEL - Digital Systems Design (additional IIT course; verify current URL before use)",
    url: "https://onlinecourses.nptel.ac.in/",
    type: "course",
    topic_tags: ["digital-logic", "digital-systems"],
    difficulty: "beginner",
    confidence: "medium",
    notes: "NPTEL runs multiple digital-systems courses across offering cycles — confirm the current active course URL/instructor before wiring in, since NPTEL course URLs change per semester offering."
  }
];

export const TRACK_2_RESOURCES = [
  {
    name: "ChipVerify - SystemVerilog & UVM",
    url: "https://chipverify.com/systemverilog",
    type: "tutorial+lab",
    topic_tags: ["systemverilog", "oop", "coverage", "assertions"],
    difficulty: "intermediate",
    confidence: "high"
  },
  {
    name: "ChipVerify - UVM Tutorial",
    url: "https://chipverify.com/uvm/",
    type: "tutorial",
    topic_tags: ["uvm", "testbench", "verification"],
    difficulty: "intermediate-advanced",
    confidence: "high"
  },
  {
    name: "Verification Guide - UVM Tutorial",
    url: "https://verificationguide.com/uvm/uvm-tutorial/",
    type: "tutorial",
    topic_tags: ["uvm", "sequences", "config-db"],
    difficulty: "intermediate-advanced",
    confidence: "high"
  },
  {
    name: "VLSIVerify - SystemVerilog",
    url: "https://vlsiverify.com/systemverilog/",
    type: "tutorial",
    topic_tags: ["systemverilog", "verification"],
    difficulty: "intermediate",
    confidence: "high"
  },
  {
    name: "Doulos Knowhow - UVM Verification Primer",
    url: "https://www.doulos.com/knowhow/systemverilog/uvm/uvm-verification-primer/",
    type: "article",
    topic_tags: ["uvm", "methodology", "coverage", "constrained-random"],
    difficulty: "advanced",
    confidence: "high"
  },
  {
    name: "Verification Academy (Siemens EDA)",
    url: "https://verificationacademy.com/",
    type: "course+article",
    topic_tags: ["uvm", "systemverilog", "coverage", "formal-verification", "methodology"],
    difficulty: "intermediate-advanced",
    confidence: "high",
    notes: "Industry-standard free educational resource run by Siemens EDA (formerly Mentor Graphics) specifically for verification methodology — directly addresses the previously-identified UVM content gap. Free registration required for some content; confirm which sections are genuinely free before use."
  },
  {
    name: "Doulos Knowhow - SystemVerilog for Verification",
    url: "https://www.doulos.com/knowhow/systemverilog/",
    type: "article",
    topic_tags: ["systemverilog", "oop", "classes"],
    difficulty: "intermediate",
    confidence: "high"
  }
];

export const TRACK_3_RESOURCES = [
  {
    name: "NPTEL - VLSI Design Flow: RTL to GDS (IIIT Delhi, Prof. Sneh Saurabh)",
    url: "https://nptel.ac.in/courses/108106191",
    type: "course",
    topic_tags: ["physical-design", "rtl-to-gds", "sta"],
    difficulty: "advanced",
    confidence: "high"
  },
  {
    name: "VSD - Advanced Physical Design using OpenLANE/Sky130 (workshop material)",
    url: "https://www.vlsisystemdesign.com/advanced-physical-design-using-openlane-sky130/",
    type: "workshop",
    topic_tags: ["openlane", "sky130", "place-and-route", "physical-design"],
    difficulty: "advanced",
    confidence: "low-conditional",
    notes: "VSD's current business model is largely paid (Udemy courses, VSD-IAT platform). Do NOT auto-trust this whole channel/workshop as free — verify each specific piece of content is genuinely free and hosted on public YouTube (not gated behind their paid LMS) before including any individual video."
  },
  {
    name: "OpenLane (open-source RTL-to-GDSII flow)",
    url: "https://github.com/The-OpenROAD-Project/OpenLane",
    type: "tool+docs",
    topic_tags: ["openlane", "openroad", "yosys", "sky130"],
    difficulty: "advanced",
    confidence: "high"
  },
  {
    name: "OpenROAD Project Documentation",
    url: "https://openroad.readthedocs.io/",
    type: "tool+docs",
    topic_tags: ["place-and-route", "openroad", "physical-design", "sta"],
    difficulty: "advanced",
    confidence: "high",
    notes: "Official documentation for the underlying place-and-route engine used by OpenLane — good pairing for hands-on capstone work in Track 3."
  },
  {
    name: "SkyWater Sky130 PDK Documentation",
    url: "https://skywater-pdk.readthedocs.io/",
    type: "reference",
    topic_tags: ["sky130", "pdk", "process-design-kit"],
    difficulty: "advanced",
    confidence: "high",
    notes: "Official open-source PDK docs — the actual process design kit referenced throughout the Track 3 OpenLane/Sky130 flow."
  }
];

export const VERIFIED_CHANNELS = [
  {
    name: "VLSI System Design (Kunal Ghosh)",
    url: "https://www.youtube.com/c/VLSISystemDesign",
    region: "India",
    topic_tags: ["physical-design", "openlane", "sky130", "risc-v", "backend-flow"],
    difficulty: "intermediate-advanced",
    confidence: "medium-conditional",
    notes: "Founder of VSD, real credibility in the space, but current content mix includes significant paid material. Same caveat as the Track 3 workshop entry — verify individual video free/public status before trusting, do not treat the whole channel as auto-trusted."
  },
  {
    name: "Nandland (Russell Merrick)",
    url: "https://www.youtube.com/c/Nandland",
    region: "USA",
    topic_tags: ["fpga", "verilog", "vhdl", "beginner-hdl"],
    difficulty: "beginner",
    confidence: "high",
    notes: "US-based, published FPGA book (No Starch Press), well-reviewed beginner Verilog/VHDL tutorials. Good for international perspective."
  },
  {
    name: "Neso Academy",
    url: "https://www.youtube.com/c/nesoacademy",
    region: "India",
    topic_tags: ["digital-logic", "digital-electronics", "foundations"],
    difficulty: "beginner",
    confidence: "high",
    notes: "Widely recognized general digital electronics/CS channel, strong for foundational concepts."
  },
  {
    name: "Semiconductor Engineering (SemiEngineering)",
    url: "https://www.youtube.com/c/SemiconductorEngineering",
    region: "USA",
    topic_tags: ["semiconductor", "industry-news", "manufacturing", "process"],
    difficulty: "intermediate",
    confidence: "high",
    notes: "Leading semiconductor industry news and analysis channel. Strong for understanding real-world VLSI industry trends."
  },
  {
    name: "Asianometry",
    url: "https://www.youtube.com/@asianometry",
    region: "USA",
    topic_tags: ["semiconductor", "industry-history", "manufacturing", "supply-chain"],
    difficulty: "beginner-intermediate",
    confidence: "high",
    notes: "Excellent in-depth analysis of semiconductor industry, manufacturing, and geopolitics. Good supplementary context for VLSI students."
  }
];

export const FREE_TOOLS = [
  {
    name: "EDA Playground",
    url: "https://www.edaplayground.com/",
    type: "browser-simulator",
    notes: "Free browser-based Verilog/SystemVerilog simulation, no install needed",
    confidence: "high"
  },
  {
    name: "Icarus Verilog + GTKWave",
    url: "http://iverilog.icarus.com/",
    type: "local-tool",
    notes: "Free open-source simulator + waveform viewer",
    confidence: "high"
  },
  {
    name: "ChipVerify in-browser Lab",
    url: "https://chipverify.com/",
    type: "browser-simulator",
    notes: "Synthesize with Yosys + Sky130 PDK directly in browser",
    confidence: "high"
  },
  {
    name: "Verilator",
    url: "https://www.veripool.org/verilator/",
    type: "local-tool",
    notes: "Free, open-source, high-performance Verilog/SystemVerilog simulator — industry-used, good for more advanced Track 2/3 capstone work beyond what EDA Playground free tier easily handles.",
    confidence: "high"
  },
  {
    name: "Yosys Open SYnthesis Suite",
    url: "https://yosyshq.net/yosys/",
    type: "local-tool",
    notes: "Free open-source Verilog synthesis tool — the actual synthesis engine underlying the OpenLane flow, useful standalone for Track 1/3 synthesis exercises.",
    confidence: "high"
  }
];
