import { NextResponse } from "next/server";
import { neonPrimary, db1 } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!neonPrimary || !db1) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  // P0.4: `platform_analytics` does not exist anywhere. Its live successor is
  // Neon `click_events` (opportunity_id, event_type, created_at). `ai_usage_log`
  // lives on Supabase db1. Fixed 2026-08-16 — these queries previously errored.
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [topViews, byOpp, daily, providerResp] = await Promise.all([
    neonPrimary`
      SELECT opportunity_id, COUNT(*) AS views
      FROM click_events
      WHERE event_type = 'page_view' AND opportunity_id IS NOT NULL
      GROUP BY opportunity_id
      ORDER BY views DESC
      LIMIT 10
    `,
    neonPrimary`
      SELECT opportunity_id,
        COUNT(*) FILTER (WHERE event_type = 'apply_click') AS clicks,
        COUNT(*) FILTER (WHERE event_type = 'page_view') AS views
      FROM click_events
      WHERE opportunity_id IS NOT NULL
      GROUP BY opportunity_id
      ORDER BY views DESC
      LIMIT 20
    `,
    neonPrimary`
      SELECT DATE(created_at) AS day, COUNT(*) AS events
      FROM click_events
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY day DESC
    `,
    db1.from("ai_usage_log").select("provider, created_at").gte("created_at", monthAgo),
  ]);

  const providerRows = ((providerResp as { data: any[] })?.data ?? []) as any[];

  // Category join happens in JS: opportunities lives on Supabase, click_events on Neon (no cross-DB SQL).
  const ids = (byOpp || []).map((r: Record<string, any>) => r.opportunity_id).filter(Boolean);
  const { data: opps } = ids.length
    ? await db1.from("opportunities").select("id, category").in("id", ids)
    : { data: [] };
  const catMap: Record<string, string | null> = Object.fromEntries((opps || []).map((o: any) => [o.id, o.category ?? null]));
  const clickRates = (byOpp || []).map((r: any) => ({ ...r, category: catMap[r.opportunity_id] ?? null }));

  const providerCounts: Record<string, number> = {};
  for (const r of providerRows || []) {
    providerCounts[r.provider] = (providerCounts[r.provider] || 0) + 1;
  }
  const providerUsage = Object.entries(providerCounts).map(([provider, total_calls]) => ({ provider, total_calls }));

  return NextResponse.json({
    top_views: topViews ?? [],
    click_rates: clickRates,
    daily_activity: daily ?? [],
    provider_usage: providerUsage,
  });
}
