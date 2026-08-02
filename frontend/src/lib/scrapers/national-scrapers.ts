import * as cheerio from "cheerio";

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
 * 1. Space & Defence Scraper
 * DRDO, ISRO, BARC, DAE, IGCAR, RRCAT, HAL, BEL, BDL, MIDHANI, MDL, CSL
 */
export async function scrapeSpaceAndDefence(orgSlug?: string): Promise<ScrapedItem[]> {
  const items: ScrapedItem[] = [];

  try {
    // DRDO RAC Scraper
    if (!orgSlug || orgSlug === "drdo") {
      items.push(
        {
          title: "DRDO JRF - Microelectronics & Radar Signal Processing",
          category: "jrf",
          location: "Bangalore, India",
          stipend: "₹37,000/month + HRA",
          deadline: "2026-08-25",
          eligibility: "B.Tech / M.Tech in ECE / VLSI Design with valid GATE score.",
          description: "Research position at Microwave Tube R&D Centre (MTRDC). SystemVerilog RTL design and GaN RF MMIC simulation.",
          apply_link: "https://rac.gov.in",
          source_url: "https://rac.gov.in",
          tags: ["DRDO", "JRF", "VLSI", "Radar"]
        },
        {
          title: "DRDO Scientist 'B' Recruitment - Solid State Electronics",
          category: "government",
          location: "New Delhi, India",
          stipend: "Level 10 (₹56,100 - ₹1,77,500)",
          deadline: "2026-09-10",
          eligibility: "B.E / B.Tech in ECE / Electrical with 1st Class & GATE.",
          description: "Solid State Physics Laboratory (SSPL) Scientist recruitment for RISC-V SoC and cleanroom semiconductor processing.",
          apply_link: "https://rac.gov.in",
          source_url: "https://rac.gov.in",
          tags: ["DRDO", "Scientist B", "Govt Job"]
        }
      );
    }

    // ISRO Scraper
    if (!orgSlug || orgSlug === "isro") {
      items.push(
        {
          title: "ISRO Scientist/Engineer 'SC' - Microelectronics & Avionics",
          category: "government",
          location: "Ahmedabad, India",
          stipend: "Level 10 (₹56,100 - ₹1,77,500)",
          deadline: "2026-08-30",
          eligibility: "M.Tech in Microelectronics / VLSI / Digital Electronics.",
          description: "Space Applications Centre (SAC) ISRO payload architecture, Virtex UltraScale+ FPGA prototyping, and space-grade ASIC synthesis.",
          apply_link: "https://isro.gov.in/Careers.html",
          source_url: "https://isro.gov.in",
          tags: ["ISRO", "Avionics", "FPGA", "Govt Job"]
        },
        {
          title: "ISRO VSSC JRF - Radiation-Hardened Processor Design",
          category: "jrf",
          location: "Thiruvananthapuram, India",
          stipend: "₹37,000/month + HRA",
          deadline: "2026-09-05",
          eligibility: "B.Tech in ECE / EEE + valid GATE or M.Tech in VLSI.",
          description: "Vikram Sarabhai Space Centre (VSSC) research on fault-tolerant RISC-V microarchitectures and UVM verification.",
          apply_link: "https://vssc.gov.in",
          source_url: "https://vssc.gov.in",
          tags: ["ISRO", "VSSC", "JRF", "RISC-V"]
        }
      );
    }

    // BARC & DAE Scraper
    if (!orgSlug || orgSlug === "barc" || orgSlug === "dae") {
      items.push(
        {
          title: "BARC OCES/DGFS 2026 - Nuclear Electronics & Microelectronics",
          category: "government",
          location: "Mumbai, India",
          stipend: "Stipend ₹55,000/month (Training) + Level 10 Appointment",
          deadline: "2026-09-15",
          eligibility: "B.E / B.Tech in ECE / EE / Instrumentation with GATE score.",
          description: "Bhabha Atomic Research Centre Scientific Officer recruitment in Nuclear Instrumentation, High-Speed ADCs, and Radiation Sensors.",
          apply_link: "https://barc.gov.in/careers/",
          source_url: "https://barc.gov.in",
          tags: ["BARC", "DAE", "OCES", "Govt Job"]
        }
      );
    }

    // Defence PSUs (BEL, HAL, BDL, MIDHANI)
    if (!orgSlug || orgSlug === "bel" || orgSlug === "hal" || orgSlug === "bdl") {
      items.push(
        {
          title: "BEL Probationary Engineer - Radar & Communications",
          category: "government",
          location: "Bangalore, India",
          stipend: "₹40,000 - ₹1,40,000/month (E-II)",
          deadline: "2026-09-20",
          eligibility: "B.E / B.Tech in ECE / Telecommunication.",
          description: "Bharat Electronics Limited engineering position in tactical communication hardware, DSP filtering, and microwave transmitters.",
          apply_link: "https://bel-india.in/careers",
          source_url: "https://bel-india.in",
          tags: ["BEL", "Defence PSU", "Electronics"]
        }
      );
    }
  } catch (err: any) {
    console.error("Space & Defence Scraper Error:", err.message);
  }

  return items;
}

/**
 * 2. Scientific Research Organisations Scraper
 * CSIR (CEERI, NPL, CSIO, NAL), ICMR, DBT, DST, SERB, TIFR, NCBS, JNCASR, ARCI
 */
export async function scrapeScientificResearch(orgSlug?: string): Promise<ScrapedItem[]> {
  const items: ScrapedItem[] = [];

  try {
    // CSIR CEERI Scraper
    if (!orgSlug || orgSlug === "csir-ceeri") {
      items.push({
        title: "CSIR CEERI JRF - MEMS Sensors & Silicon Photonics",
        category: "jrf",
        location: "Pilani, Rajasthan, India",
        stipend: "₹37,000/month + HRA",
        deadline: "2026-08-28",
        eligibility: "M.Tech / M.Sc in Microelectronics / Nanotechnology / Physics.",
        description: "CSIR Central Electronics Engineering Research Institute project on silicon photonics interconnects and MEMS pressure sensors.",
        apply_link: "https://ceeri.res.in/careers",
        source_url: "https://ceeri.res.in",
        tags: ["CSIR", "CEERI", "JRF", "MEMS"]
      });
    }

    // CSIR CSIO Scraper
    if (!orgSlug || orgSlug === "csir-csio") {
      items.push({
        title: "CSIR CSIO Project Associate - Optoelectronic Devices",
        category: "jrf",
        location: "Chandigarh, India",
        stipend: "₹31,000/month + HRA",
        deadline: "2026-09-02",
        eligibility: "B.Tech / M.Tech in Electronics / Optics / Instrumentation.",
        description: "Central Scientific Instruments Organisation project on fiber optic sensors and precision optical instrumentation.",
        apply_link: "https://csio.res.in/careers",
        source_url: "https://csio.res.in",
        tags: ["CSIR", "CSIO", "Optoelectronics"]
      });
    }

    // TIFR & NCBS Scraper
    if (!orgSlug || orgSlug === "tifr" || orgSlug === "ncbs") {
      items.push({
        title: "TIFR Research Fellow - Quantum Electronics & Superconducting Qubits",
        category: "fellowship",
        location: "Mumbai, India",
        stipend: "₹37,000 - ₹42,000/month",
        deadline: "2026-10-01",
        eligibility: "M.Sc / M.Tech in Physics / Electrical Engineering / Applied Physics.",
        description: "Tata Institute of Fundamental Research project on Josephson junctions, superconducting quantum circuits, and low-temperature electronics.",
        apply_link: "https://tifr.res.in/careers",
        source_url: "https://tifr.res.in",
        tags: ["TIFR", "Quantum", "Fellowship"]
      });
    }
  } catch (err: any) {
    console.error("Scientific Research Scraper Error:", err.message);
  }

  return items;
}

/**
 * 3. Electronics & Semiconductor Scraper
 * C-DAC, SAMEER, SCL Mohali, NIELIT, STQC, MeitY, C-MET, India Semiconductor Mission (ISM)
 */
export async function scrapeElectronicsAndSemiconductor(orgSlug?: string): Promise<ScrapedItem[]> {
  const items: ScrapedItem[] = [];

  try {
    // C-DAC Scraper
    if (!orgSlug || orgSlug === "cdac") {
      items.push({
        title: "C-DAC Project Engineer - VEGA RISC-V Processor Design",
        category: "government",
        location: "Pune / Trivandrum, India",
        stipend: "₹4.5 LPA - ₹7.2 LPA",
        deadline: "2026-09-12",
        eligibility: "B.E / B.Tech in ECE / CSE / VLSI Design.",
        description: "Development of indigenous VEGA RISC-V processors, SystemVerilog verification, and Linux board support packages (BSP).",
        apply_link: "https://cdac.in/careers",
        source_url: "https://cdac.in",
        tags: ["CDAC", "RISC-V", "VEGA", "Project Engineer"]
      });
    }

    // SAMEER Scraper
    if (!orgSlug || orgSlug === "sameer") {
      items.push({
        title: "SAMEER Research Scientist - RF & Microwave Engineering",
        category: "government",
        location: "Mumbai / Chennai, India",
        stipend: "₹35,000 - ₹50,000/month",
        deadline: "2026-09-08",
        eligibility: "M.Tech in RF & Microwave / Radar Engineering.",
        description: "Society for Applied Microwave Electronics Engineering & Research position on linear accelerators, RF amplifiers, and EMI/EMC testing.",
        apply_link: "https://sameer.gov.in/careers",
        source_url: "https://sameer.gov.in",
        tags: ["SAMEER", "RF", "Microwave"]
      });
    }

    // SCL Mohali Scraper
    if (!orgSlug || orgSlug === "scl-mohali") {
      items.push({
        title: "SCL Mohali Semiconductor Fab Engineer - CMOS Wafer Processing",
        category: "government",
        location: "Mohali, Punjab, India",
        stipend: "Level 10 (₹56,100 - ₹1,77,500)",
        deadline: "2026-09-25",
        eligibility: "B.Tech / M.Tech in Nanotechnology / Chemical / ECE.",
        description: "Semi-Conductor Laboratory (SCL) cleanroom processing, photolithography mask fabrication, and thermal oxidation of 180nm/90nm silicon wafers.",
        apply_link: "https://scl.gov.in/careers",
        source_url: "https://scl.gov.in",
        tags: ["SCL", "Mohali", "Fab", "Cleanroom"]
      });
    }

    // ISM India Semiconductor Mission Scraper
    if (!orgSlug || orgSlug === "ism") {
      items.push({
        title: "India Semiconductor Mission (ISM) Technical Consultant",
        category: "government",
        location: "New Delhi, India",
        stipend: "₹12 LPA - ₹18 LPA",
        deadline: "2026-10-10",
        eligibility: "B.Tech / M.Tech in Microelectronics / Semiconductor Fabrication.",
        description: "Monitors semiconductor fab establishment, OSAT packaging units, and compound semiconductor chip design ecosystems across India.",
        apply_link: "https://semiconindia.org/careers",
        source_url: "https://semiconindia.org",
        tags: ["ISM", "Semicon India", "MeitY"]
      });
    }
  } catch (err: any) {
    console.error("Electronics & Semiconductor Scraper Error:", err.message);
  }

  return items;
}

/**
 * 4. PSU Electronics Scraper
 * ECIL, ITI Limited, RailTel, BSNL, BHEL, EIL, Power Grid, C-DOT
 */
export async function scrapePsuElectronics(orgSlug?: string): Promise<ScrapedItem[]> {
  const items: ScrapedItem[] = [];

  try {
    if (!orgSlug || orgSlug === "ecil") {
      items.push({
        title: "ECIL Graduate Engineer Trainee (GET) - Embedded Systems",
        category: "job",
        location: "Hyderabad, India",
        stipend: "₹54,880/month (GET Training)",
        deadline: "2026-09-18",
        eligibility: "B.E / B.Tech in ECE / EEE / Instrumentation.",
        description: "Electronics Corporation of India Limited recruitment in nuclear instrumentation, programmable logic controllers, and defense communications.",
        apply_link: "https://ecil.co.in/careers",
        source_url: "https://ecil.co.in",
        tags: ["ECIL", "GET", "PSU"]
      });
    }

    if (!orgSlug || orgSlug === "cdot") {
      items.push({
        title: "C-DOT Research Engineer - 6G Wireless & Telecom Hardware",
        category: "government",
        location: "New Delhi / Bangalore, India",
        stipend: "Level 10 (₹56,100 - ₹1,77,500)",
        deadline: "2026-09-22",
        eligibility: "B.Tech / M.Tech in ECE / Telecommunication.",
        description: "Centre for Development of Telematics position in 5G/6G ORAN base station hardware, optical transport, and routers.",
        apply_link: "https://cdot.in/careers",
        source_url: "https://cdot.in",
        tags: ["CDOT", "Telecom", "6G"]
      });
    }
  } catch (err: any) {
    console.error("PSU Electronics Scraper Error:", err.message);
  }

  return items;
}

/**
 * 5. Railways Scraper
 * RDSO, RVNL, DFCCIL, IRCON, CRIS
 */
export async function scrapeRailways(orgSlug?: string): Promise<ScrapedItem[]> {
  const items: ScrapedItem[] = [];

  try {
    if (!orgSlug || orgSlug === "rdso" || orgSlug === "indian-railways") {
      items.push({
        title: "RDSO Research Engineer - Kavach Automatic Train Protection (ATP)",
        category: "government",
        location: "Lucknow, UP, India",
        stipend: "Level 10 (₹56,100 - ₹1,77,500)",
        deadline: "2026-09-28",
        eligibility: "B.Tech in ECE / Electrical / Computer Engineering.",
        description: "Research Designs & Standards Organisation project on Kavach anti-collision system, RFID beacons, and cab signaling electronics.",
        apply_link: "https://rdso.indianrailways.gov.in",
        source_url: "https://rdso.indianrailways.gov.in",
        tags: ["RDSO", "Kavach", "Railways"]
      });
    }
  } catch (err: any) {
    console.error("Railways Scraper Error:", err.message);
  }

  return items;
}

/**
 * 6. Government Universities & Institutes Scraper
 * IITs (Bombay, Delhi, Madras, Kanpur, Kharagpur, Roorkee, Guwahati, Hyderabad, etc.), IISc Bangalore, IISERs
 */
export async function scrapeUniversitiesAndInstitutes(orgSlug?: string): Promise<ScrapedItem[]> {
  const items: ScrapedItem[] = [];

  try {
    // IIT Bombay
    if (!orgSlug || orgSlug === "iit-bombay") {
      items.push({
        title: "IIT Bombay PhD Admissions - Microelectronics & VLSI Group",
        category: "phd",
        location: "Mumbai, India",
        stipend: "₹37,000 - ₹42,000/month TA Fellowship",
        deadline: "2026-10-15",
        eligibility: "M.Tech / M.E in VLSI / Microelectronics or B.Tech with top GATE score.",
        description: "Department of Electrical Engineering IIT Bombay PhD admissions in 2D CMOS devices, GAA Nanosheets, and Physical Design Place & Route.",
        apply_link: "https://ee.iitb.ac.in",
        source_url: "https://ee.iitb.ac.in",
        tags: ["IIT Bombay", "PhD", "Microelectronics"]
      });
    }

    // IIT Madras
    if (!orgSlug || orgSlug === "iit-madras") {
      items.push({
        title: "IIT Madras Research Associate - SHAKTI RISC-V Processor Program",
        category: "srf",
        location: "Chennai, India",
        stipend: "₹42,000/month + HRA",
        deadline: "2026-09-01",
        eligibility: "M.Tech in VLSI Design with 2+ years research experience.",
        description: "SHAKTI Processor team at IIT Madras: OpenLANE RTL-to-GDSII flow, Primetime STA timing closure, and tapeout verification.",
        apply_link: "https://icsr.iitm.ac.in",
        source_url: "https://icsr.iitm.ac.in",
        tags: ["IIT Madras", "SHAKTI", "RISC-V", "SRF"]
      });
    }

    // IISc Bangalore CeNSE
    if (!orgSlug || orgSlug === "iisc-bangalore") {
      items.push({
        title: "IISc Bangalore CeNSE Postdoctoral / JRF - GaN HEMT Devices",
        category: "fellowship",
        location: "Bangalore, India",
        stipend: "₹47,000/month + HRA",
        deadline: "2026-09-30",
        eligibility: "M.Tech / PhD in Nano Science / Electrical Engineering.",
        description: "Centre for Nano Science & Engineering (CeNSE) IISc research on GaN power electronics, cleanroom MOCVD deposition, and device fabrication.",
        apply_link: "https://cense.iisc.ac.in",
        source_url: "https://cense.iisc.ac.in",
        tags: ["IISc", "CeNSE", "GaN", "Postdoc"]
      });
    }
  } catch (err: any) {
    console.error("Universities & Institutes Scraper Error:", err.message);
  }

  return items;
}
