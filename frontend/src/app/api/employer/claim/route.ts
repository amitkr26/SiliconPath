import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedEmployerUser, isUserAdmin, isUserEmployer } from "@/lib/employer-auth";
import { verifyAdmin } from "@/lib/admin-auth";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const claimSchema = z.object({
  organizationId: z.string().uuid(),
  businessEmail: z.string().email(),
  verificationDetails: z.string().min(10).max(2000),
});

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  const user = await getAuthenticatedEmployerUser(request);
  if (!isAdmin && !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }
  try {
    const isPlatformAdmin = isAdmin || isUserAdmin(user);
    let query = supabaseAdmin
      .from("company_claims")
      .select(`
        id,
        organization_id,
        claimed_by,
        status,
        message,
        reviewed_by,
        reviewed_at,
        created_at,
        organization:organizations(id, name, slug, logo_url, website)
      `)
      .order("created_at", { ascending: false });

    if (!isPlatformAdmin) {
      query = query.eq("claimed_by", user!.id);
    }

    const { data: claims, error } = await query;
    if (error) {
      const { data: rawClaims } = await supabaseAdmin
        .from("company_claims")
        .select("*")
        .eq("claimed_by", user.id);
      return NextResponse.json({ claims: rawClaims || [] });
    }

    return NextResponse.json({ claims: claims || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch company claims" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isEmployer = await isUserEmployer(user);
  if (!isEmployer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const raw = await request.json();
    const body = claimSchema.parse(raw);

    // 1. Insert into real company_claims table
    const { data: claim, error: claimErr } = await supabaseAdmin
      .from("company_claims")
      .insert({
        organization_id: body.organizationId,
        claimed_by: user.id,
        status: "pending",
        message: `Email: ${body.businessEmail} | Details: ${body.verificationDetails}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (claimErr) throw claimErr;

    // 2. Insert notification record for the user
    await supabaseAdmin
      .from("notifications")
      .insert([{
        user_id: user.id,
        type: "system",
        message: `Your claim request for organization ${body.organizationId} has been submitted for verification.`,
        is_read: false,
      }]);

    return NextResponse.json({ success: true, claim, message: "Claim submitted successfully" }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to submit claim" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  const user = await getAuthenticatedEmployerUser(request);

  const isPlatformAdmin = isAdmin || isUserAdmin(user);

  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden: Admin access required to review claims" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { claimId, status } = body;

    if (!claimId || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Valid claimId and status ('approved'|'rejected') required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("company_claims")
      .update({
        status,
        reviewed_by: user?.id || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", claimId)
      .select("*, organization:organizations(id, name, slug, website, description)")
      .single();

    if (error) throw error;

    // When approved, link claimed_by to company_pages and mark is_verified = true
    if (status === "approved" && data?.organization_id && data?.claimed_by) {
      const org = (data as any).organization;
      await supabaseAdmin
        .from("company_pages")
        .upsert({
          organization_id: data.organization_id,
          name: org?.name || "Company",
          slug: org?.slug || `company-${Date.now()}`,
          website: org?.website || "",
          description: org?.description || "",
          claimed_by: data.claimed_by,
          is_verified: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: "organization_id" });

      try {
        await supabaseAdmin.from("notifications").insert([{
          user_id: data.claimed_by,
          type: "system",
          message: `Your ownership claim for ${org?.name || "organization"} has been approved! You now have administrative access.`,
          is_read: false,
        }]);
      } catch { /* ignore notification failure */ }
    } else if (status === "rejected" && data?.claimed_by) {
      const org = (data as any).organization;
      try {
        await supabaseAdmin.from("notifications").insert([{
          user_id: data.claimed_by,
          type: "system",
          message: `Your ownership claim for ${org?.name || "organization"} was not approved. Please contact support with official credentials.`,
          is_read: false,
        }]);
      } catch { /* ignore notification failure */ }
    }

    return NextResponse.json({ success: true, claim: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to review claim" }, { status: 500 });
  }
}
