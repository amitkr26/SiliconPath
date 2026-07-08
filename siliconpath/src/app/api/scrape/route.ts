import { NextRequest, NextResponse } from "next/server";
import { runOrchestrator } from "@/scrapers/orchestrator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Secret-guarded scrape trigger (Vercel cron or manual). */
export async function POST(req: NextRequest) {
  const secret = process.env.SCRAPER_SECRET;
  if (!secret) return NextResponse.json({ error: "SCRAPER_SECRET not configured" }, { status: 500 });
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (token !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { batch?: number | "all" };
  try {
    const results = await runOrchestrator(body.batch ?? "all");
    return NextResponse.json({ success: true, results, timestamp: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
