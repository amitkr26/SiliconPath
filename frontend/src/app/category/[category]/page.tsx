import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isCurrentlyAvailable, computeIstToday, buildAvailabilityDbFilter } from "@/lib/availability";
import CategoryClient from "./CategoryClient";

export const revalidate = 3600;

export const CATEGORY_CONFIG: Record<
  string,
  {
    title: string;
    h1: string;
    subline: string;
    description: string;
    slugLabel: string;
  }
> = {
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

export function resolveCategoryConfig(categorySlug: string) {
  const norm = (categorySlug || "jrf").toLowerCase().trim();
  if (CATEGORY_CONFIG[norm]) return CATEGORY_CONFIG[norm];
  if (norm === "govt" || norm === "government" || norm === "govt_job") return CATEGORY_CONFIG["govt-job"];
  if (norm === "private-job" || norm === "jobs" || norm === "job") return CATEGORY_CONFIG["private"];
  if (norm === "internships" || norm === "internship") return CATEGORY_CONFIG["jrf"];
  if (norm === "phd-positions") return CATEGORY_CONFIG["phd"];
  if (norm === "fellowships") return CATEGORY_CONFIG["fellowship"];
  return CATEGORY_CONFIG["jrf"];
}

export function generateStaticParams() {
  return [
    { category: "jrf" },
    { category: "srf" },
    { category: "phd" },
    { category: "govt-job" },
    { category: "fellowship" },
    { category: "private" },
    { category: "international" },
  ];
}

interface Props {
  params: { category: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const config = resolveCategoryConfig(params.category);
  const canonicalUrl = `https://berojgardegreewala.vercel.app/category/${params.category.toLowerCase()}`;

  return {
    title: config.title,
    description: config.description.slice(0, 160),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${config.title} | BerojgarDegreeWala`,
      description: config.description.slice(0, 160),
      url: canonicalUrl,
      type: "website",
    },
  };
}

const CAT_DB_MAP: Record<string, string> = {
  jrf: "jrf",
  srf: "srf",
  phd: "phd",
  "govt-job": "government",
  govt: "government",
  government: "government",
  fellowship: "fellowship",
  private: "job",
  "private-job": "job",
  jobs: "job",
  job: "job",
  internship: "internship",
  international: "international",
};

async function getCategoryOpportunities(categorySlug: string) {
  if (!supabaseAdmin?.from) return [];
  const dbCat = CAT_DB_MAP[categorySlug.toLowerCase()] || "jrf";
  const today = computeIstToday();

  try {
    const { data } = await supabaseAdmin
      .from("opportunities")
      .select("*, organizations(*)")
      .eq("is_active", true)
      .eq("verification_status", "verified")
      .not("verification_status", "eq", "rejected")
      .not("verification_status", "eq", "pending")
      .not("verification_status", "eq", "expired")
      .not("verification_status", "eq", "link_unavailable")
      .ilike("category", `%${dbCat}%`)
      .or(buildAvailabilityDbFilter(today))
      .order("created_at", { ascending: false })
      .limit(30);

    if (!data) return [];
    return data.filter((opp: any) => isCurrentlyAvailable(opp, today));
  } catch (err) {
    console.error("[Category Opportunities Fetch Error]:", err);
    return [];
  }
}

export default async function CategoryPage({ params }: Props) {
  const categoryParam = params.category || "jrf";
  const config = resolveCategoryConfig(categoryParam);
  const opportunities = await getCategoryOpportunities(categoryParam);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://berojgardegreewala.vercel.app" },
      { "@type": "ListItem", position: 2, name: "Categories", item: "https://berojgardegreewala.vercel.app/categories" },
      { "@type": "ListItem", position: 3, name: config.slugLabel, item: `https://berojgardegreewala.vercel.app/category/${categoryParam}` },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: config.h1,
    itemListElement: opportunities.slice(0, 20).map((opp: any, idx: number) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: opp.title,
      url: `https://berojgardegreewala.vercel.app/opportunities/${opp.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <CategoryClient
        categoryParam={categoryParam}
        config={config}
        initialOpportunities={opportunities}
      />
    </>
  );
}