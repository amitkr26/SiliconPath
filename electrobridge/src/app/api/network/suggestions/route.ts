import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "12"), 50);

  // 1. Get connected user IDs
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

  // 2. Get connection requests (both sent and received)
  const { data: sentRequests } = await supabase
    .from("connection_requests")
    .select("receiver_id")
    .eq("sender_id", user.id);

  const { data: receivedRequests } = await supabase
    .from("connection_requests")
    .select("sender_id")
    .eq("receiver_id", user.id);

  // Build exclusion list (self, connections, pending sent, pending received)
  const excludeIds = new Set<string>([user.id]);
  connectedIds.forEach((id) => excludeIds.add(id));
  (sentRequests || []).forEach((r) => excludeIds.add(r.receiver_id));
  (receivedRequests || []).forEach((r) => excludeIds.add(r.sender_id));

  // 3. Fetch candidate profile matches (all registered profiles)
  // Fetch up to 100 profiles to score and filter
  const { data: candidates, error: candidateError } = await supabase
    .from("user_profiles")
    .select("*")
    .limit(100);

  if (candidateError || !candidates) {
    return NextResponse.json({ suggestions: [] });
  }

  // Get current user profile details to calculate match weights
  const { data: myProfile } = await supabase
    .from("user_profiles")
    .select("current_org, city, skills")
    .eq("id", user.id)
    .single();

  const mySkills = (myProfile?.skills || []) as string[];
  const myCity = myProfile?.city || "";
  const myOrg = myProfile?.current_org || "";

  // 4. Filter and score suggestions
  const scored = candidates
    .filter((c: any) => !excludeIds.has(c.id) && c.full_name) // exclude self/connections and require name
    .map((c: any) => {
      let score = 0;
      // Match current company/organization
      if (myOrg && c.current_org && c.current_org.toLowerCase() === myOrg.toLowerCase()) {
        score += 15;
      }
      // Match same city
      if (myCity && c.city && c.city.toLowerCase() === myCity.toLowerCase()) {
        score += 8;
      }
      // Match common skills
      const theirSkills = (c.skills || []) as string[];
      const common = mySkills.filter((s: string) => theirSkills.includes(s));
      score += common.length * 4;

      return {
        ...c,
        score,
        mutual_skills: common
      };
    })
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, limit);

  return NextResponse.json({ suggestions: scored });
}
