import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminConfigured) {
    return new NextResponse("Database not configured", { status: 503 });
  }

  const { data: opportunity } = await supabaseAdmin
    .from("opportunities")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!opportunity) {
    return new NextResponse("Opportunity not found", { status: 404 });
  }

  if (!opportunity.deadline) {
    return new NextResponse("No deadline date available", { status: 400 });
  }

  const deadlineDate = new Date(opportunity.deadline);
  const now = new Date();
  const alarmDate = new Date(deadlineDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  function formatICSDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }

  const escapedTitle = opportunity.title.replace(/[,;\\]/g, "\\$&");
  const escapedOrg = (opportunity.organization || "").replace(/[,;\\]/g, "\\$&");
  const escapedDesc = [
    `Organization: ${opportunity.organization || "N/A"}`,
    `Eligibility: ${opportunity.eligibility || "N/A"}`,
    `Stipend: ${opportunity.stipend || "Check official notice"}`,
    opportunity.location ? `Location: ${opportunity.location}` : "",
    opportunity.apply_link
      ? `Apply: ${opportunity.apply_link}`
      : "",
    "",
    "More opportunities: https://electrobridge.vercel.app",
  ]
    .filter(Boolean)
    .join("\\n")
    .replace(/[,;\\]/g, "\\$&");

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ElectroBridge//Opportunity Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${params.id}@electrobridge.vercel.app`,
    `DTSTART;VALUE=DATE:${formatICSDate(deadlineDate).split("T")[0]}`,
    `DTEND;VALUE=DATE:${formatICSDate(deadlineDate).split("T")[0]}`,
    `SUMMARY:DEADLINE: ${escapedTitle} - ${escapedOrg}`,
    `DESCRIPTION:${escapedDesc}`,
    "BEGIN:VALARM",
    `TRIGGER:-P7D`,
    "ACTION:DISPLAY",
    `DESCRIPTION:Deadline approaching: ${escapedTitle}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(icsContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="deadline-${params.id}.ics"`,
    },
  });
}
