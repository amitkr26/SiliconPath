import { NextResponse } from "next/server";
import { neonPrimary } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!neonPrimary) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const result = await neonPrimary`
    SELECT
      feature,
      provider,
      model,
      COUNT(*) AS total_calls,
      SUM(CASE WHEN success THEN 1 ELSE 0 END) AS successful,
      SUM(CASE WHEN success THEN 0 ELSE 1 END) AS failed,
      AVG(prompt_length)::int AS avg_prompt_len,
      AVG(response_length)::int AS avg_response_len,
      MAX(created_at) AS last_used
    FROM ai_usage_log
    GROUP BY feature, provider, model
    ORDER BY total_calls DESC
    LIMIT 100
  `;

  const recent = await neonPrimary`
    SELECT * FROM ai_usage_log
    ORDER BY created_at DESC
    LIMIT 50
  `;

  return NextResponse.json({ aggregated: result, recent });
}
