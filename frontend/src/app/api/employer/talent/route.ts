import { NextRequest, NextResponse } from "next/server";
import { requireEmployerRole } from "@/lib/employer-auth";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await requireEmployerRole(request);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";
  const domain = searchParams.get("domain") || "all";
  const minExp = searchParams.get("minExp");

  try {
    let q = supabaseAdmin
      .from("user_profiles")
      .select(`
        id,
        username,
        display_name,
        avatar_url,
        headline,
        bio,
        skills,
        interests,
        location,
        country,
        experience_years,
        is_open_to_work,
        job_title,
        current_company,
        linkedin_url,
        github_url,
        website_url,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(60);

    if (query) {
      q = q.or(`display_name.ilike.%${query}%,headline.ilike.%${query}%,bio.ilike.%${query}%,username.ilike.%${query}%`);
    }

    if (minExp && Number(minExp) > 0) {
      q = q.gte("experience_years", Number(minExp));
    }

    const { data: candidates, error } = await q;

    if (error) {
      return NextResponse.json({ candidates: [], total: 0 });
    }

    // Filter by domain/skill if specified
    let filtered = candidates || [];
    if (domain && domain !== "all") {
      filtered = filtered.filter((c: any) => {
        const skills = (c.skills || []).map((s: string) => s.toLowerCase());
        const headline = (c.headline || "").toLowerCase();
        const dLower = domain.toLowerCase();
        return skills.some((s: string) => s.includes(dLower)) || headline.includes(dLower);
      });
    }

    return NextResponse.json({
      candidates: filtered,
      total: filtered.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to search talent" }, { status: 500 });
  }
}
