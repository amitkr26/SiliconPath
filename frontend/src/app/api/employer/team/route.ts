import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedEmployerUser } from "@/lib/employer-auth";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const { data: dbMembers, error } = await supabaseAdmin
      .from("workspace_members")
      .select("id, employer_id, email, role, status, created_at, updated_at")
      .eq("employer_id", user.id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Build complete list including the owner
    const ownerRecord = {
      id: `owner-${user.id}`,
      email: user.email || "recruiter@workspace.internal",
      role: "owner",
      status: "active",
      display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || "Workspace Lead",
      is_owner: true,
      created_at: user.created_at || new Date().toISOString(),
    };

    const teamList = [
      ownerRecord,
      ...(dbMembers || []).map((m: any) => ({
        id: m.id,
        email: m.email,
        role: m.role,
        status: m.status,
        display_name: m.email.split("@")[0],
        is_owner: false,
        created_at: m.created_at,
      })),
    ];

    return NextResponse.json({
      team: teamList,
      members: teamList,
      total: teamList.length,
      seatsUsed: teamList.length,
      maxSeats: 10,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch team" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { email, role } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const validRoles = ["admin", "recruiter", "hiring_manager", "interviewer"] as const;
    const validatedRole = role && validRoles.includes(role as any) ? role : "recruiter";

    const { data: member, error } = await supabaseAdmin
      .from("workspace_members")
      .upsert(
        {
          employer_id: user.id,
          email: email.trim().toLowerCase(),
          role: validatedRole,
          status: "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "employer_id,email" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      member: {
        id: member.id,
        email: member.email,
        role: member.role,
        status: member.status,
        display_name: member.email.split("@")[0],
        is_owner: false,
      },
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to add team member" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("id");
    const email = searchParams.get("email");

    let query = supabaseAdmin
      .from("workspace_members")
      .delete()
      .eq("employer_id", user.id);

    if (memberId) {
      query = query.eq("id", memberId);
    } else if (email) {
      query = query.eq("email", email.trim().toLowerCase());
    } else {
      return NextResponse.json({ error: "Member ID or email is required" }, { status: 400 });
    }

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Team member removed" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to remove team member" }, { status: 500 });
  }
}