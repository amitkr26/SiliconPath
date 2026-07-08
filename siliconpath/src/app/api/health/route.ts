import { NextResponse } from "next/server";
import { checkDbHealth } from "@/lib/db/index";

export const dynamic = "force-dynamic";

// Tests all four DB connections with real queries. Intended to be pinged after
// every deploy (not only when someone remembers), per the DB safeguards.
export async function GET() {
  const databases = await checkDbHealth();
  const allOk = Object.values(databases).every((s) => s === "ok");
  return NextResponse.json(
    { status: allOk ? "ok" : "degraded", timestamp: new Date().toISOString(), databases },
    { status: allOk ? 200 : 503 }
  );
}
