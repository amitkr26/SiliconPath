// src/lib/video-references.ts
// Curated free video courses (NPTEL + YouTube playlists) mapped to learning paths.
// Single source of truth for the /learn/video-courses library, the
// "Companion video courses" cards on /learn/[path] pages, and the embedded
// videos on /academy/[track] pages. Add new sources here.

import type { TrackSlug } from "@/lib/academy/types";

export interface VideoCourseReference {
  id: string;
  title: string;
  url: string;
  source: "nptel" | "youtube";
  group: string;
  instructor: string;
  institute: string;
  /** Learn path slugs this course complements. Empty = grouped on the library page only. */
  paths: string[];
  /** True when the source is a supporting companion rather than the primary course for a path. */
  companion?: boolean;
  /** Academy track slugs this course is embedded on (see /academy/[track]). */
  academy?: TrackSlug[];
}

const NPTEL_BASE = "https://nptel.ac.in/courses/";

const NPTEL_META: Omit<VideoCourseReference, "source" | "url">[] = [
  // ── Digital Logic & RTL Design ────────────────────────────────────────────
  { id: "108105113", group: "Digital Logic & RTL Design", title: "Digital Circuits", instructor: "Prof. Santanu Chattopadhyay", institute: "IIT Kharagpur", paths: ["digital-electronics"], academy: ["digital-logic"] },
  { id: "117103064", group: "Digital Logic & RTL Design", title: "Digital Circuits", instructor: "Prof. Anil Mahanta, Prof. Roy Paily Palanthinkal", institute: "IIT Guwahati", paths: ["digital-electronics"], academy: ["digital-logic"] },
  { id: "117106086", group: "Digital Logic & RTL Design", title: "Digital Circuits and Systems", instructor: "Prof. S. Srinivasan", institute: "IIT Madras", paths: ["digital-electronics"] },
  { id: "117106114", group: "Digital Logic & RTL Design", title: "Digital Circuits and Systems", instructor: "Prof. Shankar Balachandran", institute: "IIT Madras", paths: ["digital-electronics"], academy: ["digital-logic"] },
  { id: "117105080", group: "Digital Logic & RTL Design", title: "Digital Systems Design", instructor: "Prof. D. Roychoudhury", institute: "IIT Kharagpur", paths: ["digital-electronics"], academy: ["digital-logic"] },
  { id: "117105078", group: "Digital Logic & RTL Design", title: "Digital Computer Organization", instructor: "Prof. P.K. Biswas", institute: "IIT Kharagpur", paths: [] },
  { id: "106105165", group: "Digital Logic & RTL Design", title: "Hardware modeling using verilog", instructor: "Prof. Indranil Sengupta", institute: "IIT Kharagpur", paths: ["verilog"], academy: ["verilog"] },
  { id: "108103179", group: "Digital Logic & RTL Design", title: "System Design Through VERILOG", instructor: "Prof. Shaik Rafi Ahamed", institute: "IIT Guwahati", paths: ["verilog"], academy: ["verilog", "rtl-design"] },
  { id: "106103229", group: "Digital Logic & RTL Design", title: "C-Based VLSI Design", instructor: "Prof. Chandan Karfa", institute: "IIT Guwahati", paths: ["verilog"], academy: ["verilog"] },
  // ── Verification, DFT & Formal ────────────────────────────────────────────
  { id: "117103125", group: "Verification, DFT & Formal", title: "VLSI Design Verification and test", instructor: "Dr. Santosh Biswas, Prof. Arnab Sarkar, Prof. Jatindra Kumar Deka", institute: "IIT Guwahati", paths: ["design-verification"], academy: ["systemverilog", "uvm"] },
  { id: "117105137", group: "Verification, DFT & Formal", title: "Digital VLSI Testing", instructor: "Prof. Santanu Chattopadhyay", institute: "IIT Kharagpur", paths: ["design-for-test"], academy: ["interview-prep"] },
  { id: "106103002", group: "Verification, DFT & Formal", title: "Formal Methods for System Verification", instructor: "Prof. Chandan Karfa", institute: "IIT Guwahati", paths: ["design-verification"], academy: ["uvm"] },
  { id: "106103182", group: "Verification, DFT & Formal", title: "Embedded Systems-Design Verification and Test", instructor: "Dr. Santosh Biswas, Prof. Arnab Sarkar, Prof. Jatindra Kumar Deka", institute: "IIT Guwahati", paths: ["design-verification"], academy: ["systemverilog"] },
  { id: "106106714", group: "Verification, DFT & Formal", title: "Automated Program Verification", instructor: "Prof. Kartik Nagar", institute: "IIT Madras", paths: ["design-verification"], academy: ["systemverilog"] },
  // ── Synthesis, Physical Design & Timing ───────────────────────────────────
  { id: "106102181", group: "Synthesis, Physical Design & Timing", title: "Synthesis of Digital Systems", instructor: "Prof. Preeti Ranjan Panda", institute: "IIT Delhi", paths: ["synthesis"], academy: ["rtl-design"] },
  { id: "117106109", group: "Synthesis, Physical Design & Timing", title: "Advanced Logic Synthesis", instructor: "Dhiraj Taneja", institute: "IIT Madras", paths: ["synthesis"], academy: ["rtl-design"] },
  { id: "106105161", group: "Synthesis, Physical Design & Timing", title: "VLSI Physical Design", instructor: "Prof. Indranil Sengupta", institute: "IIT Kharagpur", paths: ["physical-design"], academy: ["physical-design"] },
  { id: "108106191", group: "Synthesis, Physical Design & Timing", title: "VLSI Design Flow: RTL to GDS", instructor: "Prof. Sneh Saurabh", institute: "IIIT Delhi", paths: ["physical-design"], academy: ["physical-design"] },
  { id: "108107380", group: "Synthesis, Physical Design & Timing", title: "VLSI Physical Design with Timing Analysis", instructor: "Prof. Bishnu Prasad Das", institute: "IIT Roorkee", paths: ["physical-design", "static-timing-analysis"], academy: ["physical-design", "interview-prep"] },
  { id: "117101004", group: "Synthesis, Physical Design & Timing", title: "Advanced VLSI Design", instructor: "Prof. A.N. Chandorkar, Prof. D.K. Sharma, Prof. Sachin Patkar, Prof. Virendra Singh", institute: "IIT Bombay", paths: ["physical-design"], academy: ["physical-design"] },
  { id: "117101058", group: "Synthesis, Physical Design & Timing", title: "VLSI Design", instructor: "Prof. A.N. Chandorkar", institute: "IIT Bombay", paths: ["physical-design"], academy: ["physical-design"] },
  { id: "117106149", group: "Synthesis, Physical Design & Timing", title: "Design and Analysis of VLSI Subsystems", instructor: "Prof. Madhav Rao", institute: "IIIT Bangalore", paths: ["physical-design"], academy: ["physical-design"] },
  { id: "108105187", group: "Synthesis, Physical Design & Timing", title: "VLSI Interconnects", instructor: "Prof. Sarang Pendharker", institute: "IIT Kharagpur", paths: [] },
  // ── Low Power & VLSI Subsystems ───────────────────────────────────────────
  { id: "106105034", group: "Low Power & VLSI Subsystems", title: "Low Power VLSI Circuits & Systems", instructor: "Prof. Ajit Pal", institute: "IIT Kharagpur", paths: ["low-power-design-upf"] },
  { id: "117106092", group: "Low Power & VLSI Subsystems", title: "VLSI Circuits", instructor: "Prof. S. Srinivasan", institute: "IIT Madras", paths: [] },
  // ── Analog & Mixed-Signal ICs ─────────────────────────────────────────────
  { id: "117101105", group: "Analog & Mixed-Signal ICs", title: "CMOS Analog VLSI Design", instructor: "Prof. A.N. Chandorkar", institute: "IIT Bombay", paths: [] },
  { id: "108104193", group: "Analog & Mixed-Signal ICs", title: "Analog VLSI Design", instructor: "Prof. Imon Mondal", institute: "IIT Kanpur", paths: [] },
  { id: "117106030", group: "Analog & Mixed-Signal ICs", title: "Analog IC Design", instructor: "Dr. Nagendra Krishnapura", institute: "IIT Madras", paths: [] },
  { id: "108106105", group: "Analog & Mixed-Signal ICs", title: "Analog IC Design", instructor: "Prof. S. Aniruddhan", institute: "IIT Madras", paths: [] },
  { id: "117101106", group: "Analog & Mixed-Signal ICs", title: "Analog Circuits", instructor: "Prof. A.N. Chandorkar", institute: "IIT Bombay", paths: [] },
  { id: "117107094", group: "Analog & Mixed-Signal ICs", title: "Analog Circuits", instructor: "Dr. Pramod Agarwal", institute: "IIT Roorkee", paths: [] },
  { id: "108102112", group: "Analog & Mixed-Signal ICs", title: "Analog Electronic Circuits", instructor: "Prof. Shouribrata Chatterjee", institute: "IIT Delhi", paths: [] },
  { id: "108105158", group: "Analog & Mixed-Signal ICs", title: "Analog Electronic Circuits", instructor: "Prof. Pradip Mandal", institute: "IIT Kharagpur", paths: [] },
  { id: "117108107", group: "Analog & Mixed-Signal ICs", title: "Analog Circuits and Systems 1", instructor: "Prof. K. Radhakrishna Rao", institute: "IISc Bangalore", paths: [] },
  { id: "117108486", group: "Analog & Mixed-Signal ICs", title: "Analog Circuits and Systems", instructor: "Prof. K. Radhakrishna Rao", institute: "IIT Madras", paths: [] },
  { id: "117106034", group: "Analog & Mixed-Signal ICs", title: "VLSI Data Conversion Circuits", instructor: "Dr. Shanthi Pavan", institute: "IIT Madras", paths: [] },
  { id: "117102012", group: "Analog & Mixed-Signal ICs", title: "RF Integrated Circuits", instructor: "Dr. Shouribrata Chatterjee", institute: "IIT Delhi", paths: [] },
  { id: "117106087", group: "Analog & Mixed-Signal ICs", title: "Electronics for Analog Signal Processing - I", instructor: "Prof. K. Radhakrishna Rao", institute: "IIT Madras", paths: [] },
  { id: "117106088", group: "Analog & Mixed-Signal ICs", title: "Electronics for Analog Signal Processing - II", instructor: "Prof. K. Radhakrishna Rao", institute: "IIT Madras", paths: [] },
  { id: "117108038", group: "Analog & Mixed-Signal ICs", title: "Circuits for Analog System Design", instructor: "Prof. M.K. Gunasekaran", institute: "IISc Bangalore", paths: [] },
  { id: "117106148", group: "Analog & Mixed-Signal ICs", title: "Circuit Analysis for Analog Designers", instructor: "Prof. Shanthi Pavan", institute: "IIT Madras", paths: [] },
  { id: "117101119", group: "Analog & Mixed-Signal ICs", title: "Microwave Integrated Circuits", instructor: "Prof. Jayanta Mukherjee", institute: "IIT Bombay", paths: [] },
  // ── Semiconductor Devices & Fabrication ───────────────────────────────────
  { id: "117106093", group: "Semiconductor Devices & Fabrication", title: "VLSI Technology", instructor: "Prof. Nandita Dasgupta", institute: "IIT Madras", paths: [] },
  { id: "117102061", group: "Semiconductor Devices & Fabrication", title: "Semiconductor Devices", instructor: "Dr. G.S. Visweswaran", institute: "IIT Delhi", paths: [] },
  { id: "117106033", group: "Semiconductor Devices & Fabrication", title: "Semiconductor Device Modeling", instructor: "Prof. S. Karmalkar", institute: "IIT Madras", paths: [] },
  { id: "117106091", group: "Semiconductor Devices & Fabrication", title: "Solid State Devices", instructor: "Prof. S. Karmalkar", institute: "IIT Madras", paths: [] },
  { id: "117104071", group: "Semiconductor Devices & Fabrication", title: "High Speed Semiconductor Devices", instructor: "Prof. Anjan Ghosh", institute: "IIT Kanpur", paths: [] },
  { id: "117106089", group: "Semiconductor Devices & Fabrication", title: "High Speed Devices and Circuits", instructor: "Prof. K.N. Bhat", institute: "IIT Madras", paths: [] },
  { id: "117108047", group: "Semiconductor Devices & Fabrication", title: "Nanoelectronics: Devices and Materials", instructor: "Dr. Navakanta Bhat, Dr. S.A. Shivashankar, Prof. K.N. Bhat", institute: "IISc Bangalore", paths: [] },
  { id: "117107149", group: "Semiconductor Devices & Fabrication", title: "Physics of Nanoscale Devices", instructor: "Prof. Vishvendra Singh Poonia", institute: "IIT Roorkee", paths: [] },
  { id: "102108078", group: "Semiconductor Devices & Fabrication", title: "Fundamentals of micro and nanofabrication", instructor: "Prof. Shankar Selvaraja, Prof. Sushobhan Avasthi", institute: "IISc Bangalore", paths: [] },
  { id: "117103066", group: "Semiconductor Devices & Fabrication", title: "IC Technology", instructor: "Prof. Indrajit Chakraborty, Prof. Roy Paily Palanthinkal", institute: "IIT Guwahati", paths: [] },
  { id: "108104865", group: "Semiconductor Devices & Fabrication", title: "Basic Overview of Semiconductor Device Processing and IC Fabrication", instructor: "Prof. S. Sundar Kumar Iyer", institute: "IIT Kanpur", paths: [] },
  // ── Embedded, Computer Architecture & Programming ─────────────────────────
  { id: "117104072", group: "Embedded, Computer Architecture & Programming", title: "Microcontrollers and Applications", instructor: "Dr. S.P. Das", institute: "IIT Kanpur", paths: [] },
  { id: "117108040", group: "Embedded, Computer Architecture & Programming", title: "Digital System design with PLDs and FPGAs", instructor: "Prof. Kuruvilla Varghese", institute: "IISc Bangalore", paths: [] },
  { id: "117106112", group: "Embedded, Computer Architecture & Programming", title: "Embedded Software Testing", instructor: "MADHUKESHWARA H M", institute: "IIT Madras", paths: [] },
  { id: "106102157", group: "Embedded, Computer Architecture & Programming", title: "Computer Architecture", instructor: "Prof. Smruti Ranjan Sarangi", institute: "IIT Delhi", paths: [] },
  { id: "106103184", group: "Embedded, Computer Architecture & Programming", title: "Multi-Core Computer Architecture", instructor: "Prof. John Jose", institute: "IIT Guwahati", paths: [] },
  { id: "106105163", group: "Embedded, Computer Architecture & Programming", title: "Computer architecture and organization", instructor: "Prof. Indranil Sengupta, Prof. Kamalika Datta", institute: "IIT Kharagpur", paths: [] },
  { id: "106105214", group: "Embedded, Computer Architecture & Programming", title: "Operating System Fundamentals", instructor: "Prof. Santanu Chattopadhyay", institute: "IIT Kharagpur", paths: [] },
  { id: "106104128", group: "Embedded, Computer Architecture & Programming", title: "Introduction to programming in C", instructor: "Prof. Satyadev Nandakumar", institute: "IIT Kanpur", paths: [] },
  { id: "106105171", group: "Embedded, Computer Architecture & Programming", title: "Problem Solving through Programming in C", instructor: "Prof. Anupam Basu", institute: "IIT Kharagpur", paths: [] },
  { id: "117106113", group: "Embedded, Computer Architecture & Programming", title: "Linux Programming & Scripting", instructor: "Anand Iyer", institute: "IIT Madras", paths: ["linux-for-vlsi"] },
  // ── Core ECE Fundamentals ──────────────────────────────────────────────────
  { id: "117101055", group: "Core ECE Fundamentals", title: "Signals and Systems", instructor: "Prof. V.M. Gadre", institute: "IIT Bombay", paths: [] },
  { id: "117104074", group: "Core ECE Fundamentals", title: "Signals and Systems", instructor: "Prof. K.S. Venkatesh", institute: "IIT Kanpur", paths: [] },
  { id: "117102060", group: "Core ECE Fundamentals", title: "Digital Signal Processing", instructor: "Prof. S.C. Dutta Roy", institute: "IIT Delhi", paths: [] },
  { id: "117104070", group: "Core ECE Fundamentals", title: "Digital Signal Processing", instructor: "Prof. Govind Sharma", institute: "IIT Kanpur", paths: [] },
  { id: "117103063", group: "Core ECE Fundamentals", title: "Basic Electronics", instructor: "Prof. Chitralekha Mahanta", institute: "IIT Guwahati", paths: [] },
  { id: "117107095", group: "Core ECE Fundamentals", title: "Basic Electronics", instructor: "Dr. Pramod Agarwal", institute: "IIT Roorkee", paths: [] },
  { id: "108102001", group: "Core ECE Fundamentals", title: "Network Theory", instructor: "Prof. Shouri Chatterjee", institute: "IIT Delhi", paths: [] },
];

export const NPTEL_COURSES: VideoCourseReference[] = NPTEL_META.map((c) => ({ ...c, source: "nptel" as const, url: `${NPTEL_BASE}${c.id}` }));

export const YOUTUBE_PLAYLISTS: VideoCourseReference[] = [
  {
    id: "PLBlnK6fEyqRjMH3mWf6kwqiTbT798eAOm",
    title: "Digital Electronics",
    url: "https://www.youtube.com/playlist?list=PLBlnK6fEyqRjMH3mWf6kwqiTbT798eAOm",
    source: "youtube",
    group: "Digital Logic & RTL Design",
    instructor: "Neso Academy",
    institute: "Neso Academy",
    paths: ["digital-electronics"],
    academy: ["digital-logic"],
  },
  {
    id: "PLBlnK6fEyqRgVsLjXV5gvusRhGAvqBOGn",
    title: "VHDL Programming",
    url: "https://www.youtube.com/playlist?list=PLBlnK6fEyqRgVsLjXV5gvusRhGAvqBOGn",
    source: "youtube",
    group: "Digital Logic & RTL Design",
    instructor: "Neso Academy",
    institute: "Neso Academy",
    paths: ["verilog"],
    academy: ["verilog"],
    companion: true,
  },
  {
    id: "PLBlnK6fEyqRggZZgYpPMUxdY1CYkZtARR",
    title: "C Programming",
    url: "https://www.youtube.com/playlist?list=PLBlnK6fEyqRggZZgYpPMUxdY1CYkZtARR",
    source: "youtube",
    group: "Embedded, Computer Architecture & Programming",
    instructor: "Neso Academy",
    institute: "Neso Academy",
    paths: ["linux-for-vlsi"],
    companion: true,
  },
  {
    id: "PL1h5a0eaDD3pimcMlzW15RpW02HPzIziL",
    title: "VLSI Physical Design Full Course",
    url: "https://www.youtube.com/playlist?list=PL1h5a0eaDD3pimcMlzW15RpW02HPzIziL",
    source: "youtube",
    group: "Synthesis, Physical Design & Timing",
    instructor: "VLSI Academy",
    institute: "VLSI Academy",
    paths: ["physical-design"],
    academy: ["physical-design"],
  },
];

export const VIDEO_COURSE_GROUPS = [
  "Digital Logic & RTL Design",
  "Verification, DFT & Formal",
  "Synthesis, Physical Design & Timing",
  "Low Power & VLSI Subsystems",
  "Analog & Mixed-Signal ICs",
  "Semiconductor Devices & Fabrication",
  "Embedded, Computer Architecture & Programming",
  "Core ECE Fundamentals",
];

export const VIDEO_COURSES: VideoCourseReference[] = [...NPTEL_COURSES, ...YOUTUBE_PLAYLISTS];

/** All video references that complement a given learning path slug. */
export function videoCoursesForPath(pathSlug: string): VideoCourseReference[] {
  return VIDEO_COURSES.filter((c) => c.paths.includes(pathSlug));
}

/** All video references embedded on a given academy track page. */
export function videoCoursesForAcademy(trackSlug: string): VideoCourseReference[] {
  return VIDEO_COURSES.filter((c) => c.academy?.includes(trackSlug as TrackSlug));
}