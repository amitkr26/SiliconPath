import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
import { matchOpportunities } from "@/lib/ai/matcher";
import type { UserProfile } from "@/lib/ai/matcher";
import { apiError } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // ponytail: require authentication to prevent free AI credit consumption
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  try {
    const profile: UserProfile = await request.json();

    const { data: opportunities } = await supabaseAdmin
      .from("opportunities")
      .select("*")
      .eq("is_active", true)
      .neq("verification_status", "pending")
      .neq("verification_status", "rejected")
      .limit(50);

    if (!opportunities || opportunities.length === 0) {
      return NextResponse.json({ matches: [], count: 0 });
    }

    const matches = await matchOpportunities(profile, opportunities);

    return NextResponse.json({ matches, count: matches.length });
  } catch (error) {
    return apiError(error, "ai-match");
  }
}
