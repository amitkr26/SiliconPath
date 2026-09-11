import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { reportOpportunitySchema, validateOrThrow } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Rate limit: 5 reports per user per hour
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const rlKey = `report:${user.id}:${ip}`;
  const { success } = await rateLimit(rlKey, 5, 3600);
  if (!success) {
    return NextResponse.json({ error: "Too many reports. Please try again later." }, { status: 429 });
  }

  const raw = await request.json();
  const { opportunity_id, report_type, description } = validateOrThrow(reportOpportunitySchema, raw);
  const trimmedDescription = (description || "").trim().slice(0, 500);

  const { error } = await supabaseAdmin.from("opportunity_reports").insert([
    { opportunity_id, report_type, description: trimmedDescription },
  ]);

  if (error) {
    console.error("Error creating report:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
