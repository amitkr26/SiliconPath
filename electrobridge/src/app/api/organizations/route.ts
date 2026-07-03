import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

export async function GET() {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabaseAdmin
      .from("opportunities")
      .select("organization")
      .eq("is_active", true)
      .or(`deadline.gte.${today},deadline.is.null`);

    if (!data) {
      return NextResponse.json({ organizations: [] });
    }

    const orgCount: Record<string, number> = {};
    data.forEach((item: { organization: string }) => {
      const org = item.organization?.trim();
      if (org) {
        orgCount[org] = (orgCount[org] || 0) + 1;
      }
    });

    const organizations = Object.entries(orgCount)
      .map(([name, count]) => ({
        name,
        slug: name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}
