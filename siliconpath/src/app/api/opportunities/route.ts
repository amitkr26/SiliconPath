import { NextRequest, NextResponse } from "next/server";
import { listOpportunities } from "@/lib/data/opportunities";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  try {
    const items = await listOpportunities({
      category: sp.get("category") ?? undefined,
      location: sp.get("location") ?? undefined,
      q: sp.get("q") ?? undefined,
      limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
      offset: sp.get("offset") ? Number(sp.get("offset")) : undefined,
    });
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
