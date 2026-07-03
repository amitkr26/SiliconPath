// ── HARD BLOCKLIST (these topics are NEVER electronics news) ──
const BLOCKED_PATTERNS = [
  /mango/i,
  /cricket/i,
  /bollywood/i,
  /movie\s+review/i,
  /entertainment/i,
  /kollywood/i,
  /tollywood/i,
  /recipe/i,
  /horoscope/i,
  /astrology/i,
  /cooking/i,
  /beauty\s+tips/i,
  /fashion/i,
  /wedding/i,
  /pregnancy/i,
  /baby\s+care/i,
  /weight\s+loss/i,
  /hair\s+care/i,
  /skin\s+care/i,
  /kl\s*rahu/i,
  /politics/i,
  /election/i,
  /sports/i,
  /football/i,
  /ufc/i,
  /wwe/i,
  /movie\s+release/i,
  /box\s+office/i,
  /song/i,
  /album/i,
  /celebrit/i,
  /gossip/i,
  /cricket\s+score/i,
  /ipl/i,
  /kabaddi/i,
  /obituary/i,
  /death\s+notice/i,
  /classified/i,
  /advertisement/i,
  /sponsored/i,
  /promoted/i,
  /paid\s+content/i,
];

// ── ELECTRONICS KEYWORD WHITELIST ──
const ELECTRONICS_KEYWORDS = [
  "semiconductor",
  "electronics",
  "vlsi",
  "vls i",
  "chip",
  "microchip",
  "transistor",
  "wafer",
  "fab",
  "foundry",
  "embedded",
  "microcontroller",
  "fpga",
  "asic",
  "pcb",
  "circuit",
  "sensor",
  "mems",
  "photonics",
  "optoelectronics",
  "spintronics",
  "antenna",
  "radar",
  "rf",
  "signal processing",
  "power electronics",
  "battery",
  "solar cell",
  "led",
  "laser",
  "nanotechnology",
  "nanoelectronics",
  "quantum dot",
  "graphene",
  "silicon",
  "gallium",
  "gan",
  "sic",
  "germanium",
  "indium",
  "intel",
  "nvidia",
  "tsmc",
  "samsung",
  "qualcomm",
  "amd",
  "arm",
  "broadcom",
  "texas instruments",
  "analog devices",
  "applied materials",
  "asml",
  "lam research",
  "kla",
  "synopsys",
  "cadence",
  "drdo",
  "isro",
  "csir",
  "barc",
  "jitendra singh",
  "semicon india",
  "india semiconductor mission",
  "ism",
  "chip design",
  "e da",
  "electronic design automation",
  "soc",
  "system on chip",
  "snps",
  "cdns",
  "5g",
  "6g",
  "iot",
  "ai chip",
  "neural processing",
  "edge computing",
  "electric vehicle",
  "ev battery",
  "motor drive",
  "inverter",
  "space electronics",
  "satellite",
  "defence electronics",
  "semiwiki",
  "ies a",
  "esdm",
  "thin film",
  "printed circuit",
  "electronics weekly",
  "eetimes",
  "electronic design",
  "chip scale",
  "packaging",
  "advanced packaging",
  "chiplets",
  "hybrid bonding",
  "euv",
  "lithography",
  "semiconductor equipment",
  "memory",
  "dram",
  "nand",
  "flash",
  "ssd",
  "nvme",
  "cpu",
  "gpu",
  "tensor core",
  "cuda core",
  "rtx",
  "arc",
  "ryzen",
  "epyc",
  "xeon",
  "snapdragon",
  "dimensity",
  "exynos",
  "a series",
  "m series",
  "risc v",
  "open source hardware",
  "industry 4.0",
  "test fixture",
  "wafer test",
  "probe card",
  "wire bond",
  "pick and place",
  "reflow",
  "smt",
  "through hole",
  "pcb assembly",
  "electronics engineering",
  "electrical engineering",
  "ece",
  "eee",
  "vlsi design",
  "digital design",
  "analog design",
  "mixed signal",
  "adc",
  "dac",
  "pll",
  "serdes",
  "power management ic",
  "pmic",
  "voltage regulator",
  "dc dc converter",
  "amplifier",
  "operational amplifier",
  "filter",
  "oscillator",
  "crystal",
  "resonator",
  "capacitor",
  "inductor",
  "resistor",
  "diode",
  "transistor",
  "thyristor",
  "triac",
  "mosfet",
  "igbt",
  "scr",
  "opto coupler",
  "relay",
  "connector",
  "harness",
  "wire harness",
  "cable assembly",
  "flex cable",
  "ffc",
  "fpc",
  "rigid flex",
  "hdi pcb",
  "multilayer pcb",
  "controlled impedance",
  "microstrip",
  "stripline",
  "emc",
  "emi",
  "esd",
  "grounding",
  "shielding",
  "soldering",
  "wave solder",
  "selective solder",
  "conformal coating",
  "potting",
  "encapsulation",
  "underfill",
  "thermal management",
  "heatsink",
  "thermal pad",
  "thermal interface",
  "pcb design",
  "altium",
  "kicad",
  "eagle",
  "orcad",
  "pads",
  "xpedition",
  "spice",
  "simulation",
  "modeling",
  "verilog",
  "vhdl",
  "systemverilog",
  "uvm",
  "formal verification",
  "static timing",
  "signoff",
  "layout",
  "physical design",
  "place and route",
  "clock tree",
  "power grid",
  "ir drop",
  "electromigration",
  "reliability",
  "fault analysis",
  "failure analysis",
  "sem analysis",
  "tem",
  "xrd",
  "eds",
  "xps",
  "ftir",
  "raman",
  "afm",
  "stm",
  "probe station",
  "parameter analyzer",
  "lcr meter",
  "network analyzer",
  "spectrum analyzer",
  "oscilloscope",
  "waveform generator",
  "power supply",
  "electronics lab",
  "clean room",
  "microfabrication",
  "nanofabrication",
  "lithography",
  "etching",
  "deposition",
  "cvd",
  "pvd",
  "ald",
  "metal lift off",
  "dicing",
  "grinding",
  "cmp",
  "wafer thinning",
  "bonding",
  "sintering",
  "annealing",
  "diffusion",
  "implantation",
  "oxidation",
  "nitridation",
  "epitaxy",
  "mbe",
  "mocvd",
  "hid",
  "he",
  "she",
  "ie",
  "ieee",
  "phd",
  "fellowship",
  "postdoc",
  "research position",
  "jrf",
  "research assistant",
  "sr f",
  "project assistant",
  "junior research fellow",
  "senior research fellow",
  "research associate",
  "scientist",
  "faculty position",
  "assistant professor",
  "associate professor",
  "professor",
  "iisc",
  "iit",
  "nit",
  "iiit",
  "csir",
  "drdo lab",
  "isro lab",
  "barc",
  "tifr",
  "rri",
  "raman research",
  "snc",
  "ceeri",
  "amey",
  "core electronics",
  "digital electronics",
  "power system",
  "control system",
  "instrumentation",
  "automation",
  "robotics",
  "industrial electronics",
  "consumer electronics",
  "wearable electronics",
  "medical electronics",
  "biomedical electronics",
  "automotive electronics",
  "aviation electronics",
  "military electronics",
  "telecom",
  "telecommunication",
  "optical communication",
  "fiber optic",
  "photonics",
  "integrated photonics",
  "silicon photonics",
  "quantum computing",
  "quantum technology",
  "cryoelectronics",
  "superconductor",
  "heterogeneous integration",
  "fan out",
  "through silicon via",
  "tsv",
  "interposer",
  "2.5d",
  "3d ic",
  "monolithic 3d",
  "stacked die",
  "multi chip module",
  "mcm",
  "system in package",
  "sip",
];

// ── MATCH HELPER ──
function matchesAny(text: string, patterns: string[]): boolean {
  const lower = text.toLowerCase();
  return patterns.some((pat) => lower.includes(pat));
}

// ── HARD CHECK ──
function isBlocked(title: string, summary: string): boolean {
  return BLOCKED_PATTERNS.some((pat) => pat.test(title) || pat.test(summary));
}

// ── ELECTRONICS CHECK ──
function isElectronicsRelated(title: string, summary: string): boolean {
  return matchesAny(title, ELECTRONICS_KEYWORDS)
    || matchesAny(summary, ELECTRONICS_KEYWORDS);
}

/**
 * Tier-based electronics news filter:
 *   Tier 1 (pure electronics sources) → title OR summary must match keywords
 *   Tier 2+ (general tech) → title MUST match keywords
 * Hard blocklist always applies.
 */
export function isElectronicsNews(
  title: string,
  summary: string | null,
  tier: number = 1,
): boolean {
  const safeSummary = summary || "";

  // Hard blocklist always applies
  if (isBlocked(title, safeSummary)) return false;

  // Must be electronics-related
  if (tier === 1) {
    return isElectronicsRelated(title, safeSummary);
  }
  // Tier 2+: title must match
  return matchesAny(title, ELECTRONICS_KEYWORDS);
}

// ── AUTO-TAGGING SYSTEM ──

interface TagRule {
  keywords: string[];
  tag: string;
}

const TAG_RULES: TagRule[] = [
  // Chip & Process Technology
  {
    keywords: ["tsmc", "samsung foundry", "intel foundry", "foundry", "fab", "wafer"],
    tag: "Foundry",
  },
  {
    keywords: ["euv", "lithography", "asml", "chiplet", "advanced packaging", "hybrid bonding", "2.5d", "3d ic", "fan out", "heterogeneous integration"],
    tag: "Advanced Packaging",
  },
  {
    keywords: ["transistor", "gate all around", "gaa", "nanosheet", "finfet", "cmos", "bcd"],
    tag: "Device Tech",
  },
  {
    keywords: ["silicon", "gan", "gallium", "wide bandgap", "power semiconductor", "silicon carbide"],
    tag: "Wide Bandgap",
  },
  {
    keywords: ["graphene", "quantum dot", "spintronics", "mems", "nems", "nano"],
    tag: "Nanotechnology",
  },
  // Design & EDA
  {
    keywords: ["synopsys", "cadence", "mentor", "siemens eda", "ansys", "electronic design automation", "eda", "verilog", "vhdl", "systemverilog", "uvm"],
    tag: "EDA",
  },
  {
    keywords: ["soc", "system on chip", "asic", "fpga", "microcontroller", "risc v", "risc-v", "arm", "x86", "microarchitecture"],
    tag: "Chip Design",
  },
  {
    keywords: ["ai chip", "npu", "tensor", "neural processing", "hpu", "ml accelerator"],
    tag: "AI Chips",
  },
  // Materials
  {
    keywords: ["silicon carbide", "gan", "gallium nitride", "gallium arsenide", "gaas", "indium", "germanium", "wafer material", "substrate"],
    tag: "Materials",
  },
  // Equipment
  {
    keywords: ["asml", "applied materials", "lam research", "kla", "tokyo electron", "teradyne", "test equipment", "metrology", "inspection", "semiconductor equipment"],
    tag: "Equipment",
  },
  // Markets & Business
  {
    keywords: ["semiconductor market", "chip shortage", "chip supply", "chip demand", "revenue", "shipment", "unit shipment", "market share", "acquisition", "merger", "ipo"],
    tag: "Markets",
  },
  {
    keywords: ["chip act", "subsidy", "export control", "chip war", "trade", "tariff", "sanction", "policy"],
    tag: "Policy",
  },
  // India-specific
  {
    keywords: ["india", "india semiconductor mission", "semicon india", "ies a", "esdm", "meity", "ceeri", "amey", "iit", "nit", "iiit", "iisc", "bangalore", "bengaluru", "hyderabad", "ahmedabad", "noida", "greater noida", "dholera"],
    tag: "India",
  },
  // Research & Events
  {
    keywords: ["phd", "fellowship", "postdoc", "jrf", "srf", "research position", "vacancy", "admission", "notification"],
    tag: "Jobs/Research",
  },
  {
    keywords: ["conference", "symposium", "workshop", "webinar", "summit", "expo", "exhibition", "trade show", "call for paper"],
    tag: "Events",
  },
  // General Electronics
  {
    keywords: ["iot", "sensor", "smart", "connected", "wireless", "bluetooth", "wifi", "zigbee", "lora"],
    tag: "IoT",
  },
  {
    keywords: ["electric vehicle", "ev", "battery technology", "bms", "charging", "power electronics", "inverter", "motor drive", "solid state battery"],
    tag: "EV/Power",
  },
  {
    keywords: ["5g", "6g", "rf", "mmwave", "antenna", "beamforming", "massive mimo", "telecom"],
    tag: "5G/6G",
  },
  {
    keywords: ["space", "satellite", "isro", "defence", "aerospace", "military", "radar", "sonar"],
    tag: "Aerospace & Defence",
  },
  {
    keywords: ["quantum computing", "quantum processor", "qubit", "quantum technology", "superconducting"],
    tag: "Quantum",
  },
  // General processor news
  {
    keywords: ["intel", "amd", "nvidia", "qualcomm", "apple silicon", "ryzen", "xeon", "core ultra", "snapdragon", "dimensity", "exynos", "tensor"],
    tag: "Processors",
  },
  // Fallback: any electronics article that didn't match a specific tag
  {
    keywords: ["chip", "semiconductor", "electronics", "wafer", "transistor", "circuit"],
    tag: "Semiconductor",
  },
];

const TAG_BLACKLIST = [
  "hips", "hip", "he", "hid", "she", "ie", "ear", "ice", "bill",
  "fine", "kind", "will", "just", "more", "also", "new", "first",
  "next", "last", "over", "open", "part", "some", "such", "than",
  "that", "them", "then", "this", "well", "said", "year", "make",
  "like", "time", "has", "had", "have", "from", "they", "what",
  "when", "where", "which", "who", "whom", "why", "how", "all",
  "any", "can", "not", "one", "two", "to", "for", "and", "the",
  "with", "was", "are"
];

const TAG_MAX = 6;

export function autoTagArticle(title: string, summary: string): string[] {
  const text = `${title} ${summary}`.toLowerCase();
  const matches = new Set<string>();

  for (const rule of TAG_RULES) {
    for (const kw of rule.keywords) {
      if (kw.length <= 3) {
        const re = new RegExp(`\\b${kw}\\b`, "i");
        if (re.test(text)) {
          matches.add(rule.tag);
          break;
        }
      } else if (text.includes(kw)) {
        matches.add(rule.tag);
        break;
      }
    }
  }

  // Filter out false positives from blacklist
  const filtered = Array.from(matches).filter(
    (tag) => !TAG_BLACKLIST.includes(tag.toLowerCase()),
  );

  return filtered.slice(0, TAG_MAX);
}
