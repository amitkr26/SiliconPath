import { NextResponse } from "next/server";
import { checkDbHealth } from "@/lib/db/index";
import { assertProviderKeys } from "@/lib/ai/providers";

export const dynamic = "force-dynamic";

export async function GET() {
  const databases = await checkDbHealth();
  const ai = assertProviderKeys();
  const ok = Object.values(databases).every((s) => s === "ok" || s === "not_configured");
  return NextResponse.json(
    { status: ok ? "ok" : "degraded", timestamp: new Date().toISOString(), databases, ai },
    { status: ok ? 200 : 503 }
  );
}
