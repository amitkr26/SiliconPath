import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";
import { adminOpportunityUpdateSchema } from "@/lib/validation";
import { validateOrThrow } from "@/lib/validation";

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  if (!isAdminConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

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

    return NextResponse.json({
      opportunities: data || [],
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Admin fetch opportunities error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const data = validateOrThrow(adminOpportunityUpdateSchema, body);

    const { data: opportunity, error } = await supabaseAdmin
      .from("opportunities")
      .insert({ ...data, verification_status: "pending", is_active: true })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (error) {
    console.error("Admin create opportunity error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}