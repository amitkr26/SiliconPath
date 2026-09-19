import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@berojgardegreewala/api";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { apiError } from "@/lib/api-utils";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
});

export async function GET(request: NextRequest) {
  try { await requireAdmin(request); } catch (e) { return e instanceof Response ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { data, error } = await supabaseAdmin!
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    if (error.code === "PGRST205" || String(error.message).includes("schema cache")) {
      return NextResponse.json({ announcements: [] });
    }
    return apiError(error, "admin-announcements-list");
  }
  return NextResponse.json({ announcements: data || [] });
}

export async function POST(request: NextRequest) {
  let admin;
  try { admin = await requireAdmin(request); } catch (e) { return e instanceof Response ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });

  // announcements.created_by references user_profiles(id). requireAdmin()
  // returns the AuthUser id, which is a real Supabase user id for JWT admins
  // but the literal "admin" string for password/token auth paths — only pass
  // it when it is a valid UUID, otherwise leave the nullable column NULL.
  const created_by = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(admin.id)
    ? admin.id
    : null;

  const { data, error } = await supabaseAdmin!
    .from("announcements")
    .insert({ ...parsed.data, created_by })
    .select()
    .single();
  if (error) {
    if (error.code === "PGRST205" || String(error.message).includes("schema cache")) {
      return NextResponse.json({ error: "Announcements table is not yet provisioned in the database." }, { status: 503 });
    }
    return apiError(error, "admin-announcements-create");
  }
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  try { await requireAdmin(request); } catch (e) { return e instanceof Response ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Announcement ID required" }, { status: 400 });

  const { error } = await supabaseAdmin!.from("announcements").delete().eq("id", id);
  if (error) return apiError(error, "admin-announcements-delete");
  return NextResponse.json({ success: true });
}
