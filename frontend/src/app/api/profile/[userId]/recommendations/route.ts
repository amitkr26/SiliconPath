import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase";
import { apiError } from "@/lib/api-utils";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveTargetUserId(param: string): Promise<string> {
  if (UUID_REGEX.test(param)) return param;
  const { data: prof } = await supabaseAdmin
    .from("user_profiles")
    .select("id")
    .ilike("username", param)
    .maybeSingle();
  return prof?.id || param;
}

export async function GET(request: NextRequest, { params }: { params: { userId: string } | Promise<{ userId: string }> }) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const rawId = resolvedParams?.userId;
  if (!rawId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const targetId = await resolveTargetUserId(rawId);
  let query = supabaseAdmin
    .from("recommendations")
    .select("*, author:user_profiles(display_name, avatar_url, headline)")
    .eq("recipient_id", targetId);

  if (!user || user.id !== targetId) {
    query = query.eq("is_visible", true);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    // Fallback to non-joined query if foreign key alias differs
    const { data: fallbackData } = await supabaseAdmin
      .from("recommendations")
      .select("*")
      .eq("recipient_id", targetId)
      .order("created_at", { ascending: false });
    return NextResponse.json({ recommendations: fallbackData || [] });
  }
  return NextResponse.json({ recommendations: data || [] });
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } | Promise<{ userId: string }> }) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const rawId = resolvedParams?.userId;
  if (!rawId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const targetId = await resolveTargetUserId(rawId);
  if (user.id === targetId) {
    return NextResponse.json({ error: "Cannot recommend yourself" }, { status: 400 });
  }

  const { content, relationship } = await request.json();
  if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const { data, error } = await supabaseAdmin.from("recommendations").insert({
    author_id: user.id,
    recipient_id: targetId,
    content,
    relationship: relationship || "",
  }).select("*").single();

  if (error) return apiError(error, "profile-recommendations-create");
  return NextResponse.json(data, { status: 201 });
}
