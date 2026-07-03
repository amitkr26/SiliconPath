import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { opportunity_id } = body;

  if (!opportunity_id) {
    return NextResponse.json({ error: "Missing opportunity_id" }, { status: 400 });
  }

  if (!supabaseAdmin?.from) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const { data: opp } = await supabaseAdmin
      .from("opportunities")
      .select("id, apply_link")
      .eq("id", opportunity_id)
      .single();

    if (!opp) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    let status = 0;
    let reachable = false;
    let errorMsg: string | null = null;

    if (opp.apply_link) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(opp.apply_link, {
          method: "HEAD",
          signal: controller.signal,
          redirect: "follow",
        });
        clearTimeout(timeout);
        status = response.status;
        reachable = response.ok;
      } catch (e: any) {
        errorMsg = e.message;
      }
    }

    await supabaseAdmin.from("link_check_logs").insert([
      {
        opportunity_id: opp.id,
        http_status: status,
        is_reachable: reachable,
        error_message: errorMsg,
      },
    ]);

    await supabaseAdmin
      .from("opportunities")
      .update({
        last_link_checked: new Date().toISOString(),
        link_check_status: status,
        verification_status: reachable ? "verified" : "link_unavailable",
      })
      .eq("id", opp.id);

    return NextResponse.json({
      checked: true,
      status,
      reachable,
      error: errorMsg,
    });
  } catch (error) {
    console.error("Recheck error:", error);
    return NextResponse.json({ error: "Recheck failed" }, { status: 500 });
  }
}
