/**
 * Deterministic fallback resume parser for extracting core candidate information
 * from raw text when AI providers or cloud Document AI services are offline.
 */

const COMMON_SKILLS = [
  "Verilog", "SystemVerilog", "VHDL", "UVM", "RTL Design", "Digital Design",
  "Physical Design", "STA", "Static Timing Analysis", "Synthesis", "DFT",
  "FPGA", "ASIC", "SoC", "Cadence", "Synopsys", "Innovus", "Design Compiler",
  "Virtuoso", "ModelSim", "VCS", "Tcl", "Python", "C++", "C", "Linux",
  "RISC-V", "ARM", "DSP", "Microcontroller", "MATLAB", "PCB Design",
  "SPICE", "Analog Design", "CMOS", "Semiconductor", "Timing Closure",
  "Logic Synthesis", "Formal Verification", "Perl", "Git", "Docker"
];

export interface ParsedResumeProfile {
  full_name?: string;
  email?: string;
  phone?: string;
  headline?: string;
  about?: string;
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
    duration: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string;
    link?: string;
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
    .filter(Boolean);

  const profile: ParsedResumeProfile = {
    skills: [],
    experience: [],
    education: [],
    projects: [],
    publications: []
  };

  if (lines.length === 0) return profile;

  // 1. Email extraction
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    profile.email = emailMatch[0];
  }

  // 2. Phone extraction
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/);
  if (phoneMatch && phoneMatch[0].length >= 10) {
    profile.phone = phoneMatch[0].trim();
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
  const locationMatch = text.match(/(?:Location|Address|City):\s*([^\n\r]+)/i) ||
    text.match(/\b(Bengaluru|Bangalore|Hyderabad|Pune|Noida|Delhi|Mumbai|Chennai|Austin|San Jose|Santa Clara|San Diego|Boston),?\s*(India|USA|US|UK|Germany|CA)?\b/i);
  if (locationMatch) {
    profile.city = locationMatch[1];
    profile.country = locationMatch[2] || "India";
  }

  // 6. Skills extraction
  const lowerText = text.toLowerCase();
  const foundSkills = new Set<string>();
  for (const skill of COMMON_SKILLS) {
    const escaped = skill.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(text)) {
      foundSkills.add(skill);
    }
  }
  profile.skills = Array.from(foundSkills);

  // 7. Section parsing (Summary, Experience, Education, Projects)
  let currentSection: "summary" | "experience" | "education" | "projects" | null = null;
  let summaryBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    if (/^(summary|profile|about me|professional summary)/i.test(lower)) {
      currentSection = "summary";
      continue;
    } else if (/^(experience|work experience|employment history|work history)/i.test(lower)) {
      currentSection = "experience";
      continue;
    } else if (/^(education|academic background|qualifications)/i.test(lower)) {
      currentSection = "education";
      continue;
    } else if (/^(projects|academic projects|key projects)/i.test(lower)) {
      currentSection = "projects";
      continue;
    } else if (/^(skills|technical skills|competencies)/i.test(lower)) {
      currentSection = null;
      continue;
    }

    if (currentSection === "summary" && summaryBuffer.length < 4) {
      summaryBuffer.push(line);
    } else if (currentSection === "education") {
      if (line.match(/(B\.Tech|B\.E\.|M\.Tech|M\.S\.|B\.Sc|M\.Sc|Bachelor|Master|PhD|Diploma|IIT|NIT|IIIT|University|Institute|College)/i)) {
        profile.education?.push({
          institution: line,
          degree: line.split(/[-–|,]/)[0].trim(),
          duration: line.match(/\b(20\d\d(?:\s*[-–]\s*(?:20\d\d|Present))?)\b/)?.[0] || ""
        });
      }
    } else if (currentSection === "experience") {
      if (line.match(/(Engineer|Developer|Intern|Lead|Manager|Architect|Consultant|Specialist|Associate)/i) || line.match(/[-–|,]\s*(20\d\d|19\d\d)/)) {
        profile.experience?.push({
          role: line.split(/[-–|,]/)[0].trim(),
          company: line.split(/[-–|,]/)[1]?.trim() || "Organization",
          duration: line.match(/\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|20\d\d)[^,\n]+)/i)?.[0] || "",
          description: lines[i + 1] && lines[i + 1].length > 15 ? lines[i + 1] : ""
        });
      }
    } else if (currentSection === "projects") {
      if (line.length > 5 && line.length < 80 && !line.startsWith("•") && !line.startsWith("-")) {
        profile.projects?.push({
          name: line.replace(/^[0-9]+[.)]\s*/, ""),
          description: lines[i + 1] && lines[i + 1].length > 15 ? lines[i + 1] : ""
        });
      }
    }
  }

  if (summaryBuffer.length > 0) {
    profile.about = summaryBuffer.join(" ");
  }

  return profile;
}
