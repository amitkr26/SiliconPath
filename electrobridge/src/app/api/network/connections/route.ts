import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  const { data: connections } = await supabase
    .from("connections")
    .select("user_id_1, user_id_2, connected_at")
    .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

  if (!connections) return NextResponse.json({ connections: [] });

  const connectedIds = connections.map((c) =>
    c.user_id_1 === user.id ? c.user_id_2 : c.user_id_1
  );

  if (connectedIds.length === 0) return NextResponse.json({ connections: [] });

  let query = supabase
    .from("user_profiles")
    .select("*")
    .in("id", connectedIds);

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,headline.ilike.%${q}%,current_org.ilike.%${q}%`);
  }

  const { data } = await query;
  return NextResponse.json({ connections: data || [] });
}
