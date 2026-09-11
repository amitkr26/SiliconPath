import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCandidateAchievements, createCandidateAchievement } from "@/lib/candidate-profile-store";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const achievements = await getCandidateAchievements(user.id);
  return NextResponse.json({ achievements });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, issuer, date_awarded, description } = body;

  if (!title) {
    return NextResponse.json({ error: "Achievement title is required" }, { status: 400 });
  }

  const achievement = await createCandidateAchievement(user.id, {
    title: String(title).trim(),
    issuer: issuer ? String(issuer).trim() : null,
    date_awarded: date_awarded ? String(date_awarded).trim() : null,
    description: description ? String(description).trim() : null,
  });

  return NextResponse.json({ achievement }, { status: 201 });
}
