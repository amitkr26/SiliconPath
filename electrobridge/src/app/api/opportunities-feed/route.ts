import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  if (!supabaseAdmin?.from) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { data } = await supabaseAdmin
    .from("opportunities")
    .select("*")
    .eq("is_active", true)
    .eq("verification_status", "verified")
    .order("created_at", { ascending: false });

  return NextResponse.json({
    platform: "ElectroBridge",
    description: "Electronics and semiconductor opportunities aggregator",
    last_updated: new Date().toISOString(),
    total_count: data?.length || 0,
    opportunities: (data || []).map((opp: { title: string; organization: string; category: string; location: string | null; stipend: string | null; deadline: string | null; eligibility: string | null; tags: string[]; slug: string; apply_link: string | null; official_page_url: string | null; verification_status: string }) => ({
      title: opp.title,
      organization: opp.organization,
      category: opp.category,
      location: opp.location,
      stipend: opp.stipend,
      deadline: opp.deadline,
      eligibility: opp.eligibility,
      tags: opp.tags,
      url: `https://electrobridge.vercel.app/opportunities/${opp.slug}`,
      apply_url: opp.apply_link,
      official_url: opp.official_page_url,
      verification_status: opp.verification_status,
    })),
  });
}
