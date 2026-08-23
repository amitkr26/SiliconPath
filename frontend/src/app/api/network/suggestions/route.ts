import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase";

interface CandidateRow {
  id: string;
  username: string | null;
  display_name: string | null;
  headline: string | null;
  current_company: string | null;
  location: string | null;
  avatar_url: string | null;
  skills: string[] | null;
  bio: string | null;
}

// Exclude only internal system bots / automated probes
function isSystemBot(c: CandidateRow): boolean {
  const un = (c.username || "").toLowerCase();
  return /^(qa_probe_|e2e_bot_)/.test(un);
}

// Suggest people to connect with (v2 schema; excludes self + existing connections).
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "12", 10), 50);

  const { data: conns } = await supabaseAdmin
    .from("connections")
    .select("requester_id, addressee_id")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const exclude = new Set<string>([user.id]);
  (conns || []).forEach((c: { requester_id: string; addressee_id: string }) => {
    exclude.add(c.requester_id === user.id ? c.addressee_id : c.requester_id);
  });

  const { data: me } = await supabaseAdmin
    .from("user_profiles")
    .select("current_company, location, skills")
    .eq("id", user.id)
    .maybeSingle();

  const mySkills = (me?.skills || []) as string[];
  const myCompany = (me?.current_company || "").toLowerCase();
  const myLocation = (me?.location || "").toLowerCase();

  const { data: candidates } = await supabaseAdmin
    .from("user_profiles")
    .select("id, username, display_name, headline, current_company, location, avatar_url, skills, bio")
    .eq("is_profile_public", true)
    .limit(100);

  // 1. Get all accepted connections across all relevant candidates to compute mutual connections
  const { data: allAccepted } = await supabaseAdmin
    .from("connections")
    .select("requester_id, addressee_id")
    .eq("status", "accepted");

  const myAcceptedSet = new Set<string>();
  const userToAcceptedMap = new Map<string, Set<string>>();

  (allAccepted || []).forEach((c: { requester_id: string; addressee_id: string }) => {
    if (!userToAcceptedMap.has(c.requester_id)) userToAcceptedMap.set(c.requester_id, new Set());
    if (!userToAcceptedMap.has(c.addressee_id)) userToAcceptedMap.set(c.addressee_id, new Set());
    userToAcceptedMap.get(c.requester_id)!.add(c.addressee_id);
    userToAcceptedMap.get(c.addressee_id)!.add(c.requester_id);

    if (c.requester_id === user.id) myAcceptedSet.add(c.addressee_id);
    if (c.addressee_id === user.id) myAcceptedSet.add(c.requester_id);
  });

  const scored = ((candidates || []) as CandidateRow[])
    .filter((c) => !exclude.has(c.id) && !!c.display_name && !isSystemBot(c))
    .map((c) => {
      let score = 0;
      if (myCompany && (c.current_company || "").toLowerCase() === myCompany) score += 15;
      if (myLocation && (c.location || "").toLowerCase() === myLocation) score += 8;
      const theirSkills = (c.skills || []) as string[];
      const common = mySkills.filter((s) => theirSkills.includes(s));
      score += common.length * 4;

      // Mutual connections
      const theirAccepted = userToAcceptedMap.get(c.id) || new Set<string>();
      let mutualCount = 0;
      for (const friendId of myAcceptedSet) {
        if (theirAccepted.has(friendId)) mutualCount++;
      }
      score += mutualCount * 20;

      return {
        ...c,
        score,
        mutual_skills: common,
        mutual_connections_count: mutualCount,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return NextResponse.json({ suggestions: scored });
}
