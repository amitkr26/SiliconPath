"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, Loader2 } from "lucide-react";
import CategoryBadge from "@/components/CategoryBadge";

const CATEGORY_CONFIG: Record<string, {
  title: string;
  h1: string;
  subline: string;
  description: string;
  slugLabel: string;
}> = {
  "jrf": {
    title: "JRF / Junior Research Fellowship Positions in Electronics 2026",
    h1: "JRF / Junior Research Fellowship Positions in Electronics & Semiconductor — 2026",
    subline: "Verified JRF positions at DRDO, ISRO, CSIR, IITs — updated daily",
    description: `Junior Research Fellowship (JRF) positions in electronics and semiconductor science offer MSc and NET/GATE qualified researchers an opportunity to pursue funded PhD research at premier institutions. JRF stipend in 2026 is ₹37,000 per month for the first two years, upgradeable to SRF at ₹42,000 per month. Organizations like DRDO, ISRO, CSIR labs, IITs, and NITs regularly advertise JRF positions.`,
    slugLabel: "JRF",
  },
  "srf": {
    title: "SRF / Senior Research Fellowship Positions in Electronics 2026",
    h1: "SRF / Senior Research Fellowship Positions in Electronics & Semiconductor — 2026",
    subline: "Senior Research Fellowship positions for experienced researchers",
    description: `Senior Research Fellowship (SRF) positions in electronics and semiconductor science are for researchers with 2+ years of JRF experience or PhD qualifications. SRF stipend in 2026 is ₹42,000 per month plus HRA.`,
    slugLabel: "SRF",
  },
  "phd": {
    title: "PhD Opportunities in Electronics & Semiconductor — 2026",
    h1: "PhD Opportunities in Electronics & Semiconductor — 2026",
    subline: "Fully-funded PhD positions at premier Indian and international institutions",
    description: `PhD opportunities in electronics and semiconductor science offer researchers a path to doctoral degrees at institutions like IITs, IISc, CSIR labs, and international universities.`,
    slugLabel: "PhD",
  },
  "govt-job": {
    title: "Government Research Jobs in Electronics & Semiconductor 2026",
    h1: "Government Research Jobs in Electronics & Semiconductor — 2026",
    subline: "Scientist, engineer, and technical positions at government research organizations",
    description: `Government research jobs in electronics offer stable careers at organizations like DRDO, ISRO, BARC, and CSIR. Positions include Scientist B/C/D, Technical Officer, Research Associate, and Project Engineer.`,
    slugLabel: "Govt Job",
  },
  "fellowship": {
    title: "Research Fellowships & Scholarships in Electronics 2026",
    h1: "Research Fellowships & Scholarships in Electronics & Semiconductor — 2026",
    subline: "CSIR-UGC JRF, DST-INSPIRE, international scholarships and more",
    description: `Research fellowships and scholarships for electronics researchers include CSIR-UGC NET JRF, DST-INSPIRE Fellowship, and international programs like DAAD, SINGA, and MEXT.`,
    slugLabel: "Fellowship",
  },
  "private": {
    title: "Private Sector Electronics & Semiconductor Jobs 2026",
    h1: "Private Sector Electronics & Semiconductor Jobs — 2026",
    subline: "VLSI, embedded systems, chip design jobs at top semiconductor companies",
    description: `Private sector electronics and semiconductor jobs in India span roles like RTL Design, Physical Design, Verification, DFT, and Analog Design at Intel, Qualcomm, AMD, TI, Synopsys, Cadence, Nvidia, and Micron.`,
    slugLabel: "Private Job",
  },
  "international": {
    title: "International Opportunities for Electronics Researchers 2026",
    h1: "International Opportunities for Electronics Researchers — 2026",
    subline: "PhD positions, fellowships, and research jobs abroad for Indian electronics researchers",
    description: `International opportunities for Indian electronics researchers include fully-funded PhD programs, post-doctoral fellowships, and research positions at leading global universities.`,
    slugLabel: "International",
  },
};

function resolveCategoryConfig(categorySlug: string) {
  const norm = (categorySlug || "jrf").toLowerCase().trim();
  if (CATEGORY_CONFIG[norm]) return CATEGORY_CONFIG[norm];
  if (norm === "govt" || norm === "government" || norm === "govt_job") return CATEGORY_CONFIG["govt-job"];
  if (norm === "private-job" || norm === "jobs" || norm === "job") return CATEGORY_CONFIG["private"];
  if (norm === "internships") return CATEGORY_CONFIG["jrf"];
  if (norm === "phd-positions") return CATEGORY_CONFIG["phd"];
  if (norm === "fellowships") return CATEGORY_CONFIG["fellowship"];
  return CATEGORY_CONFIG["jrf"];
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const categoryParam = params?.category || "jrf";
  const config = resolveCategoryConfig(categoryParam);

  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategoryOpps = useCallback(async () => {
    setLoading(true);
    try {
      const catDbMap: Record<string, string> = {
        "jrf": "jrf",
        "srf": "srf",
        "phd": "phd",
        "govt-job": "government",
        "govt": "government",
        "government": "government",
        "fellowship": "fellowship",
        "private": "job",
        "internship": "internship",
      };
      const dbCat = catDbMap[categoryParam.toLowerCase()] || "jrf";

      const res = await fetch(`/api/opportunities?category=${dbCat}&limit=30`);
      const data = await res.json();
      if (data && Array.isArray(data.opportunities)) {
        setOpportunities(data.opportunities);
      }
    } catch (e) {
      console.error("Error fetching category opportunities:", e);
    } finally {
      setLoading(false);
    }
  }, [categoryParam]);

  useEffect(() => {
    fetchCategoryOpps();
  }, [fetchCategoryOpps]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/opportunities" className="inline-flex items-center gap-1.5 text-text-secondary hover:text-accent transition-colors text-sm mb-6 font-medium">
        <ArrowLeft className="w-4 h-4" />
        Back to All Opportunities
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-text-primary">{config.h1}</h1>
        <p className="text-text-secondary mt-1 text-sm">{config.subline}</p>
        <p className="text-accent text-sm mt-2 font-semibold">{opportunities.length} Active Positions Verified</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 mb-8">
        <p className="text-text-secondary text-sm leading-relaxed">{config.description}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
        </div>
      ) : opportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {opportunities.map((opp: any) => (
            <Link
              key={opp.id || opp.slug}
              href={`/opportunities/${opp.slug || opp.id}`}
              className="bg-surface border border-border rounded-xl p-5 hover:border-accent/40 transition-all hover:-translate-y-0.5 block shadow-sm"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <CategoryBadge category={opp.category || config.slugLabel} />
                {opp.deadline && (
                  <span className="text-xs text-text-muted">
                    {new Date(opp.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                )}
              </div>
              <h3 className="text-text-primary text-base font-bold line-clamp-2 leading-snug">{opp.title}</h3>
              <p className="text-text-secondary text-sm mt-1 font-medium">{opp.organization}</p>
              {(opp.stipend || opp.location) && (
                <p className="text-text-muted text-xs mt-2 flex items-center gap-2">
                  {opp.stipend && <span className="text-accent font-semibold">{opp.stipend}</span>}
                  {opp.stipend && opp.location && <span>•</span>}
                  {opp.location && <span>{opp.location}</span>}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-14 bg-surface border border-border rounded-xl mb-12">
          <Briefcase className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-primary text-lg font-semibold mb-1">No active positions under this tag right now.</p>
          <p className="text-text-secondary text-sm max-w-md mx-auto mb-4">New verified opportunities are added daily. Browse all open roles across 88 semiconductor organizations.</p>
          <Link href="/opportunities" className="inline-flex items-center gap-2 bg-accent text-[#0F172A] font-semibold rounded-lg px-5 py-2.5 text-sm hover:bg-accent-hover transition-colors">
            Browse All Opportunities
          </Link>
        </div>
      )}
    </div>
  );
}
