import { NextRequest, NextResponse } from "next/server";
import { callAI, extractJSON } from "@/lib/ai/providers";
import { listOpportunities } from "@/lib/data/opportunities";

export const dynamic = "force-dynamic";

/**
 * AI natural-language search: turns a free-text query into structured filters,
 * then runs them against the real DB. Robust JSON parsing; if AI is unavailable
 * we fall back to a plain keyword search so the feature degrades gracefully.
 */
export async function POST(req: NextRequest) {
  const { query } = (await req.json().catch(() => ({}))) as { query?: string };
  if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });

  let filters: { category?: string; location?: string; q?: string } = { q: query };
  try {
    const { text } = await callAI(
      `Extract search filters from this query as JSON with optional keys category, location, q (keywords). Query: "${query}"`,
      { json: true, system: "You output only JSON. No prose." }
    );
    const parsed = extractJSON<{ category?: string; location?: string; q?: string }>(text);
    if (parsed) filters = { ...parsed, q: parsed.q ?? query };
  } catch {
    /* AI down — fall back to keyword search below */
  }

  try {
    const items = await listOpportunities({ ...filters, limit: 40 });
    return NextResponse.json({ filters, items });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
