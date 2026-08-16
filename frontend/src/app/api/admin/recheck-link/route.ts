import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, serverError } from "@berojgardegreewala/api";

export async function POST(request: NextRequest) {
  try { await requireAdmin(request); } catch (e) { return e instanceof Response ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
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
      .select("id, apply_url")
      .eq("id", opportunity_id)
      .single();

    if (!opp) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    let status = 0;
    let reachable = false;
    let errorMsg: string | null = null;

    if (opp.apply_url) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(opp.apply_url, {
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

    // P0.2: a reachable link is evidence, not verification. Write the evidence
    // ledger and only demote on unreachable — never promote to verified here
    // (that requires the admin verification queue + source validation).
    if (supabaseAdmin.from("opportunity_verifications")) {
      const { error: vErr } = await supabaseAdmin.from("opportunity_verifications").insert([
        {
          opportunity_id: opp.id,
          check_type: "link",
          status: reachable ? "pass" : "fail",
          source_url: opp.apply_url || null,
          http_status: status,
          error: errorMsg,
          metadata: { via: "admin-recheck-link" },
        },
      ]);
      if (vErr) console.error("opportunity_verifications insert error:", vErr.message);
    }

    await supabaseAdmin
      .from("opportunities")
      .update({
        last_link_checked: new Date().toISOString(),
        link_check_status: status,
        verification_status: reachable
          ? opp.verification_status === "link_unavailable" || !opp.verification_status
            ? "unverified"
            : opp.verification_status
          : "link_unavailable",
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
    return serverError("Recheck failed");
  }
}
