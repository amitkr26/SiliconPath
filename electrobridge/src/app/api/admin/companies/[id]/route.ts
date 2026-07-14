import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@siliconpath/api";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  requireAdmin(request);
  const { id } = await params;
  const body = await request.json();
  const { error } = await supabaseAdmin!
    .from("company_pages")
    .update(body)
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  requireAdmin(request);
  const { id } = await params;
  const { error } = await supabaseAdmin!
    .from("company_pages")
    .delete()
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
