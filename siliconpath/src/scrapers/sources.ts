import type { SourceConfig } from "./types.js";

/**
 * Phase 1 starter set: small and high-confidence (spec says 5–10, verify each
 * before scaling). Deliberately NOT the legacy 30-at-once batch. Mix of one
 * government/PSU HTML source, ATS tenants, one university, and news RSS.
 * Types reflect what each URL actually is (no greenhouse-typed plain career
 * pages, which return nothing).
 */
export const SOURCES: SourceConfig[] = [
  { id: "drdo", name: "DRDO", type: "html", url: "https://www.drdo.gov.in/careers", category: "national-lab-india", batch: 1, active: true },
  { id: "isro", name: "ISRO", type: "html", url: "https://www.isro.gov.in/careers", category: "national-lab-india", batch: 1, active: true },
  { id: "iisc", name: "IISc Bangalore", type: "html", url: "https://www.iisc.ac.in/careers/", category: "university-india", batch: 1, active: true },
  { id: "nvidia", name: "NVIDIA", type: "workday", url: "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite", category: "fabless", batch: 1, active: true },
  { id: "micron", name: "Micron Technology", type: "workday", url: "https://micron.wd1.myworkdayjobs.com/External", category: "semiconductor-idm", batch: 1, active: true },
  { id: "nordic-semi", name: "Nordic Semiconductor", type: "smartrecruiters", url: "https://api.smartrecruiters.com/v1/companies/NordicSemiconductor/postings", category: "semiconductor-idm", batch: 1, active: true },
  { id: "semiengineering", name: "Semiconductor Engineering", type: "rss", url: "https://semiengineering.com/feed/", category: "news-rss", batch: 1, active: true },
  { id: "eetimes", name: "EE Times", type: "rss", url: "https://www.eetimes.com/feed/", category: "news-rss", batch: 1, active: true },
];

export function getSourcesForBatch(batch: number | "all"): SourceConfig[] {
  return SOURCES.filter((s) => s.active && (batch === "all" || s.batch === batch));
}
