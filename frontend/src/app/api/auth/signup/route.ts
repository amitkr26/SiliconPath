import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, fullName, username, accountType, orgName, orgType, specialization } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
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
      const cleanUser = (username || email.split("@")[0]).trim().toLowerCase().replace(/^@/, "");
      await supabaseAdmin.from("user_profiles").upsert({
        id: data.user.id,
        email: email,
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
