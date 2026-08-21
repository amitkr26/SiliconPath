import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    // Fetch profile
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("id, email, display_name, username, avatar_url, current_company, account_type")
      .eq("id", user.id)
      .single();

    // Query other members with same organization/company if available
    let members: any[] = [
      {
        id: user.id,
        email: user.email,
        display_name: profile?.display_name || user.email?.split("@")[0],
        username: profile?.username,
        role: "Primary Owner / Lead Recruiter",
        is_owner: true,
      },
    ];

    if (profile?.current_company) {
      const { data: colleagues } = await supabaseAdmin
        .from("user_profiles")
        .select("id, email, display_name, username, account_type")
        .eq("current_company", profile.current_company)
        .neq("id", user.id);

      if (colleagues && colleagues.length > 0) {
        members = members.concat(
          colleagues.map((c: { id: string; email: string; display_name?: string; username?: string; account_type?: string }) => ({
            id: c.id,
            email: c.email,
            display_name: c.display_name,
            username: c.username,
            role: "Co-Recruiter",
            is_owner: false,
          }))
        );
      }
    }

    return NextResponse.json({ members });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch team" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user already exists on platform
    const { data: targetUser } = await supabaseAdmin
      .from("user_profiles")
      .select("id, display_name, email")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (targetUser) {
      // Send notification to existing user
      await supabaseAdmin.from("notifications").insert({
        user_id: targetUser.id,
        type: "system",
        message: `You have been invited to join the recruitment team as a ${role || "Recruiter"}!`,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Workspace invite dispatched to ${email}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to invite team member" }, { status: 500 });
  }
}
