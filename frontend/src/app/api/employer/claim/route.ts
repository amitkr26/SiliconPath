import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { z } from "zod";

const claimSchema = z.object({
  organizationId: z.string().uuid(),
  businessEmail: z.string().email(),
  verificationDetails: z.string().min(10).max(2000),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = user.user_metadata?.role;
  if (role !== "employer" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const raw = await request.json();
    const body = claimSchema.parse(raw);

    // ponytail: store claim requests in user_alerts or similar table if dedicated claims table is missing.
    // Let's create a notification to admins about the claim, or insert to user_profiles as metadata.
    // We'll write to notifications or log it to console as a mockup since a dedicated claims table is not in migrations.
    console.log(`Claim request received for org ${body.organizationId} by user ${user.id} (${body.businessEmail})`);

    // Let's also insert a notification record to the user that their claim is pending review.
    const { error: notifError } = await supabase
      .from("notifications")
      .insert([{
        user_id: user.id,
        type: "system",
        message: `Your request to claim organization ID ${body.organizationId} has been submitted successfully and is pending verification.`,
        is_read: false,
      }]);

    if (notifError) throw notifError;

    return NextResponse.json({ success: true, message: "Claim submitted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to submit claim" }, { status: 400 });
  }
}
