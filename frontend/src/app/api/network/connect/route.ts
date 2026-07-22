import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";
import { sendEmailNotification, connectionRequestEmail } from "@/lib/email-notifications";

interface PersonRow {
  id: string;
  display_name: string | null;
  headline: string | null;
  current_company: string | null;
  avatar_url: string | null;
}

// POST: send a connection request (v2 connections: requester_id/addressee_id/status).
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { db2 } = await import("@/lib/db");
  const db = db2 || supabase;

  const { receiverId } = await request.json();
  if (!receiverId) return NextResponse.json({ error: "Receiver ID required" }, { status: 400 });
  if (receiverId === user.id) {
    return NextResponse.json({ error: "Cannot connect with yourself" }, { status: 400 });
  }

  const { data, error } = await db
    .from("connections")
    .insert({ requester_id: user.id, addressee_id: receiverId, status: "pending" })
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Connection request already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  createNotification({ userId: receiverId, type: "connection_request", actorId: user.id, entityType: "connection", entityId: data?.id });
  const { data: profile } = await db.from("user_profiles").select("display_name, email").eq("id", user.id).single();
  if (profile?.email) {
    const { data: receiver } = await db.from("user_profiles").select("email").eq("id", receiverId).single();
    if (receiver?.email) {
      const email = connectionRequestEmail(profile.display_name || "Someone");
      sendEmailNotification({ to: receiver.email, subject: email.subject, html: email.html });
    }
  }

  return NextResponse.json(data || { success: true }, { status: 201 });
}

// GET: incoming + outgoing requests, with the requester/addressee profile joined.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { db2 } = await import("@/lib/db");
  const db = db2 || supabase;

  const { data: rows, error } = await db
    .from("connections")
    .select("id, requester_id, addressee_id, status, created_at")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const otherIds = Array.from(
    new Set(
      (rows || []).map((r: { requester_id: string; addressee_id: string }) =>
        r.requester_id === user.id ? r.addressee_id : r.requester_id
      )
    )
  );

  const byId: Record<string, PersonRow> = {};
  if (otherIds.length > 0) {
    const { data: people } = await db
      .from("user_profiles")
      .select("id, display_name, headline, current_company, avatar_url")
      .in("id", otherIds);
    (people || []).forEach((p: PersonRow) => {
      byId[p.id] = p;
    });
  }

  const requests = (rows || []).map(
    (r: { id: string; requester_id: string; addressee_id: string; status: string }) => ({
      id: r.id,
      requester_id: r.requester_id,
      addressee_id: r.addressee_id,
      status: r.status,
      // "requester" from the current user's perspective = the other person on an incoming request.
      requester: r.addressee_id === user.id ? byId[r.requester_id] : null,
      addressee: r.requester_id === user.id ? byId[r.addressee_id] : null,
    })
  );

  return NextResponse.json({ requests });
}
