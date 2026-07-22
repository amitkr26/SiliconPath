import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
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

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = user.user_metadata?.role;
  if (role !== "employer" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { data, error } = await supabaseAdmin
    .from("opportunities")
    .select("*")
    .eq("posted_by", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ opportunities: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = user.user_metadata?.role;
  if (role !== "employer" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
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

    const { data, error } = await supabaseAdmin
      .from("opportunities")
      .insert([{
        ...body,
        slug: oppSlug,
        source_type: "employer_posted",
        verification_status: "pending",
        is_active: true,
        posted_by: user.id,
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ opportunity: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to post opportunity" }, { status: 400 });
  }
}
