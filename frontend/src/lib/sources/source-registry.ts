/**
 * High-Priority Institutional Source Registry for Research & Opportunity Intelligence
 * Prioritizes Tier 1 (Official Government / University Career Portals)
 */

export interface SourceDefinition {
  id: string;
  name: string;
  shortCode: string;
  type: "government" | "university" | "research_institute" | "psu";
  tier: "Tier 1 — Official Source" | "Tier 2 — Institutional Portal";
  portalUrl: string;
  notificationUrl: string;
  primaryDisciplines: string[];
  supportedRoles: string[];
  status: "ACTIVE" | "MAINTENANCE";
  crawlFrequency: "daily" | "weekly";
}

export const INSTITUTIONAL_SOURCES: SourceDefinition[] = [
  {
    id: "drdo",
    name: "Defence Research and Development Organisation (DRDO)",
    shortCode: "DRDO",
    type: "government",
    tier: "Tier 1 — Official Source",
    portalUrl: "https://www.drdo.gov.in",
    notificationUrl: "https://rac.gov.in",
    primaryDisciplines: ["Electronics & Communication", "VLSI Design", "Radar & Microwave", "Embedded Systems", "Computer Science"],
    supportedRoles: ["Scientist B", "Junior Research Fellow (JRF)", "Senior Research Fellow (SRF)", "Research Associate", "Apprentice"],
    status: "ACTIVE",
    crawlFrequency: "daily",
  },
  {
    id: "isro",
    name: "Indian Space Research Organisation (ISRO)",
    shortCode: "ISRO",
    type: "government",
    tier: "Tier 1 — Official Source",
    portalUrl: "https://www.isro.gov.in",
    notificationUrl: "https://www.isro.gov.in/Careers.html",
    primaryDisciplines: ["Semiconductor Packaging", "Avionics", "RF Systems", "Digital Signal Processing", "Aerospace Electronics"],
    supportedRoles: ["Scientist/Engineer 'SC'", "JRF", "Technical Assistant", "Project Scientist"],
    status: "ACTIVE",
    crawlFrequency: "daily",
  },
  {
    id: "csir",
    name: "Council of Scientific and Industrial Research (CSIR - CEERI / NAL / CSIO)",
    shortCode: "CSIR",
    type: "research_institute",
    tier: "Tier 1 — Official Source",
    portalUrl: "https://www.csir.res.in",
    notificationUrl: "https://www.ceeri.res.in/career/",
    primaryDisciplines: ["Semiconductor Devices", "MEMS & Sensors", "VLSI Microelectronics", "Cyber-Physical Systems"],
    supportedRoles: ["Junior Research Fellow (JRF)", "Senior Research Fellow (SRF)", "Project Associate I/II", "Principal Scientist"],
    status: "ACTIVE",
    crawlFrequency: "daily",
  },
  {
    id: "iit-delhi",
    name: "Indian Institute of Technology Delhi (IITD - IRD)",
    shortCode: "IIT Delhi",
    type: "university",
    tier: "Tier 1 — Official Source",
    portalUrl: "https://home.iitd.ac.in",
    notificationUrl: "https://ird.iitd.ac.in/vacancies",
    primaryDisciplines: ["VLSI Design", "Neuromorphic Computing", "Nanoelectronics", "Photonics", "AI Hardware"],
    supportedRoles: ["Junior Research Fellow (JRF)", "Project Scientist", "Project Associate", "PhD Scholar", "Postdoc"],
    status: "ACTIVE",
    crawlFrequency: "daily",
  },
  {
    id: "iit-bombay",
    name: "Indian Institute of Technology Bombay (IITB - IRCC)",
    shortCode: "IIT Bombay",
    type: "university",
    tier: "Tier 1 — Official Source",
    portalUrl: "https://www.iitb.ac.in",
    notificationUrl: "https://www.ircc.iitb.ac.in/IRCC-Web/rnd/JobOpportunities.jsp",
    primaryDisciplines: ["Semiconductor Technology", "Analog & Mixed-Signal ICs", "EDA Algorithms", "Spintronics"],
    supportedRoles: ["Junior Research Fellow", "Senior Research Fellow", "Project Research Associate", "PhD Fellow"],
    status: "ACTIVE",
    crawlFrequency: "daily",
  },
  {
    id: "iit-madras",
    name: "Indian Institute of Technology Madras (IITM - IC&SR)",
    shortCode: "IIT Madras",
    type: "university",
    tier: "Tier 1 — Official Source",
    portalUrl: "https://www.iitm.ac.in",
    notificationUrl: "https://icandsr.iitm.ac.in/recruitment/",
    primaryDisciplines: ["RISC-V SHAKTI Processor", "Silicon Photonics", "RF Microelectronics", "VLSI Testing"],
    supportedRoles: ["Project Associate", "Senior Project Officer", "JRF", "MS/PhD Research Scholar"],
    status: "ACTIVE",
    crawlFrequency: "daily",
  },
  {
    id: "iisc",
    name: "Indian Institute of Science Bengaluru (IISc - CeNSE / ECE)",
    shortCode: "IISc",
    type: "university",
    tier: "Tier 1 — Official Source",
    portalUrl: "https://iisc.ac.in",
    notificationUrl: "https://iisc.ac.in/positions-open/",
    primaryDisciplines: ["Semiconductor Fabrication", "GaN Power Electronics", "Quantum Electronics", "VLSI Systems"],
    supportedRoles: ["Research Associate", "JRF", "Project Assistant", "PhD Fellow", "Facility Technologist"],
    status: "ACTIVE",
    crawlFrequency: "daily",
  },
];
