import { NextResponse } from "next/server";
import { listNews } from "@/lib/data/news";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ items: await listNews(50) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
