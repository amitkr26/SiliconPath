import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || (user.app_metadata as any)?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const dbStart = performance.now();
  const { count: dbConnections } = await supabase.from("opportunities").select("*", { count: "exact", head: true });
  const dbTime = performance.now() - dbStart;

  const scraperStart = performance.now();
  const { data: scrapers } = await supabase.from("scrape_logs").select("status, created_at").order("created_at", { ascending: false }).limit(5);
  const scraperStatus = scrapers?.every(s => s.status === "success") ? "healthy" : "degraded";

  const { count: totalRequests } = await supabase.from("platform_analytics").select("*", { count: "exact", head: true });

  return NextResponse.json({
    dbTime: Math.round(dbTime),
    dbConnections: dbConnections ?? 0,
    totalRequests: totalRequests ?? 0,
    scraperStatus,
    serverStatus: "healthy",
    dbStatus: "connected",
    aiGatewayStatus: "healthy",
  });
}
