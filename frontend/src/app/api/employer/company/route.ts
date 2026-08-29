import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    // 1. Fetch user profile
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // 2. Fetch associated company page if claimed
    const { data: companyPage } = await supabaseAdmin
      .from("company_pages")
      .select("*, organization:organizations(*)")
      .eq("claimed_by", user.id)
      .maybeSingle();

    return NextResponse.json({
      profile,
      company: companyPage || {
        name: profile?.current_company || user.user_metadata?.org_name || user.email?.split("@")[1]?.split(".")[0]?.toUpperCase() || "Semiconductor Lab",
        website: profile?.website_url || "",
        location: profile?.location || "Bengaluru, Karnataka, India",
        description: profile?.bio || "Advanced semiconductor and VLSI research laboratory specializing in digital IC design, physical implementation, and EDA workflows.",
        industry: "Semiconductors / VLSI Design",
        specialties: ["Digital RTL", "UVM Verification", "Physical Design", "RISC-V SoC"],
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch company profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { name, website, location, description, researchDomains, facilities } = body;

    // 1. Update user_profile
    await supabaseAdmin
      .from("user_profiles")
      .update({
        current_company: name,
        website_url: website,
        location: location,
        bio: description,
        headline: researchDomains ? `Recruiter / Lab Lead at ${name}` : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    // 2. Resolve or create organization in organizations table
    let orgId: string | null = null;
    if (name) {
      const orgSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const { data: existingOrg } = await supabaseAdmin
        .from("organizations")
        .select("id, created_by")
        .eq("name", name)
        .maybeSingle();

      if (existingOrg) {
        orgId = existingOrg.id;

        // Check if organization or company page is already claimed by someone else
        const { data: existingPage } = await supabaseAdmin
          .from("company_pages")
          .select("id, claimed_by")
          .eq("organization_id", orgId)
          .maybeSingle();

        const role = user.user_metadata?.role;
        if (role !== "admin") {
          if (existingPage && existingPage.claimed_by && existingPage.claimed_by !== user.id) {
            return NextResponse.json({ error: "Forbidden: This organization is already claimed by another administrator" }, { status: 403 });
          }
          if (existingOrg.created_by && existingOrg.created_by !== user.id && !existingPage) {
            return NextResponse.json({ error: "Forbidden: You do not own this organization" }, { status: 403 });
          }
        }

        await supabaseAdmin
          .from("organizations")
          .update({ website, description })
          .eq("id", orgId);
      } else {
        const { data: newOrg } = await supabaseAdmin
          .from("organizations")
          .insert({
            name,
            slug: orgSlug,
            website,
            description,
            created_by: user.id,
          })
          .select("id")
          .single();
        if (newOrg) orgId = newOrg.id;
      }

      // 3. Upsert company_pages record linked to claimed_by
      if (orgId) {
        await supabaseAdmin
          .from("company_pages")
          .upsert({
            organization_id: orgId,
            name,
            slug: orgSlug,
            website,
            description,
            industry: "Semiconductor & VLSI",
            headquarters: location,
            claimed_by: user.id,
            is_verified: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: "organization_id" });
      }
    }

    return NextResponse.json({ success: true, message: "Company profile updated and persisted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update company profile" }, { status: 500 });
  }
}
