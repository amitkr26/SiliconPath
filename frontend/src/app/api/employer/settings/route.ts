import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedEmployerUser } from "@/lib/employer-auth";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    // Fetch employer settings from the employer_settings table
    const { data, error } = await supabaseAdmin
      .from("employer_settings")
      .select("*")
      .eq("employer_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
      console.error("Employer settings fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return defaults if no settings exist yet
    const settings = data ? {
      emailAlerts: data.email_alerts ?? true,
      instantApplicantAlert: data.instant_applicant_alert ?? true,
      weeklyDigest: data.weekly_digest ?? true,
    } : {
      emailAlerts: true,
      instantApplicantAlert: true,
      weeklyDigest: true,
    };

    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { emailAlerts, instantApplicantAlert, weeklyDigest } = body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof emailAlerts === "boolean") updates.email_alerts = emailAlerts;
    if (typeof instantApplicantAlert === "boolean") updates.instant_applicant_alert = instantApplicantAlert;
    if (typeof weeklyDigest === "boolean") updates.weekly_digest = weeklyDigest;

    // Upsert: insert if not exists, update if exists
    const { error } = await supabaseAdmin
      .from("employer_settings")
      .upsert({
        employer_id: user.id,
        ...updates,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, settings: updates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save settings" }, { status: 500 });
  }
}