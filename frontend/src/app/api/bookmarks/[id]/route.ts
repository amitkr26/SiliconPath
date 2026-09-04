import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { apiError } from "@/lib/api-utils";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("saved_opportunities")
    .delete()
    .or(`id.eq.${id},opportunity_id.eq.${id}`)
    .eq("user_id", user.id);

  if (error) return apiError(error, "bookmarks-delete");

  return NextResponse.json({ success: true });
}