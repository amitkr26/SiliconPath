import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("user_profiles")
    .select("skills, interests, current_company, headline").eq("id", user.id).single();

  const userSkills = (profile?.skills as string[]) || [];
  const userInterests = (profile?.interests as string[]) || [];

  const { data: opportunities } = await supabase.from("opportunities")
    .select("id, title, organization, location, category, tags, is_active, deadline, description")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!opportunities) return NextResponse.json({ recommendations: [] });

  const keywords = [...new Set([...userSkills, ...userInterests].map(s => s.toLowerCase()))];
  const scored = opportunities.map(opp => {
    const text = [opp.title, opp.description || "", opp.category, ...(opp.tags || [])]
      .filter(Boolean).join(" ").toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      const count = (text.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
      score += count * 2;
    }
    if (opp.location && userInterests.some(i => opp.location?.toLowerCase().includes(i.toLowerCase()))) score += 3;
    if (opp.organization && userSkills.some(s => opp.organization?.toLowerCase().includes(s.toLowerCase()))) score += 2;
    return { ...opp, score };
  });

  return NextResponse.json({
    recommendations: scored.filter(o => o.score > 0).sort((a, b) => b.score - a.score).slice(0, 10),
  });
}
