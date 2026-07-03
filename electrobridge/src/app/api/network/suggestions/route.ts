import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "12"), 20);

  // Get connected user IDs
  const { data: connections } = await supabase
    .from("connections")
    .select("user_id_1, user_id_2")
    .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

  const connectedIds = new Set<string>();
  if (connections) {
    connections.forEach((c) => {
      if (c.user_id_1 === user.id) connectedIds.add(c.user_id_2);
      if (c.user_id_2 === user.id) connectedIds.add(c.user_id_1);
    });
  }

  // Get IDs to exclude (already connected, already sent request)
  const { data: sentRequests } = await supabase
    .from("connection_requests")
    .select("receiver_id")
    .eq("sender_id", user.id);

  const excludeIds = new Set([user.id]);
  connectedIds.forEach((id) => excludeIds.add(id));
  (sentRequests || []).forEach((r) => excludeIds.add(r.receiver_id));

  // Get current user profile for matching
  const { data: myProfile } = await supabase
    .from("user_profiles")
    .select("current_org, city, specialization, skills")
    .eq("id", user.id)
    .single();

  let query = supabase
    .from("user_profiles")
    .select("*")
    .eq("is_profile_public", true)
    .order("connection_count", { ascending: false })
    .limit(50);

  const { data: candidates } = await query;
  if (!candidates) return NextResponse.json({ suggestions: [] });

  // Score candidates
  const scored = candidates
    .filter((c: any) => !excludeIds.has(c.id))
    .map((c: any) => {
      let score = 0;
      if (myProfile?.current_org && c.current_org === myProfile.current_org) score += 10;
      if (myProfile?.city && c.city === myProfile.city) score += 5;
      if (myProfile?.specialization && c.specialization && c.specialization.toLowerCase() === myProfile.specialization.toLowerCase()) score += 8;
      const mySkills = (myProfile?.skills || []) as string[];
      const theirSkills = (c.skills || []) as string[];
      const common = mySkills.filter((s: string) => theirSkills.includes(s));
      score += common.length * 3;
      return { ...c, score, mutual_skills: common };
    })
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, limit);

  return NextResponse.json({ suggestions: scored });
}
