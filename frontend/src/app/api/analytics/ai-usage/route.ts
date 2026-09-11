import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { apiError } from "@/lib/api-utils";

export async function GET(request: Request) {
  if (!await verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  // P0.4: ai_usage_log lives on Supabase db1, not Neon. Aggregated in JS —
  // the table is admin-only and bounded (500 latest rows), so no GROUP BY RPC needed.
  const { data: rows, error } = await supabaseAdmin
    .from("ai_usage_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return apiError(error, "ai-usage-list");
  }

  const byKey = new Map<string, {
    feature: string; provider: string; model: string | null;
    total_calls: number; successful: number; failed: number;
    prompt_lengths: number[]; response_lengths: number[]; last_used: string;
  }>();

  for (const r of rows || []) {
    const key = `${r.feature}|${r.provider}|${r.model ?? ""}`;
    const agg = byKey.get(key) || {
      feature: r.feature, provider: r.provider, model: r.model ?? null,
      total_calls: 0, successful: 0, failed: 0,
      prompt_lengths: [] as number[], response_lengths: [] as number[], last_used: r.created_at,
    };
    agg.total_calls++;
    if (r.success) agg.successful++; else agg.failed++;
    if (r.prompt_length != null) agg.prompt_lengths.push(r.prompt_length);
    if (r.response_length != null) agg.response_lengths.push(r.response_length);
    agg.last_used = agg.last_used > r.created_at ? agg.last_used : r.created_at;
    byKey.set(key, agg);
  }

  const aggregated = [...byKey.values()].map((a) => ({
    feature: a.feature,
    provider: a.provider,
    model: a.model,
    total_calls: a.total_calls,
    successful: a.successful,
    failed: a.failed,
    avg_prompt_len: a.prompt_lengths.length ? Math.round(a.prompt_lengths.reduce((x, y) => x + y, 0) / a.prompt_lengths.length) : 0,
    avg_response_len: a.response_lengths.length ? Math.round(a.response_lengths.reduce((x, y) => x + y, 0) / a.response_lengths.length) : 0,
    last_used: a.last_used,
  }));

  return NextResponse.json({ aggregated, recent: (rows || []).slice(0, 50) });
}
