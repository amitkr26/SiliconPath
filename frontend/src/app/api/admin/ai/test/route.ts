import { NextRequest } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { requireAdmin, serverError } from "@berojgardegreewala/api";

export async function POST(request: NextRequest) {
  try { await requireAdmin(request); }
  catch (e) { return e instanceof Response ? e : serverError(); }

  if (!isAdminConfigured || !supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Database not configured" }), { status: 503, headers: { "Content-Type": "application/json" } });
  }

  try {
    const body = await request.json();
    const { prompt, model } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }], model }),
    });

    const data = await response.json();

    return new Response(JSON.stringify({ response: data.data || data }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Admin AI test error:", error);
    return new Response(JSON.stringify({ error: "Failed to test AI" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
