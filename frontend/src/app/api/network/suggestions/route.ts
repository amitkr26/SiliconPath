import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface CandidateRow {
  id: string;
  display_name: string | null;
  headline: string | null;
  current_company: string | null;
  location: string | null;
  avatar_url: string | null;
  skills: string[] | null;
}

// Suggest people to connect with (v2 schema; excludes self + existing connections).
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "12", 10), 50);

  const { data: conns } = await supabase
    .from("connections")
    .select("requester_id, addressee_id")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const exclude = new Set<string>([user.id]);
  (conns || []).forEach((c: { requester_id: string; addressee_id: string }) => {
    exclude.add(c.requester_id === user.id ? c.addressee_id : c.requester_id);
  });

  const { data: me } = await supabase
    .from("user_profiles")
    .select("current_company, location, skills")
    .eq("id", user.id)
    .maybeSingle();

  const mySkills = (me?.skills || []) as string[];
  const myCompany = (me?.current_company || "").toLowerCase();
  const myLocation = (me?.location || "").toLowerCase();

  const { data: candidates } = await supabase
    .from("user_profiles")
    .select("id, display_name, headline, current_company, location, avatar_url, skills")
    .eq("is_profile_public", true)
    .limit(100);

  const scored = ((candidates || []) as CandidateRow[])
    .filter((c) => !exclude.has(c.id) && !!c.display_name)
    .map((c) => {
      let score = 0;
      if (myCompany && (c.current_company || "").toLowerCase() === myCompany) score += 15;
      if (myLocation && (c.location || "").toLowerCase() === myLocation) score += 8;
      const theirSkills = (c.skills || []) as string[];
      const common = mySkills.filter((s) => theirSkills.includes(s));
      score += common.length * 4;
      return { ...c, score, mutual_skills: common };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return NextResponse.json({ suggestions: scored });
}
