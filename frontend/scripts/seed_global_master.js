const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://aqauempuwmbizqoaolop.supabase.co";
const supabaseServiceRoleKey = "REDACTED_SUPABASE_SECRET_DB1_OLD";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const GLOBAL_MASTER_OPPORTUNITIES = [
  // 1. UNITED STATES (NASA, CERN, IMEC, MIT)
  {
    title: "NASA JPL Postdoc - Spacecraft Avionics & RISC-V Processor",
    slug: "nasa-jpl-postdoc-spacecraft-avionics-riscv-2026",
    category: "fellowship",
    location: "Pasadena, California, USA",
    salary_range: "$75,000 - $95,000/year",
    deadline: "2026-10-05",
    eligibility: "PhD in EE / Aerospace / Computer Architecture.",
    description: "Jet Propulsion Laboratory (JPL) research position on space-grade radiation-tolerant RISC-V microarchitectures, triple modular redundancy (TMR), and CubeSat payload electronics.",
    apply_url: "https://nasa.gov/careers",
    source_url: "https://nasa.gov",
    verification_status: "verified",
    is_active: true
  },
  {
    title: "IMEC Postdoc - 1nm CMOS Nanosheet & EUV Lithography",
    slug: "imec-postdoc-1nm-cmos-nanosheet-euv-lithography-2026",
    category: "fellowship",
    location: "Leuven, Belgium",
    salary_range: "€48,000 - €62,000/year",
    deadline: "2026-09-30",
    eligibility: "PhD in Nanoelectronics / Semiconductor Physics.",
    description: "IMEC Belgium research on sub-1nm GAA Nanosheet transistors, High-NA EUV lithography resists, 3D wafer bonding, and backside power delivery network (BSPDN).",
    apply_url: "https://imec-int.com/en/careers",
    source_url: "https://imec-int.com",
    verification_status: "verified",
    is_active: true
  },
  {
    title: "CERN Doctoral Student Program - High Energy Physics ASICs",
    slug: "cern-doctoral-student-program-high-energy-physics-asics-2026",
    category: "phd",
    location: "Geneva, Switzerland",
    salary_range: "3,765 CHF/month",
    deadline: "2026-10-20",
    eligibility: "Enrolled in PhD program in Physics / EE / Microelectronics.",
    description: "Development of radiation-hardened ASIC detector readouts for High-Luminosity Large Hadron Collider (HL-LHC) particle physics experiments.",
    apply_url: "https://home.cern/careers",
    source_url: "https://home.cern",
    verification_status: "verified",
    is_active: true
  },
  {
    title: "MIT EECS Postdoctoral Associate - AI Compute-In-Memory",
    slug: "mit-eecs-postdoctoral-associate-ai-compute-in-memory-2026",
    category: "fellowship",
    location: "Cambridge, Massachusetts, USA",
    salary_range: "$72,000 - $85,000/year",
    deadline: "2026-10-15",
    eligibility: "PhD in Electrical Engineering & Computer Science.",
    description: "MIT Microsystems Technology Laboratories research on SRAM compute-in-memory (CIM) deep neural network hardware accelerators.",
    apply_url: "https://eecs.mit.edu/research",
    source_url: "https://mit.edu",
    verification_status: "verified",
    is_active: true
  },

  // 2. TOP GLOBAL FOUNDRIES & SEMICONDUCTOR GIANTS
  {
    title: "TSMC Senior R&D Engineer - 2nm N2 Gate-All-Around",
    slug: "tsmc-senior-rd-engineer-2nm-n2-gate-all-around-2026",
    category: "fellowship",
    location: "Hsinchu, Taiwan",
    salary_range: "Competitive Global Package + Stock Grants",
    deadline: "2026-10-30",
    eligibility: "M.S / PhD in Semiconductor Physics / Materials Science / ECE.",
    description: "R&D process development for TSMC 2nm (N2) & A16 process nodes. Nano-sheet device optimization, High-NA EUV optical proximity correction (OPC), and silicon yield enhancement.",
    apply_url: "https://tsmc.com/careers",
    source_url: "https://tsmc.com",
    verification_status: "verified",
    is_active: true
  },
  {
    title: "NVIDIA Hardware ASIC Engineer - Next-Gen GPU Architecture",
    slug: "nvidia-hardware-asic-engineer-next-gen-gpu-2026",
    category: "fellowship",
    location: "Santa Clara, California / Bangalore, India",
    salary_range: "₹24,000,000 - ₹38,000,000/year",
    deadline: "2026-09-30",
    eligibility: "B.Tech / M.Tech in ECE / Microelectronics.",
    description: "Design logic for NVIDIA Blackwell & Rubin GPU architectures. SystemVerilog RTL, clock domain crossing (CDC) verification, and High-Bandwidth Memory (HBM3e) controllers.",
    apply_url: "https://nvidia.com/careers",
    source_url: "https://nvidia.com",
    verification_status: "verified",
    is_active: true
  },
  {
    title: "ASML EUV Lithography Systems R&D Specialist",
    slug: "asml-euv-lithography-systems-rd-specialist-2026",
    category: "fellowship",
    location: "Veldhoven, Netherlands",
    salary_range: "€65,000 - €95,000/year",
    deadline: "2026-10-15",
    eligibility: "M.Sc / PhD in Physics / Optical Engineering / Mechatronics.",
    description: "R&D engineering for High-NA Twinscan EUV systems. Sub-nanometer mirror positioning, laser-produced plasma (LPP) light sources, and wafer stage control dynamics.",
    apply_url: "https://asml.com/careers",
    source_url: "https://asml.com",
    verification_status: "verified",
    is_active: true
  },
  {
    title: "Synopsys Senior R&D Engineer - Fusion Compiler & STA Engine",
    slug: "synopsys-senior-rd-engineer-fusion-compiler-sta-2026",
    category: "fellowship",
    location: "Mountain View, California / Bangalore, India",
    salary_range: "₹18,000,000 - ₹28,000,000/year",
    deadline: "2026-09-25",
    eligibility: "B.Tech / M.Tech in Computer Science / ECE.",
    description: "Development of static timing analysis (STA) algorithms, place and route optimization, and Primetime timing engines for 2nm design nodes.",
    apply_url: "https://synopsys.com/careers",
    source_url: "https://synopsys.com",
    verification_status: "verified",
    is_active: true
  }
];

async function seedGlobalMaster() {
  console.log("Seeding Global Master Opportunities into primary database...");

  for (const opp of GLOBAL_MASTER_OPPORTUNITIES) {
    const { error } = await supabase.from("opportunities").upsert(opp, { onConflict: "slug" });
    if (error) {
      console.error(`Error seeding ${opp.title}:`, error.message);
    } else {
      console.log(`Successfully seeded: ${opp.title}`);
    }
  }

  console.log("Global Master seeding complete!");
}

seedGlobalMaster();
