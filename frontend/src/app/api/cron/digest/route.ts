import { NextRequest } from "next/server";
import { sendDigest } from "@/lib/email-digest";
import { requireCron, serverError } from "@berojgardegreewala/api";

export async function GET(request: NextRequest) {
  try { await requireCron(request); }
  catch (e) { return e instanceof Response ? e : serverError(); }

  try {
    const result = await sendDigest();
    return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error sending digest:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send digest" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
