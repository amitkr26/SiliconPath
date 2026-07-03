import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { opportunity_id, report_type, description } = body;

  if (!opportunity_id || !report_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!UUID_REGEX.test(opportunity_id)) {
    return NextResponse.json({ error: "Invalid opportunity ID" }, { status: 400 });
  }

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
