import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { checkIfExpired } from "@/lib/ai/expiry-checker";
import { requireCron, serverError } from "@berojgardegreewala/api";

export async function GET(request: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  // P0.6: fail-closed — missing/invalid CRON_SECRET => 403 (was fail-open when CRON_SECRET unset)
  try {
    await requireCron(request);
  } catch (e) {
    return e instanceof Response ? e : serverError();
  }

  try {
    const { data: opportunities } = await supabaseAdmin
      .from("opportunities")
      .select("*")
      .eq("is_active", true);

    if (!opportunities || opportunities.length === 0) {
      return NextResponse.json({ expired: 0, checked: 0 });
    }

    let expired = 0;

    for (const opp of opportunities) {
      const isExpired = await checkIfExpired(opp);
      if (isExpired) {
        await supabaseAdmin
          .from("opportunities")
          .update({
            is_active: false,
            verification_status: "expired",
          })
          .eq("id", opp.id);
        expired++;
      }
    }

    return NextResponse.json({
      checked: opportunities.length,
      expired,
      message: `Checked ${opportunities.length} opportunities, marked ${expired} as expired.`,
    });
  } catch (error) {
    console.error("Error in expiry checker:", error);
    return serverError("Expiry check failed");
  }
}
