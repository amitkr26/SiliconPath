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
    
    // 1. Fetch verified company pages
    const { data: companies, error: companyError } = await supabaseAdmin
      .from("company_pages")
      .select("*")
      .order("name");

    if (companyError) throw companyError;

    // 2. Fetch opportunities to map counts
    const { data: opportunities, error: oppError } = await supabaseAdmin
      .from("opportunities")
      .select("organization")
      .eq("is_active", true)
      .or(`deadline.gte.${today},deadline.is.null`);

    if (oppError) throw oppError;

    const orgCounts: Record<string, number> = {};
    (opportunities || []).forEach((o: any) => {
      const name = o.organization?.toLowerCase().trim();
      if (name) orgCounts[name] = (orgCounts[name] || 0) + 1;
    });

    const organizations = (companies || []).map((c: any) => {
      const countKey = c.name?.toLowerCase().trim();
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        tagline: c.tagline,
        logo_url: c.logo_url,
        industry: c.industry,
        company_type: c.company_type,
        headquarters: c.headquarters,
        is_verified: c.is_verified,
        count: orgCounts[countKey] || 0
      };
    }).sort((a: any, b: any) => b.count - a.count);

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}
