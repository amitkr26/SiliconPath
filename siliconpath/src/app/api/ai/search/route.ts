import { NextResponse } from "next/server";
import { aiSearch } from "@/lib/ai/search";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let query = "";
  try {
    query = String((await request.json())?.query ?? "").slice(0, 500);
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (!query.trim()) return NextResponse.json({ error: "empty query" }, { status: 400 });

  try {
    const result = await aiSearch(query);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "search failed" }, { status: 500 });
  }
}
