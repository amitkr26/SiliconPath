import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { RESERVED_USERNAMES } from "@/lib/utils";
import { apiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, fullName, username, accountType, orgName, orgType, specialization } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    // P0.5 RBAC: role is derived server-side from a whitelisted accountType —
    // the client can never supply a role, and "admin" is unreachable here.
    // Self-serve employer signup stays; admin is out-of-band only.
    if (accountType !== "candidate" && accountType !== "provider") {
      return NextResponse.json({ error: "Invalid account type." }, { status: 400 });
    }

    if (!isAdminConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: "Database admin not configured." }, { status: 503 });
    }

    // Determine and guarantee unique username for all users (candidates and employers alike)
    let submitted = (username || fullName || email.split("@")[0])
      .trim()
      .toLowerCase()
      .replace(/^@/, "")
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/^_+|_+$/g, "");

    if (!submitted || submitted.length < 3) {
      submitted = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_");
    }

    if (RESERVED_USERNAMES.includes(submitted)) {
      submitted = `${submitted}_user`;
    }

    // Check for collision in user_profiles
    let finalUsername = submitted;
    const { data: existingProfile } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("username", finalUsername)
      .maybeSingle();

    if (existingProfile) {
      finalUsername = `${submitted}_${Math.floor(100 + Math.random() * 900)}`;
    }

    // Create user via Admin API with auto-confirmed email (bypasses SMTP rate limits)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        username: finalUsername,
        account_type: accountType,
        role: accountType === "provider" ? "employer" : "candidate",
        org_name: orgName,
        org_type: orgType,
        specialization: specialization,
      },
    });

    if (error) {
      // If user already exists, return friendly message
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        return NextResponse.json({ error: "User with this email already exists. Please sign in instead." }, { status: 400 });
      }
      return apiError(error, "signup", 400);
    }

    // Insert/upsert into user_profiles table
    if (data.user) {
      await supabaseAdmin.from("user_profiles").upsert({
        id: data.user.id,
        email: email,
        username: finalUsername,
        display_name: fullName || finalUsername,
        headline: specialization || (accountType === "provider" ? (orgName || "Semiconductor Recruiter") : "VLSI & Hardware Engineer"),
        account_type: accountType === "provider" ? "employer" : "candidate",
        is_profile_public: true,
        created_at: new Date().toISOString(),
      }, { onConflict: "id" });
    }

    return NextResponse.json({ success: true, user: data.user, autoConfirmed: true }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Registration failed." }, { status: 500 });
  }
}
