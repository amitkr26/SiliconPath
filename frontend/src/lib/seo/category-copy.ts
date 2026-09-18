/**
 * Canonical category landing-page copy, kept OUT of the App Router page module
 * so the audit engine (and CLI) can read real copy without importing Next
 * client components. Mirrors frontend/src/app/category/[category]/page.tsx
 * CATEGORY_CONFIG — keep the two in sync when editing copy.
 */

export interface CategoryCopy {
  title: string;
  h1: string;
  subline: string;
  description: string;
  slugLabel: string;
}

export const CATEGORY_COPY: Record<string, CategoryCopy> = {
  jrf: {
    title: "JRF / Junior Research Fellowship Positions in Electronics 2026",
    h1: "JRF / Junior Research Fellowship Positions in Electronics & Semiconductor — 2026",
    subline: "Verified JRF positions at DRDO, ISRO, CSIR, IITs — updated daily",
    description:
      "Junior Research Fellowship (JRF) positions in electronics and semiconductor science offer MSc and NET/GATE qualified researchers an opportunity to pursue funded PhD research at premier institutions. JRF stipend in 2026 is ₹37,000 per month for the first two years, upgradeable to SRF at ₹42,000 per month. Organizations like DRDO, ISRO, CSIR labs, IITs, and NITs regularly advertise JRF positions.",
    slugLabel: "JRF",
  },
  srf: {
    title: "SRF / Senior Research Fellowship Positions in Electronics 2026",
    h1: "SRF / Senior Research Fellowship Positions in Electronics & Semiconductor — 2026",
    subline: "Senior Research Fellowship positions for experienced researchers",
    description:
      "Senior Research Fellowship (SRF) positions in electronics and semiconductor science are for researchers with 2+ years of JRF experience or PhD qualifications. SRF stipend in 2026 is ₹42,000 per month plus HRA.",
    slugLabel: "SRF",
  },
  phd: {
    title: "PhD Opportunities in Electronics & Semiconductor — 2026",
    h1: "PhD Opportunities in Electronics & Semiconductor — 2026",
    subline: "Fully-funded PhD positions at premier Indian and international institutions",
    description:
      "PhD opportunities in electronics and semiconductor science offer researchers a path to doctoral degrees at institutions like IITs, IISc, CSIR labs, and international universities.",
    slugLabel: "PhD",
  },
  "govt-job": {
    title: "Government Research Jobs in Electronics & Semiconductor 2026",
    h1: "Government Research Jobs in Electronics & Semiconductor — 2026",
    subline: "Scientist, engineer, and technical positions at government research organizations",
    description:
      "Government research jobs in electronics offer stable careers at organizations like DRDO, ISRO, BARC, and CSIR. Positions include Scientist B/C/D, Technical Officer, Research Associate, and Project Engineer.",
    slugLabel: "Govt Job",
  },
  fellowship: {
    title: "Research Fellowships & Scholarships in Electronics 2026",
    h1: "Research Fellowships & Scholarships in Electronics & Semiconductor — 2026",
    subline: "CSIR-UGC JRF, DST-INSPIRE, international scholarships and more",
    description:
      "Research fellowships and scholarships for electronics researchers include CSIR-UGC NET JRF, DST-INSPIRE Fellowship, and international programs like DAAD, SINGA, and MEXT.",
    slugLabel: "Fellowship",
  },
  private: {
    title: "Private Sector Electronics & Semiconductor Jobs 2026",
    h1: "Private Sector Electronics & Semiconductor Jobs — 2026",
    subline: "VLSI, embedded systems, chip design jobs at top semiconductor companies",
    description:
      "Private sector electronics and semiconductor jobs in India span roles like RTL Design, Physical Design, Verification, DFT, and Analog Design at Intel, Qualcomm, AMD, TI, Synopsys, Cadence, Nvidia, and Micron.",
    slugLabel: "Private Job",
  },
  international: {
    title: "International Opportunities for Electronics Researchers 2026",
    h1: "International Opportunities for Electronics Researchers — 2026",
    subline: "PhD positions, fellowships, and research jobs abroad for Indian electronics researchers",
    description:
      "International opportunities for Indian electronics researchers include fully-funded PhD programs, post-doctoral fellowships, and research positions at leading global universities.",
    slugLabel: "International",
  },
};