import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { mapDbOpportunityToClient } from "@/lib/utils";
import { apiError } from "@/lib/api-utils";

export async function GET() {
  if (!supabaseAdmin?.from) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { data, error } = await supabaseAdmin
    .from("opportunities")
    .select("*")
    .eq("is_active", true)
    .eq("verification_status", "verified")
    .order("created_at", { ascending: false });

  if (error) {
    return apiError(error, "opportunities-feed");
  }

  // P0.4: hand-rolled mapping read dead columns (organization, stipend, apply_link).
  // Reuse mapDbOpportunityToClient — resolves org name + salary_range→stipend + apply_url.
  const opportunities = (data || []).map((row: any) => {
    const m = mapDbOpportunityToClient(row) || {};
    return {
      title: m.title,
      organization: m.organization,
      category: row.category,
      location: m.location,
      stipend: m.stipend,
      deadline: m.deadline,
      eligibility: m.eligibility,
      tags: m.tags,
      slug: m.slug,
      url: `https://berojgardegreewala.vercel.app/opportunities/${m.slug}`,
      apply_url: m.apply_link,
      verification_status: m.verification_status,
    };
  });

  return NextResponse.json({
    platform: "BerojgarDegreeWala",
    description: "Electronics and semiconductor opportunities aggregator",
    last_updated: new Date().toISOString(),
    total_count: opportunities.length,
    opportunities,
  });
}
