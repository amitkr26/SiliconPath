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
      supabaseQuery = supabaseQuery.neq("verification_status", "rejected");
    } else {
      supabaseQuery = supabaseQuery.or("verification_status.eq.verified,verification_status.is.null,verification_status.eq.auto_verified");
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
      const cleanSearch = search.replace(/[{}()"\\,.]/g, "").trim().slice(0, 100);
      const words = cleanSearch.split(/\s+/).filter((k) => k.length >= 2);

      const queryWordSet = async (wordArray: string[]) => {
        let q = supabaseAdmin
          .from("opportunities")
          .select("*, organizations(*)", { count: "exact" })
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (verified === "all") {
          q = q.neq("verification_status", "rejected");
        } else {
          q = q.or("verification_status.eq.verified,verification_status.is.null,verification_status.eq.auto_verified");
        }

        if (category && category !== "All") {
          if (category === "Research Fellowship") {
            q = q.or("category.ilike.%Research Fellowship%,category.ilike.%JRF%,category.ilike.%SRF%");
          } else if (category === "PhD Scholarship") {
            q = q.or("category.ilike.%PhD%,category.ilike.%Scholarship%");
          } else {
            q = q.ilike("category", `%${category}%`);
          }
        }

        if (eligibility && eligibility !== "All") {
          q = q.ilike("eligibility", `%${eligibility}%`);
        }

        if (location && location !== "All") {
          if (location === "International") {
            q = q.not("location", "ilike", "%India%").not("location", "ilike", "%Delhi%").not("location", "ilike", "%Bangalore%").not("location", "ilike", "%Mumbai%");
          } else {
            q = q.ilike("location", `%${location}%`);
          }
        }

        if (deadline && deadline !== "All") {
          const now = new Date();
          if (deadline === "This Week") {
            const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            q = q.gte("deadline", now.toISOString().split("T")[0]).lte("deadline", weekLater.toISOString().split("T")[0]);
          } else if (deadline === "This Month") {
            const monthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            q = q.gte("deadline", now.toISOString().split("T")[0]).lte("deadline", monthLater.toISOString().split("T")[0]);
          } else if (deadline === "Later") {
            const monthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            q = q.gt("deadline", monthLater.toISOString().split("T")[0]);
          }
        }

        for (const w of wordArray) {
          const { data: orgs } = await supabaseAdmin
            .from("organizations")
            .select("id")
            .ilike("name", `%${w}%`);

          let cond = `title.ilike.%${w}%,category.ilike.%${w}%,eligibility.ilike.%${w}%,description.ilike.%${w}%`;
          if (orgs && orgs.length > 0) {
            const orgIds = orgs.map((o: { id: string }) => o.id);
            cond += `,organization_id.in.(${orgIds.join(",")})`;
          }
          q = q.or(cond);
        }

        return await q.range(start, end);
      }

      let matchType = "none";
      let matchedQuery = "";
      let res = await queryWordSet(words);

      if (res.data && res.data.length > 0) {
        matchType = "exact";
        matchedQuery = cleanSearch;
      } else if (words.length >= 2) {
        const mainCat = words.find((w) => /^(phd|jrf|srf|job|internship|fellowship|scholarship)$/i.test(w));
        const mainEnt = words.find((w) => /^(iit|bits|iiit|drdo|isro|csir|vlsi|intel|qualcomm|nvidia|amd)$/i.test(w)) || words[0];

        if (mainCat && mainEnt && mainCat.toLowerCase() !== mainEnt.toLowerCase()) {
          res = await queryWordSet([mainEnt, mainCat]);
          if (res.data && res.data.length > 0) {
            matchType = "relevant";
            matchedQuery = `${mainEnt} ${mainCat}`;
          }
        }

        if (!res.data || res.data.length === 0) {
          res = await queryWordSet([words[0], words[words.length - 1]]);
          if (res.data && res.data.length > 0) {
            matchType = "relevant";
            matchedQuery = `${words[0]} ${words[words.length - 1]}`;
          }
        }
      }

      if (!res.data || res.data.length === 0) {
        const prim = words.find((w) => /^(phd|jrf|srf|drdo|isro|csir|vlsi)$/i.test(w)) || words[0];
        res = await queryWordSet([prim]);
        if (res.data && res.data.length > 0) {
          matchType = "broad";
          matchedQuery = prim;
        }
      }

      const mappedData = (res.data ? res.data.map(mapDbOpportunityToClient) : []).filter(isDisplayableOpportunity);

      return NextResponse.json({
        opportunities: mappedData,
        count: mappedData.length,
        total_count: res.count || 0,
        page,
        limit,
        total_pages: Math.ceil((res.count || 0) / limit),
        match_type: matchType,
        matched_query: matchedQuery,
      });
    }

    const { data, count, error } = await supabaseQuery.range(start, end);

    if (error) throw error;

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