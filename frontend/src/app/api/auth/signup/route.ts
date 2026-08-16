import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { RESERVED_USERNAMES } from "@/lib/utils";

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

    // Create user via Admin API with auto-confirmed email (bypasses SMTP rate limits)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        username: username || email.split("@")[0],
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
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Insert/upsert into user_profiles table
    if (data.user) {
      // Reserved/invalid vanity handles fall back to the email prefix so a
      // signup never claims a route-conflicting username.
      const submitted = (username || email.split("@")[0]).trim().toLowerCase().replace(/^@/, "");
      const cleanUser = /^[a-z0-9_]{3,40}$/.test(submitted) && !RESERVED_USERNAMES.includes(submitted)
        ? submitted
        : email.split("@")[0];
      await supabaseAdmin.from("user_profiles").upsert({
        id: data.user.id,
        email: email,
        username: cleanUser,
        display_name: fullName || cleanUser,
        headline: specialization || (accountType === "provider" ? orgName : "VLSI & Hardware Engineer"),
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
