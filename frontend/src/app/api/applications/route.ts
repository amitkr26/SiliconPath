import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedEmployerUser } from "@/lib/employer-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("applications")
    .select(
      "id, status, applied_at, notes, updated_at, opportunity:opportunities(id, title, organization:organizations(name), slug, deadline, location), user_profile:user_profiles!applications_user_id_fkey(display_name, avatar_url, headline)"
    )
    .eq("user_id", user.id)
    .order("applied_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const applications = (data || []).map((app: any) => ({
    ...app,
    opportunity: app.opportunity
      ? { ...app.opportunity, organization: app.opportunity.organization?.name ?? null }
      : app.opportunity,
  }));
  return NextResponse.json({ applications });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const opportunity_id = body.opportunity_id || body.opportunityId;
  const status = body.status || "applied";
  const notes = body.notes || null;

  if (!opportunity_id) {
    return NextResponse.json({ error: "opportunity_id required" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("applications")
    .select("id")
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunity_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ application: existing, alreadyApplied: true }, { status: 200 });
  }

  const { data, error } = await supabaseAdmin
    .from("applications")
    .insert({ user_id: user.id, opportunity_id, status, notes })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ application: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, status, notes } = body;

  if (!id) return NextResponse.json({ error: "Application ID required" }, { status: 400 });

  const updates: Record<string, string> = { updated_at: new Date().toISOString() };
  if (status) {
    return NextResponse.json(
      { error: "Forbidden: Application status changes are restricted to employers. Candidates may withdraw an application using DELETE." },
      { status: 403 }
    );
  }
  if (notes !== undefined) updates.notes = notes;

  const { error } = await supabaseAdmin
    .from("applications")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let id = request.nextUrl?.searchParams?.get("id") || new URL(request.url).searchParams.get("id");
  if (!id) {
    try {
      const body = await request.json();
      id = body?.id;
    } catch {
      // Body may be empty if id was in query param
    }
  }
  if (!id) return NextResponse.json({ error: "Application ID required" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("applications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
