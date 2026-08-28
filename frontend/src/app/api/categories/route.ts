import { NextResponse } from "next/server";
import { canonicalCategories } from "@/lib/categories";

export const dynamic = "force-static";
export const revalidate = 86400; // 24 hours

export async function GET() {
  const categories = [
    { key: "all", label: "All Opportunities", slug: "all" },
    { key: "jrf", label: "Junior Research Fellow (JRF)", slug: "jrf" },
    { key: "srf", label: "Senior Research Fellow (SRF)", slug: "srf" },
    { key: "phd", label: "PhD Research Fellowships", slug: "phd" },
    { key: "government", label: "Govt & PSU Labs (DRDO, ISRO)", slug: "government" },
    { key: "fellowship", label: "International & National Fellowships", slug: "fellowship" },
    { key: "internship", label: "Internships & Traineeships", slug: "internship" },
    { key: "industry", label: "Semiconductor Industry & Private Jobs", slug: "industry" },
  ];

  return NextResponse.json({
    categories,
    canonical_keys: canonicalCategories(),
  });
}
