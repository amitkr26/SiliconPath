import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { reportOpportunitySchema, validateOrThrow } from "@/lib/validation";

export async function POST(request: NextRequest) {
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
