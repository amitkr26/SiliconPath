import { NextResponse } from "next/server";
import { neonPrimary, db1 } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!neonPrimary) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const topViews = await neonPrimary`
    SELECT opportunity_id, COUNT(*) AS views
    FROM platform_analytics
    WHERE event_type = 'page_view' AND opportunity_id IS NOT NULL
    GROUP BY opportunity_id
    ORDER BY views DESC
    LIMIT 10
  `;

  const clickRateByCategory = await neonPrimary`
    SELECT
      pa.opportunity_id,
      o.category,
      COUNT(*) FILTER (WHERE pa.event_type = 'apply_click') AS clicks,
      COUNT(*) FILTER (WHERE pa.event_type = 'page_view') AS views
    FROM platform_analytics pa
    LEFT JOIN opportunities o ON o.id = pa.opportunity_id
    GROUP BY pa.opportunity_id, o.category
    LIMIT 20
  `;

  const dailyActive = await neonPrimary`
    SELECT DATE(created_at) AS day, COUNT(*) AS events
    FROM platform_analytics
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY day DESC
  `;

  const providerUsage = await neonPrimary`
    SELECT provider, COUNT(*) AS total_calls
    FROM ai_usage_log
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY provider
    ORDER BY total_calls DESC
  `;

  return NextResponse.json({
    top_views: topViews,
    click_rates: clickRateByCategory,
    daily_activity: dailyActive,
    provider_usage: providerUsage,
  });
}
