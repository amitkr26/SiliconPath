import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@siliconpath/api";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
});

export async function GET() {
  const { data, error } = await supabaseAdmin!
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ announcements: data || [] });
}

export async function POST(request: NextRequest) {
  requireAdmin(request);
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });

  const { data, error } = await supabaseAdmin!
    .from("announcements")
    .insert(parsed.data)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  requireAdmin(request);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Announcement ID required" }, { status: 400 });

  const { error } = await supabaseAdmin!.from("announcements").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
