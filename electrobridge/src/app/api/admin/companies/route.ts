import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@siliconpath/api";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin!
    .from("company_pages")
    .select("*")
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ companies: data || [] });
}

export async function POST(request: NextRequest) {
  requireAdmin(request);
  const body = await request.json();
  const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const { data, error } = await supabaseAdmin!
    .from("company_pages")
    .insert([{ ...body, slug, follower_count: 0 }])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
