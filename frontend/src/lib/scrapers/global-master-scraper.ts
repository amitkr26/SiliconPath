// P0 (CONTENT_UPGRADE_PLAN.md): hand-written postings, not scraped data.
// Disabled unless SCRAPER_ALLOW_FABRICATED=true — never fabricate content in production.
const fabricatedScrapingEnabled = () => process.env.SCRAPER_ALLOW_FABRICATED === "true";

interface ScrapedItem {
  title: string;
  category?: string;
  location?: string;
  stipend?: string;
  deadline?: string;
  eligibility?: string;
  description?: string;
  apply_link?: string;
  source_url?: string;
  tags?: string[];
}

/**
 * 1. Global Research Labs Scraper
 * NASA, DARPA, NIST, CERN, IMEC, CEA-Leti, Fraunhofer, Max Planck, RIKEN, A*STAR, ITRI, CSIRO
 */
export async function scrapeGlobalResearchLabs(slug?: string): Promise<ScrapedItem[]> {
  if (!fabricatedScrapingEnabled()) return [];
  const items: ScrapedItem[] = [];

  try {
    // CERN Switzerland
    if (!slug || slug === "cern") {
      items.push({
        title: "CERN Doctoral Student Program - High Energy Physics Electronics",
        category: "phd",
        location: "Geneva, Switzerland",
        stipend: "3,765 CHF/month",
        deadline: "2026-10-20",
        eligibility: "Enrolled in PhD program in Physics / EE / Microelectronics.",
        description: "Development of radiation-hardened ASIC detectors for High-Luminosity LHC experiments.",
        apply_link: "https://home.cern/careers",
        source_url: "https://home.cern",
        tags: ["CERN", "Switzerland", "High Energy Physics", "ASIC"]
      });
    }

    // IMEC Belgium
    if (!slug || slug === "imec") {
      items.push({
        title: "IMEC Postdoctoral Researcher - 1nm CMOS & High-NA EUV Lithography",
        category: "fellowship",
        location: "Leuven, Belgium",
        stipend: "€48,000 - €62,000/year",
        deadline: "2026-09-30",
        eligibility: "PhD in Nanoelectronics / Physics / Semiconductor Fabrication.",
        description: "Pioneering sub-1nm GAA Nanosheet transistors, High-NA EUV resist modeling, and 3D IC bonding.",
        apply_link: "https://imec-int.com/en/careers",
        source_url: "https://imec-int.com",
        tags: ["IMEC", "Belgium", "Lithography", "1nm"]
      });
    }

    // NASA USA
    if (!slug || slug === "nasa") {
      items.push({
        title: "NASA JPL Research Postdoc - Spacecraft Payload Avionics",
        category: "fellowship",
        location: "Pasadena, California, USA",
        stipend: "$75,000 - $95,000/year",
        deadline: "2026-10-05",
        eligibility: "PhD in EE / Aerospace / Embedded Systems.",
        description: "Jet Propulsion Laboratory (JPL) research on space-grade RISC-V microarchitectures and CubeSat avionics.",
        apply_link: "https://nasa.gov/careers",
        source_url: "https://nasa.gov",
        tags: ["NASA", "JPL", "Spacecraft", "Avionics"]
      });
    }

    // CEA-Leti France
    if (!slug || slug === "cea-leti") {
      items.push({
        title: "CEA-Leti Postdoc - Silicon Photonics & Quantum Computing",
        category: "fellowship",
        location: "Grenoble, France",
        stipend: "€42,000/year",
        deadline: "2026-09-25",
        eligibility: "PhD in Optics / Photonics / EE.",
        description: "Integration of silicon photonics co-packaged optics (CPO) with cryogenic CMOS drivers.",
        apply_link: "https://leti-cea.fr/careers",
        source_url: "https://leti-cea.fr",
        tags: ["CEA-Leti", "France", "Photonics"]
      });
    }
  } catch (err: any) {
    console.error("Global Research Labs Scraper Error:", err.message);
  }

  return items;
}

/**
 * 2. Global Top Engineering Universities Scraper
 * MIT, Stanford, UC Berkeley, Caltech, ETH Zurich, EPFL, NUS, NTU, Tsinghua
 */
export async function scrapeGlobalUniversities(slug?: string): Promise<ScrapedItem[]> {
  if (!fabricatedScrapingEnabled()) return [];
  const items: ScrapedItem[] = [];

  try {
    // MIT USA
    if (!slug || slug === "mit") {
      items.push({
        title: "MIT EECS Postdoctoral Associate - Energy-Efficient AI Accelerators",
        category: "fellowship",
        location: "Cambridge, Massachusetts, USA",
        stipend: "$72,000 - $85,000/year",
        deadline: "2026-10-15",
        eligibility: "PhD in Electrical Engineering & Computer Science.",
        description: "Research on compute-in-memory (CIM) DNN accelerators, SRAM non-volatile arrays, and SystemVerilog RTL.",
        apply_link: "https://eecs.mit.edu/research",
        source_url: "https://mit.edu",
        tags: ["MIT", "USA", "AI Accelerator", "CIM"]
      });
    }

    // ETH Zurich Switzerland
    if (!slug || slug === "eth-zurich") {
      items.push({
        title: "ETH Zurich PhD Fellow - Integrated Systems Laboratory (IIS)",
        category: "phd",
        location: "Zurich, Switzerland",
        stipend: "54,000 CHF/year",
        deadline: "2026-09-28",
        eligibility: "Master's degree in Microelectronics / Electrical Engineering.",
        description: "PULP Platform open-source RISC-V multi-core chip design, ultra-low-power computing, and TSMC tapeouts.",
        apply_link: "https://ethz.ch/careers",
        source_url: "https://ethz.ch",
        tags: ["ETH Zurich", "PULP", "RISC-V", "PhD"]
      });
    }

    // NUS Singapore
    if (!slug || slug === "nus") {
      items.push({
        title: "NUS ECE Research Fellow - Mixed-Signal IC Design",
        category: "fellowship",
        location: "Singapore",
        stipend: "6,500 SGD/month",
        deadline: "2026-09-20",
        eligibility: "PhD in Analog / RF / Mixed-Signal IC Design.",
        description: "Ultra-low-power ADC converters, PMIC energy harvesters, and Cadence Virtuoso simulations.",
        apply_link: "https://ece.nus.edu.sg",
        source_url: "https://nus.edu.sg",
        tags: ["NUS", "Singapore", "Mixed Signal"]
      });
    }
  } catch (err: any) {
    console.error("Global Universities Scraper Error:", err.message);
  }

  return items;
}

/**
 * 3. Top Semiconductor Foundries & Fabless Giants Scraper
 * TSMC, Intel, AMD, Nvidia, Qualcomm, Broadcom, Samsung, Micron, TI, NXP, Infineon, ARM
 */
export async function scrapeTopSemiconductorCompanies(slug?: string): Promise<ScrapedItem[]> {
  if (!fabricatedScrapingEnabled()) return [];
  const items: ScrapedItem[] = [];

  try {
    // TSMC Taiwan
    if (!slug || slug === "tsmc") {
      items.push({
        title: "TSMC Senior R&D Engineer - 2nm N2 Gate-All-Around Process",
        category: "job",
        location: "Hsinchu, Taiwan / Phoenix, Arizona, USA",
        stipend: "Competitive Global Package + Stock Grants",
        deadline: "2026-10-30",
        eligibility: "M.S / PhD in Semiconductor Physics / Materials Science / ECE.",
        description: "R&D implementation for TSMC N2 & A16 process nodes. Nano-sheet device optimization, EUV OPC, and yield enhancement.",
        apply_link: "https://tsmc.com/careers",
        source_url: "https://tsmc.com",
        tags: ["TSMC", "Foundry", "2nm", "Taiwan"]
      });
    }

    // NVIDIA
    if (!slug || slug === "nvidia") {
      items.push({
        title: "NVIDIA Hardware ASIC Engineer - Next-Gen GPU Architecture",
        category: "job",
        location: "Santa Clara, California / Bangalore, India",
        stipend: "₹24,000,000 - ₹38,000,000/year",
        deadline: "2026-09-30",
        eligibility: "B.Tech / M.Tech in ECE / Microelectronics.",
        description: "Design logic for NVIDIA Blackwell & Rubin GPU architectures. SystemVerilog RTL, clock domain crossing, and High-Bandwidth Memory (HBM3e) controllers.",
        apply_link: "https://nvidia.com/careers",
        source_url: "https://nvidia.com",
        tags: ["NVIDIA", "GPU", "ASIC", "RTL"]
      });
    }

    // ARM Architecture
    if (!slug || slug === "arm") {
      items.push({
        title: "ARM CPU Microarchitect - Neoverse Enterprise Core",
        category: "job",
        location: "Cambridge, UK / Austin, Texas / Bangalore, India",
        stipend: "Competitive Global Salary + Equity",
        deadline: "2026-09-22",
        eligibility: "M.S / PhD in Computer Architecture / ECE.",
        description: "Design high-performance branch predictors, out-of-order execution pipelines, and ARMv9 instruction set extensions.",
        apply_link: "https://careers.arm.com",
        source_url: "https://arm.com",
        tags: ["ARM", "CPU", "Microarchitecture"]
      });
    }
  } catch (err: any) {
    console.error("Top Semiconductor Companies Scraper Error:", err.message);
  }

  return items;
}

/**
 * 4. EDA & Fab Equipment Leaders Scraper
 * Cadence, Synopsys, Siemens EDA, ASML, Applied Materials, Lam Research, KLA, Keysight
 */
export async function scrapeEdaAndEquipment(slug?: string): Promise<ScrapedItem[]> {
  if (!fabricatedScrapingEnabled()) return [];
  const items: ScrapedItem[] = [];

  try {
    // ASML Netherlands
    if (!slug || slug === "asml") {
      items.push({
        title: "ASML EUV Lithography Systems R&D Specialist",
        category: "job",
        location: "Veldhoven, Netherlands",
        stipend: "€65,000 - €95,000/year",
        deadline: "2026-10-15",
        eligibility: "M.Sc / PhD in Physics / Optical Engineering / Mechatronics.",
        description: "R&D engineering for High-NA Twinscan EUV systems. Sub-nanometer mirror positioning, laser-produced plasma (LPP) light sources.",
        apply_link: "https://asml.com/careers",
        source_url: "https://asml.com",
        tags: ["ASML", "EUV", "Lithography", "Netherlands"]
      });
    }

    // Synopsys
    if (!slug || slug === "synopsys") {
      items.push({
        title: "Synopsys Senior R&D Engineer - Fusion Compiler & STA",
        category: "job",
        location: "Mountain View, California / Bangalore, India",
        stipend: "₹18,000,000 - ₹28,000,000/year",
        deadline: "2026-09-25",
        eligibility: "B.Tech / M.Tech in Computer Science / ECE.",
        description: "Development of static timing analysis (STA) algorithms, place and route optimization, and Primetime timing engines.",
        apply_link: "https://synopsys.com/careers",
        source_url: "https://synopsys.com",
        tags: ["Synopsys", "EDA", "STA", "Primetime"]
      });
    }

    // Cadence
    if (!slug || slug === "cadence") {
      items.push({
        title: "Cadence Applications Engineer - Innovus Physical Implementation",
        category: "job",
        location: "Noida / Bangalore, India",
        stipend: "₹16,000,000 - ₹26,000,000/year",
        deadline: "2026-09-18",
        eligibility: "B.Tech / M.Tech in VLSI / Microelectronics.",
        description: "Customer enablement for Innovus place & route, Genus synthesis, and Tempus STA timing closure on 3nm/2nm process nodes.",
        apply_link: "https://cadence.com/careers",
        source_url: "https://cadence.com",
        tags: ["Cadence", "Innovus", "EDA"]
      });
    }
  } catch (err: any) {
    console.error("EDA & Equipment Scraper Error:", err.message);
  }

  return items;
}
