import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limiter";

// QA audit P1: POST /api/contact previously 404'd while the UI always showed
// "Thank You!". Reuses the existing opportunity_reports table (reporter_email
// column added in 20260715_001) — no new schema.

const TYPE_TO_REPORT_TYPE: Record<string, string> = {
  missing_opportunity: "other",
  broken_link: "broken_link",
  feature_request: "other",
  general: "other",
};

export async function POST(request: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { success } = await checkRateLimit(`contact:${ip}`, 10, 60 * 60);
  if (!success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const type = (body.type || "").toString().trim();
    const reportType = TYPE_TO_REPORT_TYPE[type];
    if (!reportType) {
      return NextResponse.json(
        { error: "Please select a valid feedback type." },
        { status: 400 }
      );
    }

    const notes = (body.notes || "").toString().trim();
    if (!notes || notes.length < 10) {
      return NextResponse.json(
        { error: "Please provide details (at least 10 characters)." },
        { status: 400 }
      );
    }

    const email = (body.contact_email || "").toString().trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const url = (body.url || "").toString().trim();
    const description = [notes, url ? `Related URL: ${url}` : null].filter(Boolean).join("\n");

    const { error } = await supabaseAdmin.from("opportunity_reports").insert([
      {
        report_type: reportType,
        description: description.slice(0, 2000),
        reporter_email: email || null,
      },
    ]);

    if (error) {
      console.error("Supabase contact insert error:", error.message);
      return NextResponse.json({ error: "Failed to save your message. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Message recorded. Thank you!" }, { status: 201 });
  } catch (error: any) {
    console.error("Error submitting contact:", error);
    return NextResponse.json({ error: "Failed to submit your message." }, { status: 500 });
  }
}
