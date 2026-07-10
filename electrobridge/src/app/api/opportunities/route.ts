import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";

/**
 * Strip PostgREST filter metacharacters from user input before it is
 * interpolated into .or()/.ilike() strings. Prevents filter injection where
 * characters like , { } ( ) . could break out of the intended predicate.
 */
function sanitizeSearchInput(input: string): string {
  return input
    .replace(/[{}(),."\\\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

const CREATABLE_FIELDS = [
  "title",
  "category",
  "apply_url",
  "organization_id",
  "description",
  "eligibility",
  "location",
  "is_international",
  "salary_range",
  "deadline",
  "specialization",
  "tags",
  "source_type",
  "source_url",
];

export async function GET(request: NextRequest) {
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const location = searchParams.get("location");
    const specialization = searchParams.get("specialization");
    const deadline = searchParams.get("deadline");
    const search = searchParams.get("search");
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 50);
    const offset = (page - 1) * limit;

    const today = new Date().toISOString().split("T")[0];

    let query = supabaseAdmin
      .from("opportunities")
      .select("*, organizations(name, slug, type, logo_url)", { count: "exact" })
      .eq("is_active", true)
      .eq("verification_status", "verified")
      .or(`deadline.gte.${today},deadline.is.null`)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (location === "india") {
      query = query.eq("is_international", false);
    } else if (location === "international") {
      query = query.eq("is_international", true);
    }

    if (specialization && specialization !== "all") {
      query = query.contains("specialization", [specialization]);
    }

    if (deadline === "week") {
      const week = new Date(Date.now() + 7 * 864e5).toISOString().split("T")[0];
      query = query.gte("deadline", today).lte("deadline", week);
    } else if (deadline === "month") {
      const month = new Date(Date.now() + 30 * 864e5).toISOString().split("T")[0];
      query = query.gte("deadline", today).lte("deadline", month);
    }

    if (search) {
      const clean = sanitizeSearchInput(search);
      if (clean.length > 0) {
        query = query.or(`title.ilike.%${clean}%,description.ilike.%${clean}%`);
      }
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      opportunities: data || [],
      count: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    return NextResponse.json({ error: "Failed to fetch opportunities" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  // Only admins may create opportunities directly via the API.
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, category, apply_url } = body;

    if (!title || !category || !apply_url) {
      return NextResponse.json(
        { error: "Missing required fields: title, category, apply_url" },
        { status: 400 }
      );
    }

    const slug =
      String(title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) +
      "-" +
      Date.now().toString(36);

    const record: Record<string, unknown> = {
      slug,
      is_active: true,
      verification_status: "verified",
      source_type: "manual",
    };
    for (const key of CREATABLE_FIELDS) {
      if (key in body) record[key] = body[key];
    }

    const { data, error } = await supabaseAdmin
      .from("opportunities")
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ opportunity: data }, { status: 201 });
  } catch (error) {
    console.error("Error creating opportunity:", error);
    return NextResponse.json({ error: "Failed to create opportunity" }, { status: 500 });
  }
}
