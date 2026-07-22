import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@berojgardegreewala/api";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  website: z.string().url().max(500).optional(),
  logo_url: z.string().url().max(500).optional(),
  industry: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  size: z.string().max(50).optional(),
});

export async function GET(request: NextRequest) {
  try { await requireAdmin(request); } catch (e) { return e instanceof Response ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { data, error } = await supabaseAdmin!
    .from("company_pages")
    .select("*")
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ companies: data || [] });
}

export async function POST(request: NextRequest) {
  try { await requireAdmin(request); } catch (e) { return e instanceof Response ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });

  const slug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const { data, error } = await supabaseAdmin!
    .from("company_pages")
    .insert([{ ...parsed.data, slug, follower_count: 0 }])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
