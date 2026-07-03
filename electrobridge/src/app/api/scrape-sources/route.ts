import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sourceType = searchParams.get("source_type");

    let query = supabaseAdmin
      .from("scrape_sources")
      .select("*", { count: "exact" })
      .order("priority", { ascending: true });

    if (sourceType) {
      query = query.eq("source_type", sourceType);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      sources: data || [],
      count: count || 0,
    });
  } catch (error) {
    console.error("Error fetching scrape sources:", error);
    return NextResponse.json(
      { error: "Failed to fetch scrape sources" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { name, source_type, url, adapter, category, is_active, priority } = body;

    if (!name || !source_type || !url || !adapter) {
      return NextResponse.json(
        { error: "Missing required fields: name, source_type, url, adapter" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("scrape_sources")
      .insert([{
        name,
        source_type,
        url,
        adapter,
        category,
        is_active: is_active ?? true,
        priority: priority ?? 100,
      }])
      .select()
      .single();

    if (error) throw error;

    const supabase = createClient();
    await supabase.auth.refreshSession();

    return NextResponse.json({ source: data }, { status: 201 });
  } catch (error) {
    console.error("Error creating scrape source:", error);
    return NextResponse.json(
      { error: "Failed to create scrape source" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("scrape_sources")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ source: data });
  } catch (error) {
    console.error("Error updating scrape source:", error);
    return NextResponse.json(
      { error: "Failed to update scrape source" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("scrape_sources")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scrape source:", error);
    return NextResponse.json(
      { error: "Failed to delete scrape source" },
      { status: 500 }
    );
  }
}
