import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { profileUpdateSchema } from "@/lib/validation";
import { validateOrThrow } from "@/lib/validation";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  return NextResponse.json({ profile: data, user: { id: user.id, email: user.email } });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { role, ...profileUpdates } = body;

  // P0.5 RBAC: "admin" is never client-settable — it was a self-serve
  // privilege escalation. employer/candidate remain self-service; admin is
  // granted out-of-band only (server-side secret-based admin console).
  if (role === "admin") {
    return NextResponse.json({ error: "Forbidden: admin role cannot be self-assigned" }, { status: 403 });
  }
  if (role && (role === "employer" || role === "candidate")) {
    const { error: authError } = await supabase.auth.updateUser({
      data: { role }
    });
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  const updates = validateOrThrow(profileUpdateSchema, profileUpdates);

  const { data, error } = await supabase
    .from("user_profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profile: data });
}