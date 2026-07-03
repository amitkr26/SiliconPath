import { NextResponse } from "next/server";
import { neonPrimary } from "@/lib/db";

export async function GET(request: Request) {
  const authHeader = request.headers.get("x-admin-password");
  if (authHeader !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
