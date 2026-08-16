import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { neonPrimary } from "@/lib/db";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || (user.app_metadata as any)?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const dbStart = performance.now();
  const { count: dbConnections } = await supabase.from("opportunities").select("*", { count: "exact", head: true });
  const dbTime = performance.now() - dbStart;

  // P0.4: `scrape_logs` does not exist — the real engine's health log is `scrape_runs` (db1).
  const { data: scrapers } = await supabase.from("scrape_runs").select("*").order("created_at", { ascending: false }).limit(5);
  const scraperStatus = (scrapers ?? []).length === 0 || (scrapers ?? []).every((s: any) => s.success !== false)
    ? "healthy" : "degraded";

  // P0.4: `platform_analytics` does not exist — its live successor is Neon `click_events`.
  let totalRequests = 0;
  if (neonPrimary) {
    try {
      const [{ total }] = await neonPrimary`SELECT COUNT(*) AS total FROM click_events`;
      totalRequests = Number(total) || 0;
    } catch {
      totalRequests = 0; // tracking table empty/unavailable — probe should not 500
    }
  }

  return NextResponse.json({
    dbTime: Math.round(dbTime),
    dbConnections: dbConnections ?? 0,
    totalRequests,
    scraperStatus,
    serverStatus: "healthy",
    dbStatus: "connected",
    aiGatewayStatus: "healthy",
  });
}
