import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";

/**
 * Reject URLs pointing at internal / link-local / private ranges to prevent SSRF
 * once a source is fed to the scraper.
 */
function isUnsafeUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return true;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return true;

  const host = url.hostname.toLowerCase();
  const blocked = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "169.254.169.254", // cloud metadata endpoint
    "metadata.google.internal",
  ];
  if (blocked.includes(host)) return true;
  if (host.endsWith(".internal") || host.endsWith(".local")) return true;
  if (
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
  ) {
    return true;
  }
  return false;
}

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = supabaseAdmin
      .from("scrape_sources")
      .select("*", { count: "exact" })
      .order("priority", { ascending: true });

    if (category) query = query.eq("category", category);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ sources: data || [], count: count || 0 });
  } catch (error) {
    console.error("Error fetching scrape sources:", error);
    return NextResponse.json({ error: "Failed to fetch scrape sources" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { name, url, adapter, category, organization_id, is_active, priority, batch } = body;

    if (!name || !url || !adapter) {
      return NextResponse.json(
        { error: "Missing required fields: name, url, adapter" },
        { status: 400 }
      );
    }

    if (isUnsafeUrl(url)) {
      return NextResponse.json(
        { error: "Invalid URL: internal/private addresses are not allowed" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("scrape_sources")
      .insert([
        {
          name,
          url,
          adapter,
          category,
          organization_id: organization_id ?? null,
          is_active: is_active ?? true,
          priority: priority ?? 100,
          batch: batch ?? 1,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ source: data }, { status: 201 });
  } catch (error) {
    console.error("Error creating scrape source:", error);
    return NextResponse.json({ error: "Failed to create scrape source" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { id, ...rest } = body;
    if (!id) {
      return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
    }

    // Whitelist updatable columns
    const ALLOWED = [
      "name",
      "url",
      "adapter",
      "category",
      "organization_id",
      "is_active",
      "priority",
      "batch",
    ];
    const updates: Record<string, unknown> = {};
    for (const key of ALLOWED) {
      if (key in rest) updates[key] = rest[key];
    }

    if (typeof updates.url === "string" && isUnsafeUrl(updates.url)) {
      return NextResponse.json(
        { error: "Invalid URL: internal/private addresses are not allowed" },
        { status: 400 }
      );
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
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
    return NextResponse.json({ error: "Failed to update scrape source" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("scrape_sources").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scrape source:", error);
    return NextResponse.json({ error: "Failed to delete scrape source" }, { status: 500 });
  }
}
