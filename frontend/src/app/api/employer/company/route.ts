import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/employer-auth";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";

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
    console.error("Failed to fetch company profile:", err);
    return NextResponse.json({ error: "Failed to fetch company profile" }, { status: 500 });
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
    const { name, website, location, description, researchDomains, facilities, logo_url } = body;

    // Validate logo_url if provided
    let validLogoUrl: string | null | undefined = undefined;
    if (logo_url !== undefined) {
      if (logo_url === null || logo_url === "") {
        validLogoUrl = null;
      } else if (typeof logo_url === "string") {
        if (logo_url.length > 2048) {
          return NextResponse.json({ error: "Logo URL exceeds maximum length of 2048 characters" }, { status: 400 });
        }
        try {
          const parsed = new URL(logo_url.trim());
          if (!["http:", "https:"].includes(parsed.protocol)) {
            return NextResponse.json({ error: "Logo URL must use http or https protocol" }, { status: 400 });
          }
          validLogoUrl = logo_url.trim();
        } catch {
          return NextResponse.json({ error: "Invalid logo URL format" }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: "Invalid logo URL format" }, { status: 400 });
      }
    }

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

      let existingPage: { id: string; claimed_by: string | null; is_verified?: boolean } | null = null;
      if (existingOrg) {
        orgId = existingOrg.id;

        // Check if organization or company page is already claimed by someone else
        const { data: foundPage } = await supabaseAdmin
          .from("company_pages")
          .select("id, claimed_by, is_verified")
          .eq("organization_id", orgId)
          .maybeSingle();
        existingPage = foundPage;

        const isAdmin = isUserAdmin(user);
        if (!isAdmin) {
          if (existingPage && existingPage.claimed_by && existingPage.claimed_by !== user.id) {
            return NextResponse.json({ error: "Forbidden: This organization is already claimed by another administrator" }, { status: 403 });
          }
          const isCreator = existingOrg.created_by && existingOrg.created_by === user.id;
          const isClaimant = existingPage && existingPage.claimed_by === user.id;
          if (!isCreator && !isClaimant) {
            return NextResponse.json({
              error: "Forbidden: This organization is an official institutional entity or managed by another account. Please submit an official claim request via the Company Claim portal to verify ownership."
            }, { status: 403 });
          }
        }

        const orgUpdatePayload: Record<string, any> = { website, description };
        if (validLogoUrl !== undefined) {
          orgUpdatePayload.logo_url = validLogoUrl;
        }

        await supabaseAdmin
          .from("organizations")
          .update(orgUpdatePayload)
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
            ...(validLogoUrl !== undefined ? { logo_url: validLogoUrl } : {}),
          })
          .select("id")
          .single();
        if (newOrg) orgId = newOrg.id;
      }

      // 3. Upsert company_pages record linked to claimed_by
      // Critical security rule: Employer updating/uploading logo NEVER auto-verifies company.
      // is_verified remains strictly an administrative trust decision.
      if (orgId) {
        const isAdmin = isUserAdmin(user);
        const isVerified = isAdmin ? true : (existingPage?.is_verified ?? false);
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
            is_verified: isVerified,
            ...(validLogoUrl !== undefined ? { logo_url: validLogoUrl } : {}),
            updated_at: new Date().toISOString(),
          }, { onConflict: "organization_id" });
      }
    }

    return NextResponse.json({ success: true, message: "Company profile updated and persisted" });
  } catch (err: any) {
    console.error("Failed to update company profile:", err);
    return NextResponse.json({ error: "Failed to update company profile" }, { status: 500 });
  }
}
