import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@berojgardegreewala/api";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  website: z.string().url().max(500).optional(),
  logo_url: z.string().url().max(500).optional(),
  industry: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  size: z.string().max(50).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(request); } catch (e) { return e instanceof Response ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });

  const { error } = await supabaseAdmin!
    .from("company_pages")
    .update(parsed.data)
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(request); } catch (e) { return e instanceof Response ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { id } = await params;
  const { error } = await supabaseAdmin!
    .from("company_pages")
    .delete()
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
