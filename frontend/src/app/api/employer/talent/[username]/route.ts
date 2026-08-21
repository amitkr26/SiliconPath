import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { username } = params;
  if (!username) return NextResponse.json({ error: "Username required" }, { status: 400 });

  const cleanUser = username.toLowerCase().replace(/^@/, "");

  try {
    const { data: candidate, error } = await supabaseAdmin
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
        open_to_work_types,
        job_title,
        current_company,
        linkedin_url,
        github_url,
        website_url,
        created_at
      `)
      .eq("username", cleanUser)
      .maybeSingle();

    if (error || !candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    return NextResponse.json({ candidate });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch candidate" }, { status: 500 });
  }
}
