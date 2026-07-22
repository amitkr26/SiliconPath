import { NextRequest } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { requireAdmin, serverError, forbidden } from "@berojgardegreewala/api";
import { adminOpportunityUpdateSchema } from "@/lib/validation";
import { validateOrThrow } from "@/lib/validation";

async function guard(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (e) {
    if (e instanceof Response) throw e;
    throw serverError();
  }
}

function dbUnavailable() {
  return new Response(JSON.stringify({ error: "Database not configured" }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(request: NextRequest) {
  try {
    await guard(request);
  } catch (e) {
    return e instanceof Response ? e : serverError();
  }

  if (!isAdminConfigured) return dbUnavailable();

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
    const status = searchParams.get("status");
    const start = (page - 1) * limit;

    let query = supabaseAdmin
      .from("opportunities")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(start, start + limit - 1);

    if (status) {
      query = query.eq("verification_status", status);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return new Response(
      JSON.stringify({ opportunities: data || [], count: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Admin fetch opportunities error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await guard(request);
  } catch (e) {
    return e instanceof Response ? e : serverError();
  }

  if (!isAdminConfigured || !supabaseAdmin) return dbUnavailable();

  try {
    const body = await request.json();
    const data = validateOrThrow(adminOpportunityUpdateSchema, body);

    const { data: opportunity, error } = await supabaseAdmin
      .from("opportunities")
      .insert({ ...data, verification_status: "pending", is_active: true })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ opportunity }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Admin create opportunity error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}