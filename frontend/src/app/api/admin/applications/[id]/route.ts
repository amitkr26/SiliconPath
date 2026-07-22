import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@berojgardegreewala/api";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["submitted", "reviewed", "shortlisted", "accepted", "rejected" ]),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(request); } catch (e) { return e instanceof Response ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { id } = await params;
  const body = await request.json();
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const { error } = await supabaseAdmin!.from("applications").update({ status: parsed.data.status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
