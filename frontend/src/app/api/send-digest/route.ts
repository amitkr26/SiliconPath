import { NextRequest, NextResponse } from "next/server";
import { sendDigest } from "@/lib/email-digest";
import { requireCron, serverError } from "@berojgardegreewala/api";

export async function GET(request: NextRequest) {
  // P0.6: fail-closed — missing/invalid CRON_SECRET => 403 (was fail-open when CRON_SECRET unset)
  try {
    await requireCron(request);
  } catch (e) {
    return e instanceof Response ? e : serverError();
  }

  try {
    const result = await sendDigest();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error sending digest:", error);
    return serverError("Failed to send digest");
  }
}
