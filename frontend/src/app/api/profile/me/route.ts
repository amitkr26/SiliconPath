import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase";
import { profileUpdateSchema } from "@/lib/validation";
import { validateOrThrow } from "@/lib/validation";

import {
  getCandidateExperiences,
  getCandidateEducations,
  getCandidateProjects,
  getCandidateCertifications,
  getCandidateAchievements,
} from "@/lib/candidate-profile-store";
import { calculateProfileCompleteness } from "@/lib/profile-completeness";
import { RESERVED_USERNAMES } from "@/lib/utils";

export async function GET(request: NextRequest) {
  let user = null;
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin.auth.getUser(token);
      user = data.user;
    }
  }

  const supabase = await createClient();
  if (!user) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const [experiences, educations, projects, certifications, achievements] = await Promise.all([
    getCandidateExperiences(user.id),
    getCandidateEducations(user.id),
    getCandidateProjects(user.id),
    getCandidateCertifications(user.id),
    getCandidateAchievements(user.id),
  ]);

  const completeness = calculateProfileCompleteness({
    profile: data,
    experiences,
    educations,
    projects,
  });

  const fullProfile = {
    ...data,
    experiences,
    educations,
    projects,
    certifications,
    achievements,
    completeness,
  };

  return NextResponse.json({ profile: fullProfile, user: { id: user.id, email: user.email } });
}

export async function PATCH(request: NextRequest) {
  let user = null;
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin.auth.getUser(token);
      user = data.user;
    }
  }

  const supabase = await createClient();
  if (!user) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }
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

  // If username is being updated, perform strict validation & collision checks
  if (updates.username) {
    const normalizedUsername = updates.username.trim().toLowerCase();
    
    if (RESERVED_USERNAMES.includes(normalizedUsername)) {
      return NextResponse.json(
        { error: `The username "${updates.username}" is reserved by the system.` },
        { status: 400 }
      );
    }

    // Check if another profile owns this username
    const { data: existingUser } = await supabase
      .from("user_profiles")
      .select("id")
      .ilike("username", normalizedUsername)
      .neq("id", user.id)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: `The username "${updates.username}" is already taken.` },
        { status: 409 }
      );
    }

    updates.username = normalizedUsername;
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profile: data });
}