import { NextRequest, NextResponse } from "next/server";
import { getCandidateProjects } from "@/lib/candidate-profile-store";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: { userId: string } | Promise<{ userId: string }> }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const userId = resolvedParams?.userId;
  if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  let resolvedUserId = userId;

  if (!isUuid) {
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("username", userId.toLowerCase())
      .maybeSingle();
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    resolvedUserId = profile.id;
  }

  const projects = await getCandidateProjects(resolvedUserId);
  return NextResponse.json({ projects });
}
