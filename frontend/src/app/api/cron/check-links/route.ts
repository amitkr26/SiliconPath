import { NextRequest } from "next/server";
import { supabaseAdmin, isConfigured } from "@/lib/supabase";
import { requireCron, serverError } from "@berojgardegreewala/api";
import { createHash } from "crypto";

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
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // P0.2: check verified + pending + unverified rows (unverified now included —
    // new scrapes land as unverified and need evidence before anything promotes).
    const { data: opportunities } = await supabaseAdmin
      .from("opportunities")
      .select("id, apply_url, verification_status, last_link_checked")
      .in("verification_status", ["verified", "pending", "unverified"])
      .or(`last_link_checked.is.null,last_link_checked.lt.${dayAgo}`);

    if (!opportunities || opportunities.length === 0) {
      return new Response(JSON.stringify({ checked: 0, ok: 0, broken: 0, evidence_written: 0, broken_urls: [] }), { headers: { "Content-Type": "application/json" } });
    }

    // ponytail: sequential HEAD checks, ~10s worst case each — a full sweep of the
    // table is slow inside one serverless invocation. Upgrade path: batch/queue the
    // checks (or parallelize with a concurrency cap) once the table outgrows a few
    // thousand active rows.
    const results = await Promise.all(
      opportunities.map(async (opp: { id: string; apply_url: string | null; verification_status: string | null }) => {
        const url = opp.apply_url || "";
        if (!url) {
          return { id: opp.id, status: 0, reachable: false, url };
        }
        return { id: opp.id, ...(await checkUrl(url)), url };
      })
    );

    const brokenUrls: { id: string; url: string; status: number }[] = [];
    let evidenceWritten = 0;

    for (const result of results) {
      // Canonical evidence ledger (P0.2)
      const contentHash = createHash("sha256").update(result.url).digest("hex").slice(0, 32);
      const { error: vErr } = await supabaseAdmin
        .from("opportunity_verifications")
        .insert({
          opportunity_id: result.id,
          check_type: "link",
          status: result.reachable ? "pass" : "fail",
          source_url: result.url || null,
          http_status: result.status,
          content_hash: contentHash,
          metadata: { via: "cron-check-links" },
        });
      if (!vErr) evidenceWritten++;
      else console.error("opportunity_verifications insert error:", vErr.message);

      // Legacy compat log (kept for admin/recheck-link)
      await supabaseAdmin.from("link_check_logs").insert([
        { opportunity_id: result.id, http_status: result.status, is_reachable: result.reachable },
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
      } else {
        // P0.2: a reachable link is evidence, not verification. Only the admin
        // verification queue may promote unverified/pending -> verified.
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
      evidence_written: evidenceWritten,
      broken_urls: brokenUrls,
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Link check error:", error);
    return new Response(JSON.stringify({ error: "Link check failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
