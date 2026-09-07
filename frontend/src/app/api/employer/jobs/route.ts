import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedEmployerUser, isUserAdmin, isUserEmployer } from "@/lib/employer-auth";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
import { resolveOrganizationId } from "@/lib/scrapers/run-opportunity-scrape";
import { apiError } from "@/lib/api-utils";
import { z } from "zod";

const postJobSchema = z.object({
  title: z.string().min(3).max(300),
  organization: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  location: z.string().max(200).nullable().default(null),
  stipend: z.string().max(100).nullable().default(null),
  deadline: z.string().max(50).nullable().default(null),
  eligibility: z.string().max(500).nullable().default(null),
  description: z.string().max(5000).nullable().default(null),
  apply_link: z.string().max(1000).optional().nullable().default(null),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeCategory(cat: string): string {
  const c = (cat || "").trim().toLowerCase();
  if (c.includes("jrf")) return "jrf";
  if (c.includes("srf")) return "srf";
  if (c.includes("phd")) return "phd";
  if (c.includes("govt") || c.includes("government")) return "government";
  if (c.includes("intern")) return "internship";
  if (c.includes("fellow")) return "fellowship";
  return "jrf"; // Allowed DB check constraint values: 'jrf', 'srf', 'phd', 'fellowship', 'government', 'internship'
}


export async function GET(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const allowed = await isUserEmployer(user);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isAdmin = isUserAdmin(user);
  let query = supabaseAdmin
    .from("opportunities")
    .select("*, organization:organizations(*)")
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    query = query.or(`created_by.eq.${user.id},employer_id.eq.${user.id}`);
  }

  const { data, error } = await query;

  if (error) return apiError(error, "employer-jobs-list");
  return NextResponse.json({ jobs: data || [], opportunities: data || [] });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const allowed = await isUserEmployer(user);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const raw = await request.json();
    const body = postJobSchema.parse(raw);

    let oppSlug = slugify(body.title);
    if (!oppSlug) oppSlug = `opportunity-${Date.now()}`;
    const { data: existingSlug } = await supabaseAdmin
      .from("opportunities")
      .select("id")
      .eq("slug", oppSlug)
      .maybeSingle();

    if (existingSlug) {
      oppSlug = `${oppSlug}-${Date.now()}`;
    }

    // P0.3: resolve organization_id from the submitted org name (evidence-gated,
    // creates the org row only when the name passes the person-name guard).
    // Verify employer owns this organization before posting.
    const { data: orgRows } = await supabaseAdmin
      .from("organizations")
      .select("id, name, slug, website, created_by");
    const orgId = await resolveOrganizationId(
      { title: body.title, organization: body.organization, tags: body.tags },
      orgRows ?? []
    );

    if (orgId && orgRows?.length) {
      const orgOwner = orgRows.find((o: any) => o.id === orgId)?.created_by;
      if (orgOwner && orgOwner !== user.id) {
        return NextResponse.json(
          { error: "Organization does not belong to your account" },
          { status: 403 }
        );
      }
    }

    // Map exact schema attributes of live opportunities table with valid lowercase category constraint
    const insertPayload = {
      title: body.title,
      category: normalizeCategory(body.category),
      location: body.location || "India",
      country: "India",
      organization_id: orgId,
      organization: body.organization,
      salary_range: body.stipend,
      eligibility: body.eligibility,
      description: body.description,
      deadline: body.deadline || null,
      apply_url: body.apply_link || "",
      tags: body.tags,
      slug: oppSlug,
      source_type: "employer_posted",
      is_active: true,
      posted_date: new Date().toISOString(),
      created_by: user.id,
    };

    const { data, error } = await supabaseAdmin
      .from("opportunities")
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      console.error("Employer Post Job DB Error:", error);
      throw new Error(error.message);
    }
    return NextResponse.json({ job: data, opportunity: data }, { status: 201 });
  } catch (err) {
    console.error("Employer Post Job Error:", err);
    return apiError(err, "employer-jobs-create");
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const allowed = await isUserEmployer(user);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, is_active, title, stipend, deadline, location, eligibility, description } = body;

    if (!id) {
      return NextResponse.json({ error: "Opportunity ID is required" }, { status: 400 });
    }

    // Ownership check (prevents IDOR)
    const isAdmin = isUserAdmin(user);
    if (!isAdmin) {
      const { data: existingOpp } = await supabaseAdmin
        .from("opportunities")
        .select("id, created_by")
        .eq("id", id)
        .maybeSingle();

      if (!existingOpp) {
        return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
      }

      if (existingOpp.created_by && existingOpp.created_by !== user.id) {
        return NextResponse.json({ error: "Forbidden: You do not own this opportunity" }, { status: 403 });
      }
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (typeof is_active === "boolean") updates.is_active = is_active;
    if (title) updates.title = title;
    if (stipend !== undefined) updates.salary_range = stipend;
    if (deadline !== undefined) updates.deadline = deadline;
    if (location !== undefined) updates.location = location;
    if (eligibility !== undefined) updates.eligibility = eligibility;
    if (description !== undefined) updates.description = description;

    const { data, error } = await supabaseAdmin
      .from("opportunities")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, opportunity: data });
  } catch (err) {
    return apiError(err, "employer-jobs-update");
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const allowed = await isUserEmployer(user);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Opportunity ID is required" }, { status: 400 });
    }

    // Ownership check (prevents IDOR)
    const isAdmin = isUserAdmin(user);
    if (!isAdmin) {
      const { data: existingOpp } = await supabaseAdmin
        .from("opportunities")
        .select("id, created_by")
        .eq("id", id)
        .maybeSingle();

      if (!existingOpp) {
        return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
      }

      if (existingOpp.created_by && existingOpp.created_by !== user.id) {
        return NextResponse.json({ error: "Forbidden: You do not own this opportunity" }, { status: 403 });
      }
    }

    const { error } = await supabaseAdmin
      .from("opportunities")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Opportunity deleted successfully" });
  } catch (err) {
    return apiError(err, "employer-jobs-delete");
  }
}
