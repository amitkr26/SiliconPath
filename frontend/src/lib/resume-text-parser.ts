/**
 * Deterministic fallback resume parser for extracting core candidate information
 * from raw text when AI providers or cloud Document AI services are offline.
 */

export const SEMICONDUCTOR_SKILLS = [
  // HDL & Verification
  "Verilog", "SystemVerilog", "VHDL", "UVM", "OVM", "SystemC", "Specman",
  "RTL Design", "Digital Design", "Logic Synthesis", "Formal Verification",
  "Assertions (SVA)", "Coverage Driven Verification", "Functional Verification",
  "Gate Level Simulation (GLS)",

  // Physical Design & Implementation
  "Physical Design", "STA", "Static Timing Analysis", "Synthesis", "DFT",
  "Scan Insertion", "ATPG", "MBIST", "Place & Route (PnR)", "Floorplanning",
  "CTS (Clock Tree Synthesis)", "DRC/LVS", "Power Analysis", "IR Drop", "UPF/CPF",

  // EDA Tools & Suites
  "Cadence Virtuoso", "Cadence Innovus", "Cadence Genus", "Cadence Xcelium",
  "Synopsys Design Compiler", "Synopsys ICC2", "Synopsys PrimeTime", "Synopsys VCS",
  "Siemens ModelSim", "Siemens Questa", "Siemens Calibre", "Xilinx Vivado", "Intel Quartus",

  // Architecture & Hardware
  "FPGA", "ASIC", "SoC", "RISC-V", "ARM Cortex", "AMBA (AXI/AHB/APB)", "PCIe",
  "DDR Controller", "UART", "SPI", "I2C", "DSP", "Microcontroller", "CMOS",
  "Analog Design", "SPICE Simulation", "PCB Design", "KiCAD", "Altium",

  // Programming & Scripting
  "Tcl", "Python", "C++", "C", "Perl", "Bash", "Linux", "Git", "Make", "Docker", "MATLAB"
];

export interface ParsedResumeProfile {
  full_name?: string;
  email?: string;
  phone?: string;
  headline?: string;
  about?: string;
  location?: string;
  city?: string;
  country?: string;
  skills?: string[];
  experience?: Array<{
    company: string;
    role: string;
    duration: string;
    description: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    field?: string;
    duration: string;
    cgpa?: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string;
    link?: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer?: string;
    year?: string;
  }>;
  publications?: Array<{
    title: string;
    venue?: string;
    year?: string;
    doi?: string;
  }>;
}

export function parseResumeTextDeterministically(text: string): ParsedResumeProfile {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => Boolean(l) && !l.match(/^--\s*\d+\s*of\s*\d+\s*--$/i) && !l.match(/^page\s*\d+(\s*of\s*\d+)?$/i));

  const profile: ParsedResumeProfile = {
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    publications: [],
  };

  if (lines.length === 0) return profile;

  // 1. Email extraction
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    profile.email = emailMatch[0];
  }

  // 2. Phone extraction
  const phoneMatch =
    text.match(/(?:Phone|Mobile|Tel|Contact)?[:\s]*((?:\+\d{1,3}[\s-]?)?\(?\d{2,5}\)?[\s.-]?\d{3,5}[\s.-]?\d{3,5})/i) ||
    text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/);
  if (phoneMatch) {
    const rawNum = phoneMatch[1] || phoneMatch[0];
    if (rawNum && rawNum.replace(/\D/g, "").length >= 10) {
      profile.phone = rawNum.trim();
    }
  }

  // 3. Name extraction (first non-empty line that doesn't contain email/phone/symbols)
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const l = lines[i];
    if (
      !l.includes("@") &&
      !l.match(/\d{5,}/) &&
      !l.toLowerCase().includes("resume") &&
      !l.toLowerCase().includes("curriculum") &&
      l.length >= 3 &&
      l.length <= 40
    ) {
      profile.full_name = l;
      break;
    }
  }

  // 4. Headline / Title extraction (line 2 if short)
  if (lines.length > 1 && lines[1].length < 60 && !lines[1].includes("@")) {
    profile.headline = lines[1];
  }

  // 5. Location extraction
  const explicitLocMatch = text.match(/(?:Location|Address|City):\s*([^\n\r]+)/i);
  const cityKeywordMatch = text.match(/\b(Bengaluru|Bangalore|Hyderabad|Pune|Noida|Delhi|Gurugram|Mumbai|Chennai|Kolkata|Ahmedabad|Austin|San Jose|Santa Clara|San Diego|Boston),?\s*(India|USA|US|UK|Germany|CA)?\b/i);

  if (explicitLocMatch) {
    const rawLoc = explicitLocMatch[1].trim();
    if (rawLoc.includes(",")) {
      const parts = rawLoc.split(",").map((s) => s.trim());
      profile.city = parts[0];
      profile.country = parts[1] || "India";
      profile.location = rawLoc;
    } else {
      profile.city = rawLoc;
      profile.country = "India";
      profile.location = rawLoc;
    }
  } else if (cityKeywordMatch) {
    profile.city = cityKeywordMatch[1];
    profile.country = cityKeywordMatch[2] || "India";
    profile.location = `${profile.city}, ${profile.country}`;
  }

  // 6. Skills extraction against comprehensive taxonomy
  const foundSkills = new Set<string>();
  for (const skill of SEMICONDUCTOR_SKILLS) {
    const escaped = skill.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(text)) {
      foundSkills.add(skill);
    }
  }
  profile.skills = Array.from(foundSkills);

  // 7. Section parsing (Summary, Experience, Education, Projects, Certifications, Publications)
  let currentSection: "summary" | "experience" | "education" | "projects" | "certifications" | "publications" | null = null;
  let summaryBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    if (/^(summary|profile|about me|professional summary|objective)\b[:\s-]*/i.test(lower) && lower.length < 35) {
      currentSection = "summary";
      const inlineSummary = line.replace(/^(summary|profile|about me|professional summary|objective)[:\s-]*/i, "").trim();
      if (inlineSummary) {
        summaryBuffer.push(inlineSummary);
      }
      continue;
    } else if (/^(experience|work experience|employment history|work history|professional experience|internships)\b[:\s-]*/i.test(lower) && lower.length < 35) {
      currentSection = "experience";
      continue;
    } else if (/^(education|academic background|qualifications|academic credentials)\b[:\s-]*/i.test(lower) && lower.length < 35) {
      currentSection = "education";
      continue;
    } else if (/^(projects|academic projects|key projects|technical projects)\b[:\s-]*/i.test(lower) && lower.length < 35) {
      currentSection = "projects";
      continue;
    } else if (/^(certifications|certified courses|licenses)\b[:\s-]*/i.test(lower) && lower.length < 35) {
      currentSection = "certifications";
      continue;
    } else if (/^(publications|research papers|patents|journals)\b[:\s-]*/i.test(lower) && lower.length < 35) {
      currentSection = "publications";
      continue;
    } else if (/^(skills|technical skills|competencies|tools)\b[:\s-]*/i.test(lower) && lower.length < 35) {
      currentSection = null;
      continue;
    }

    if (currentSection === "summary" && summaryBuffer.length < 5) {
      summaryBuffer.push(line);
    } else if (currentSection === "education") {
      if (line.match(/(B\.Tech|B\.E\.|M\.Tech|M\.S\.|B\.Sc|M\.Sc|Bachelor|Master|PhD|Diploma|IIT|NIT|IIIT|University|Institute|College)/i)) {
        profile.education?.push({
          institution: line,
          degree: line.split(/[-–|,]/)[0].trim(),
          duration: line.match(/\b(20\d\d(?:\s*[-–]\s*(?:20\d\d|Present))?)\b/)?.[0] || "",
          cgpa: line.match(/\b(?:CGPA|GPA|Percentage|Score):\s*([\d.]+(?:\/10|\/4|%)?)\b/i)?.[1] || "",
        });
      }
    } else if (currentSection === "experience") {
      if (line.match(/(Engineer|Developer|Intern|Lead|Manager|Architect|Consultant|Specialist|Associate|Fellow|Researcher)/i) || line.match(/[-–|,]\s*(20\d\d|19\d\d)/)) {
        profile.experience?.push({
          role: line.split(/[-–|,]/)[0].trim(),
          company: line.split(/[-–|,]/)[1]?.trim() || "Organization",
          duration: line.match(/\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|20\d\d)[^,\n]+)/i)?.[0] || "",
          description: lines[i + 1] && lines[i + 1].length > 15 ? lines[i + 1] : "",
        });
      }
    } else if (currentSection === "projects") {
      if (line.length > 4 && line.length < 80 && !line.startsWith("•") && !line.startsWith("-")) {
        profile.projects?.push({
          name: line.replace(/^[0-9]+[.)]\s*/, ""),
          description: lines[i + 1] && lines[i + 1].length > 15 ? lines[i + 1] : "",
        });
      }
    } else if (currentSection === "certifications") {
      if (line.length > 5 && line.length < 90) {
        profile.certifications?.push({
          name: line,
          year: line.match(/\b(20\d\d)\b/)?.[0] || "",
        });
      }
    } else if (currentSection === "publications") {
      if (line.length > 8 && line.length < 120) {
        profile.publications?.push({
          title: line,
          year: line.match(/\b(20\d\d)\b/)?.[0] || "",
        });
      }
    }
  }

  if (summaryBuffer.length > 0) {
    profile.about = summaryBuffer.join(" ");
  }

  return profile;
}
