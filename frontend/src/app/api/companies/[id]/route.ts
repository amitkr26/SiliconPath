import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: company, error } = await supabase
    .from("company_pages")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: "Company not found" }, { status: 404 });
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  let is_following = false;
  if (user) {
    const { data: follow } = await supabase
      .from("company_followers")
      .select("id")
      .eq("user_id", user.id)
      .eq("company_id", id)
      .single();
    is_following = !!follow;
  }

  return NextResponse.json({ ...company, is_following });
}
