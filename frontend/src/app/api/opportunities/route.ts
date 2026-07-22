import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { postToTelegram } from "@/lib/telegram-bot";
import { mapDbOpportunityToClient } from "@/lib/utils";
import { GARBAGE_TITLE_PATTERNS, slugify } from "@/lib/scrapers/utils";
import { opportunitySchema, opportunityListQuerySchema } from "@berojgardegreewala/api";
import { success, list, validationError, serverError, requireAdmin } from "@berojgardegreewala/api";

// A row is displayable only if it has a real title that is not a nav/menu heading.
function isDisplayableOpportunity(o: { title?: string | null } | null): boolean {
  if (!o || !o.title) return false;
  const t = o.title.trim();
  if (t.length < 6) return false;
  return !GARBAGE_TITLE_PATTERNS.test(t);
}

export async function GET(request: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = opportunityListQuerySchema.parse(Object.fromEntries(searchParams));

    const { page, limit, category, eligibility, location, deadline, verified, search } = query;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const today = new Date().toISOString().split("T")[0];

    let supabaseQuery = supabaseAdmin
      .from("opportunities")
      .select("*, organizations(*)", { count: "exact" })
      .eq("is_active", true)
      .or(`deadline.gte.${today},deadline.is.null`)
      .order("created_at", { ascending: false });

    if (verified === "all") {
      supabaseQuery = supabaseQuery.neq("verification_status", "pending");
    } else {
      supabaseQuery = supabaseQuery.eq("verification_status", "verified");
    }

    if (category && category !== "All") {
      if (category === "Research Fellowship") {
        supabaseQuery = supabaseQuery.or(`category.ilike.%Research Fellowship%,category.ilike.%JRF%,category.ilike.%SRF%`);
      } else if (category === "PhD Scholarship") {
        supabaseQuery = supabaseQuery.or(`category.ilike.%PhD%,category.ilike.%Scholarship%`);
      } else {
        supabaseQuery = supabaseQuery.ilike("category", `%${category}%`);
      }
    }

    if (eligibility && eligibility !== "All") {
      supabaseQuery = supabaseQuery.ilike("eligibility", `%${eligibility}%`);
    }

    if (location && location !== "All") {
      if (location === "International") {
        supabaseQuery = supabaseQuery.not("location", "ilike", "%India%");
        supabaseQuery = supabaseQuery.not("location", "ilike", "%Delhi%");
        supabaseQuery = supabaseQuery.not("location", "ilike", "%Bangalore%");
        supabaseQuery = supabaseQuery.not("location", "ilike", "%Mumbai%");
      } else {
        supabaseQuery = supabaseQuery.ilike("location", `%${location}%`);
      }
    }

    if (deadline && deadline !== "All") {
      const now = new Date();
      if (deadline === "This Week") {
        const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        supabaseQuery = supabaseQuery.gte("deadline", now.toISOString().split("T")[0]);
        supabaseQuery = supabaseQuery.lte("deadline", weekLater.toISOString().split("T")[0]);
      } else if (deadline === "This Month") {
        const monthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        supabaseQuery = supabaseQuery.gte("deadline", now.toISOString().split("T")[0]);
        supabaseQuery = supabaseQuery.lte("deadline", monthLater.toISOString().split("T")[0]);
      } else if (deadline === "Later") {
        const monthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        supabaseQuery = supabaseQuery.gt("deadline", monthLater.toISOString().split("T")[0]);
      }
    }

    if (search) {
      const cleanSearch = search.replace(/[{}()"\\,.]/g, "").slice(0, 100);
      let matchingOrgIds: string[] = [];
      const { data: orgs } = await supabaseAdmin
        .from("organizations")
        .select("id")
        .ilike("name", `%${cleanSearch}%`);
      if (orgs && orgs.length > 0) {
        matchingOrgIds = orgs.map((o: { id: string }) => o.id);
      }

      if (matchingOrgIds.length > 0) {
        supabaseQuery = supabaseQuery.or(
          `title.ilike.%${cleanSearch}%,organization_id.in.(${matchingOrgIds.join(",")}),tags.cs.{"${cleanSearch}"}`
        );
      } else {
        supabaseQuery = supabaseQuery.or(
          `title.ilike.%${cleanSearch}%,tags.cs.{"${cleanSearch}"}`
        );
      }
    }

    const { data, count, error } = await supabaseQuery.range(start, end);

    if (error) throw error;

    // Map to client shape, then drop legacy garbage-title rows on the read path.
    const mappedData = (data ? data.map(mapDbOpportunityToClient) : []).filter(
      isDisplayableOpportunity
    );

    return NextResponse.json({
      opportunities: mappedData,
      count: mappedData.length,
      total_count: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await request.json();
    const body = opportunitySchema.parse(raw);

let sourceType = body.source_type;
    if (!sourceType) {
      sourceType = "employer_posted";
    }

    let oppSlug = slugify(body.title);
    if (!oppSlug) oppSlug = `opportunity-${Date.now()}`;
    const { data: existingSlug } = await supabaseAdmin
      .from("opportunities")
      .select("id")
      .eq("slug", oppSlug)
      .maybeSingle();
    if (existingSlug) oppSlug = `${oppSlug}-${Date.now()}`;

    const { data, error } = await supabaseAdmin
      .from("opportunities")
      .insert([{
        ...body,
        slug: oppSlug,
        source_type: sourceType,
        verification_status: "pending",
        is_active: true,
      }])
      .select();

    if (error) throw error;

    const newOpportunity = data?.[0];
    if (newOpportunity && admin.role === "admin") {
      postToTelegram(newOpportunity).catch((e) =>
        console.error("Telegram post failed (non-blocking):", e)
      );
    }

    return NextResponse.json({ opportunity: newOpportunity }, { status: 201 });
  } catch (error) {
    console.error("Error creating opportunity:", error);
    return NextResponse.json(
      { error: "Failed to create opportunity" },
      { status: 500 }
    );
  }
}