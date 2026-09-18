import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MapPin, GraduationCap, Briefcase } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isCurrentlyAvailable, computeIstToday } from "@/lib/availability";
import { evaluateProgrammaticGate } from "@/lib/seo/gate";
import { countProgrammatic } from "@/lib/seo/data-loader";
import { CATEGORY_SLUGS, SITE_URL } from "@/lib/seo/registry";
import OpportunityCard from "@/components/OpportunityCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export async function generateMetadata(): Promise<Metadata> {
  // Programmatic quality gate: freshers hub with < 3 active verified
  // JRF opportunities fail closed with noindex,follow.
  let robots;
  try {
    const gate = evaluateProgrammaticGate({ category: "jrf" }, await countProgrammatic({ category: "jrf" }));
    if (!gate?.indexable) robots = { index: false, follow: true } as const;
  } catch {
    robots = { index: false, follow: true } as const;
  }

  return {
    title: "VLSI & Semiconductor Jobs for Freshers in India",
    description:
      "Find verified VLSI, semiconductor, and electronics opportunities for freshers and recent graduates. JRF positions, eligibility, and application details for entry-level candidates.",
    alternates: { canonical: `${SITE_URL}/opportunities/freshers` },
    ...(robots ? { robots } : {}),
  };
}

export default async function FreshersHubPage() {
  const today = computeIstToday();
  let opportunities: any[] = [];

  // JRF positions are by definition for freshers/post-MSc graduates.
  // These are the opportunities that specifically address fresher intent.
  if (supabaseAdmin?.from) {
    try {
      const { data } = await supabaseAdmin
        .from("opportunities")
        .select(
          "slug,title,category,location,description,stipend,application_url,deadline,verification_status,is_active,posted_at,posted_date,created_at,last_link_checked"
        )
        .eq("is_active", true)
        .eq("verification_status", "verified")
        .not("verification_status", "eq", "rejected")
        .not("verification_status", "eq", "pending")
        .not("verification_status", "eq", "expired")
        .not("verification_status", "eq", "link_unavailable")
        .eq("category", "JRF");

      if (data) {
        opportunities = data
          .filter((opp: any) => isCurrentlyAvailable(opp, today))
          .sort((a: any, b: any) => (b.created_at || "").localeCompare(a.created_at || ""));
      }
    } catch (err) {
      console.error("[Freshers Hub Data Error]:", err);
    }
  }

  const gate = evaluateProgrammaticGate({ category: "jrf" }, await countProgrammatic({ category: "jrf" }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-2 text-xs font-semibold text-slate-500 flex-wrap">
          <li>
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/opportunities" className="hover:text-slate-900 transition-colors">
              Opportunities
            </Link>
          </li>
          <li>/</li>
          <li className="text-slate-900" aria-current="page">
            Jobs for Freshers
          </li>
        </ol>
      </nav>

      <Link href="/opportunities" className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors text-sm mb-6 font-medium">
        <ArrowLeft className="w-4 h-4" />
        All Opportunities
      </Link>

      {/* FRESHERS HEADER */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg border border-slate-200 flex items-center justify-center">
            <GraduationCap className="text-emerald-600 text-xl" />
          </div>

          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              VLSI & Semiconductor Jobs for Freshers
            </h1>
            <p className="text-slate-600 text-sm font-medium">
              Entry-level opportunities in semiconductor, VLSI, and electronics research for recent graduates and early-career candidates.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 font-medium">
          <span className="text-slate-400">
            <span className="font-medium">Eligibility:</span>
            JRF (Junior Research Fellowship) positions typically require a valid GATE/NET score and a Master's degree in electronics, VLSI, or a related field. These are funded research roles with a stipend of ₹37,000/month (as per DST norms).
          </span>
        </div>

        <p className="text-slate-600 mt-4 text-sm font-medium">
          JRF positions are the primary pathway for freshers entering VLSI and semiconductor research careers in India. These roles are funded by DST, CSIR, and other government bodies, providing a stipend while candidates pursue research.
        </p>

        {opportunities.length > 0 ? (
          <div className="mt-6">
            <p className="text-slate-600 text-sm font-medium mb-2">
              {opportunities.length} {opportunities.length === 1 ? "JRF opportunity" : "JRF opportunities"} available
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {opportunities.map((opp: any) => (
                <OpportunityCard key={opp.slug} opportunity={opp} />
              ))}
            </div>
          </div>
        ) : (
          <Card className="text-center py-12 mb-12">
            <GraduationCap className="w-12 h-12 text-emerald-600/30 mx-auto mb-3" />
            <p className="text-slate-900 text-lg font-bold mb-1">
              No JRF positions available right now
            </p>
            <p className="text-slate-500 text-sm font-medium">
              New JRF positions are posted as they are announced by DST, CSIR, ISRO, and DRDO. Check back regularly for fresh opportunities, or browse all semiconductor openings below.
            </p>
            <div className="mt-4 flex justify-center">
              <Button href="/opportunities" variant="secondary">
                Browse All Opportunities
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}