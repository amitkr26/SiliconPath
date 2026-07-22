import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";

function isSafePublicUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  const host = url.hostname.toLowerCase();
  const blocked = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "169.254.169.254",
    "metadata.google.internal",
  ];
  if (blocked.includes(host)) return false;
  if (/^10\./.test(host)) return false;
  if (/^192\.168\./.test(host)) return false;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)) return false;
  if (/^127\./.test(host)) return false;

  return true;
}

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const sourceType = searchParams.get("source_type");

  let query = supabaseAdmin
    .from("scrape_sources")
    .select("*", { count: "exact" })
    .order("priority", { ascending: true });

  if (sourceType) query = query.eq("adapter", sourceType);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ sources: data || [], count: count || 0 });
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const body = await request.json();
  const { name, url, adapter, category, organization_id, is_active, priority, batch } = body;

  if (!name || !url || !adapter) {
    return NextResponse.json(
      { error: "Missing required fields: name, url, adapter" },
      { status: 400 }
    );
  }

  if (!isSafePublicUrl(url)) {
    return NextResponse.json(
      { error: "Invalid URL: internal or non-http(s) addresses are not allowed" },
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ source: data }, { status: 201 });
}

const UPDATABLE_FIELDS = [
  "name",
  "url",
  "adapter",
  "category",
  "is_active",
  "priority",
  "batch",
  "organization_id",
] as const;

export async function PUT(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });

  if (updates.url && !isSafePublicUrl(updates.url)) {
    return NextResponse.json(
      { error: "Invalid URL: internal or non-http(s) addresses are not allowed" },
      { status: 400 }
    );
  }

  const sanitized: Record<string, unknown> = {};
  for (const key of UPDATABLE_FIELDS) {
    if (key in updates) sanitized[key] = updates[key];
  }

  const { data, error } = await supabaseAdmin
    .from("scrape_sources")
    .update(sanitized)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ source: data });
}

export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });

  const { error } = await supabaseAdmin.from("scrape_sources").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
