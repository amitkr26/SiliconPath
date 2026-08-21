import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { resolveOrganizationId } from "@/lib/scrapers/run-opportunity-scrape";
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
  apply_link: z.string().url().max(1000).nullable().default(null),
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

async function isEmployerUser(userId: string, userMetadata: any): Promise<boolean> {
  const role = userMetadata?.role || userMetadata?.account_type;
  if (role === "employer" || role === "provider" || role === "admin") return true;

  const { data } = await supabaseAdmin
    .from("user_profiles")
    .select("account_type")
    .eq("id", userId)
    .maybeSingle();

  const pRole = (data?.account_type || "").toLowerCase();
  return pRole === "employer" || pRole === "provider" || pRole === "admin";
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const allowed = await isEmployerUser(user.id, user.user_metadata);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("opportunities")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ opportunities: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const allowed = await isEmployerUser(user.id, user.user_metadata);
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
    const { data: orgRows } = await supabaseAdmin
      .from("organizations")
      .select("id, name, slug, website");
    const orgId = await resolveOrganizationId(
      { title: body.title, organization: body.organization, tags: body.tags },
      orgRows ?? []
    );

    // Map exact schema attributes of live opportunities table with valid lowercase category constraint
    const insertPayload = {
      title: body.title,
      category: normalizeCategory(body.category),
      location: body.location || "India",
      country: "India",
      organization_id: orgId,
      salary_range: body.stipend,
      eligibility: body.eligibility,
      description: body.description,
      apply_url: body.apply_link || "",
      tags: body.tags,
      slug: oppSlug,
      source_type: "employer_posted",
      // P0.2: employer posts start unverified; only the admin verification queue promotes
      is_active: true,
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
    return NextResponse.json({ opportunity: data }, { status: 201 });
  } catch (err: any) {
    console.error("Employer Post Job Error:", err);
    return NextResponse.json({ error: err.message || "Failed to post opportunity" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const allowed = await isEmployerUser(user.id, user.user_metadata);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, is_active, title, stipend, deadline, location, eligibility, description } = body;

    if (!id) {
      return NextResponse.json({ error: "Opportunity ID is required" }, { status: 400 });
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update opportunity" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const allowed = await isEmployerUser(user.id, user.user_metadata);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Opportunity ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("opportunities")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Opportunity deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete opportunity" }, { status: 500 });
  }
}
