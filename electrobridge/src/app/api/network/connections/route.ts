import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface PersonRow {
  id: string;
  display_name: string | null;
  headline: string | null;
  current_company: string | null;
  avatar_url: string | null;
}

// GET: accepted connections of the current user (v2 connections schema).
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();

  const { data: conns } = await supabase
    .from("connections")
    .select("requester_id, addressee_id, status")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq("status", "accepted");

  const ids = (conns || []).map((c: { requester_id: string; addressee_id: string }) =>
    c.requester_id === user.id ? c.addressee_id : c.requester_id
  );
  if (ids.length === 0) return NextResponse.json({ connections: [] });

  let query = supabase
    .from("user_profiles")
    .select("id, display_name, headline, current_company, avatar_url")
    .in("id", ids);

  if (q) {
    const clean = q.replace(/[%,()]/g, "");
    query = query.or(`display_name.ilike.%${clean}%,headline.ilike.%${clean}%,current_company.ilike.%${clean}%`);
  }

  const { data } = await query;
  return NextResponse.json({ connections: (data || []) as PersonRow[] });
}
