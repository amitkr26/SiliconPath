import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
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
import { apiError } from "@/lib/api-utils";

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

  if (error) return apiError(error, "profile-me-get");
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
  // privilege escalation. The role is written to app_metadata via the
  // service-role client (server-controlled), so clients cannot self-assert
  // employer/candidate by writing user_metadata. Admin is granted out-of-band
  // only (server-side secret-based admin console).
  if (role === "admin") {
    return NextResponse.json({ error: "Forbidden: admin role cannot be self-assigned" }, { status: 403 });
  }
  if (role && (role === "employer" || role === "candidate")) {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database not configured." }, { status: 503 });
    }
    const { data: current, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(user.id);
    if (fetchError || !current?.user) {
      return NextResponse.json({ error: fetchError?.message || "Failed to resolve user" }, { status: 500 });
    }
    const existingAppMeta = current.user.app_metadata || {};
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...existingAppMeta,
        role,
        updated_at: new Date().toISOString(),
      },
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

  if (error) return apiError(error, "profile-me-update");

  return NextResponse.json({ profile: data });
}