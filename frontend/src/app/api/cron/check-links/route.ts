import { NextRequest } from "next/server";
import { supabaseAdmin, isConfigured } from "@/lib/supabase";
import { requireCron, serverError } from "@berojgardegreewala/api";

async function checkUrl(url: string): Promise<{ status: number; reachable: boolean }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    return { status: response.status, reachable: response.ok };
  } catch {
    return { status: 0, reachable: false };
  }
}

export async function GET(request: NextRequest) {
  try { await requireCron(request); }
  catch (e) { return e instanceof Response ? e : serverError(); }

  if (!isConfigured || !supabaseAdmin?.from) {
    return new Response(JSON.stringify({ error: "Database not configured." }), { status: 503, headers: { "Content-Type": "application/json" } });
  }

  try {
    const now = new Date().toISOString();

    const { data: verifiedOpps } = await supabaseAdmin
      .from("opportunities")
      .select("id, apply_link, verification_status, last_link_checked")
      .eq("verification_status", "verified")
      .or(`last_link_checked.is.null,last_link_checked.lt.${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`);

    const { data: pendingOpps } = await supabaseAdmin
      .from("opportunities")
      .select("id, apply_link, verification_status, last_link_checked")
      .eq("verification_status", "pending");

    const opportunities = [...(verifiedOpps || []), ...(pendingOpps || [])];

    if (!opportunities || opportunities.length === 0) {
      return new Response(JSON.stringify({ checked: 0, ok: 0, broken: 0, pending_verified: 0, broken_urls: [] }), { headers: { "Content-Type": "application/json" } });
    }

    const results = await Promise.all(
      opportunities.map(async (opp: { id: string; apply_link: string | null; verification_status: string | null; last_link_checked: string | null }) => {
        const url = opp.apply_link || "";
        if (!url) {
          return { id: opp.id, status: 0, reachable: false, url, was_pending: opp.verification_status === "pending" };
        }
        return { id: opp.id, ...(await checkUrl(url)), url, was_pending: opp.verification_status === "pending" };
      })
    );

    const brokenUrls: { id: string; url: string; status: number }[] = [];
    let pendingVerified = 0;
    for (const result of results) {
      const { error: _logErr } = await supabaseAdmin.from("link_check_logs").insert([
        {
          opportunity_id: result.id,
          http_status: result.status,
          is_reachable: result.reachable,
        },
      ]);

      if (!result.reachable) {
        brokenUrls.push({ id: result.id, url: result.url, status: result.status });
        await supabaseAdmin
          .from("opportunities")
          .update({
            verification_status: "link_unavailable",
            last_link_checked: now,
            link_check_status: result.status,
          })
          .eq("id", result.id);
      } else if (result.was_pending) {
        pendingVerified++;
        await supabaseAdmin
          .from("opportunities")
          .update({
            verification_status: "verified",
            verified_at: now,
            last_link_checked: now,
            link_check_status: result.status,
            is_active: true,
          })
          .eq("id", result.id);
      } else {
        await supabaseAdmin
          .from("opportunities")
          .update({
            last_link_checked: now,
            link_check_status: result.status,
          })
          .eq("id", result.id);
      }
    }

    return new Response(JSON.stringify({
      checked: results.length,
      ok: results.filter((r) => r.reachable).length,
      broken: brokenUrls.length,
      pending_verified: pendingVerified,
      broken_urls: brokenUrls,
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Link check error:", error);
    return new Response(JSON.stringify({ error: "Link check failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
