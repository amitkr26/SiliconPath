import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { profileUpdateSchema } from "@/lib/validation";
import { validateOrThrow } from "@/lib/validation";

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { role, ...profileUpdates } = body;

  if (role && (role === "employer" || role === "candidate" || role === "admin")) {
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