import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = user.user_metadata?.role;
  if (role !== "employer" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const opportunityId = searchParams.get("opportunityId");
  if (!opportunityId) {
    return NextResponse.json({ error: "opportunityId is required" }, { status: 400 });
  }

  try {
    // 1. Fetch opportunity to get tags
    const { data: opp, error: oppError } = await supabaseAdmin
      .from("opportunities")
      .select("tags, title")
      .eq("id", opportunityId)
      .single();

    if (oppError || !opp) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    const tags = opp.tags || [];

    // 2. Query candidates whose skills overlap with tags, or grab top profiles
    const { data: candidates, error: candidateError } = await supabase
      .from("user_profiles")
      .select("id, full_name, headline, skills, avatar_url, city, preferred_location");

    if (candidateError) throw candidateError;

    // 3. Score candidates by matching skills
    const scored = (candidates || [])
      .map((c) => {
        const matchingSkills = (c.skills || []).filter((s: string) =>
          tags.some((t: string) => t.toLowerCase() === s.toLowerCase())
        );
        return {
          ...c,
          matchScore: matchingSkills.length,
          matchingSkills,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    return NextResponse.json({ recommendations: scored });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch candidate recommendations" }, { status: 500 });
  }
}
