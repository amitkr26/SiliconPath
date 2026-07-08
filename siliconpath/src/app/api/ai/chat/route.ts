import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai/providers";

export const dynamic = "force-dynamic";

const SYSTEM = `You are SiliconPath's career assistant for semiconductor, VLSI, and electronics careers in India and globally.
Answer concisely and practically. If you are unsure or lack verified information, say so rather than inventing specifics (no fabricated deadlines, stipends, or eligibility).`;

export async function POST(request: Request) {
  let message = "";
  try {
    message = String((await request.json())?.message ?? "").slice(0, 2000);
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (!message.trim()) return NextResponse.json({ error: "empty message" }, { status: 400 });

  try {
    const { text, provider } = await callAI(message, { systemPrompt: SYSTEM });
    return NextResponse.json({ reply: text, provider });
  } catch (e) {
    // Never surface a raw provider error; give an honest degraded message.
    return NextResponse.json(
      { reply: "The assistant is temporarily unavailable. Please try again shortly.", error: e instanceof Error ? e.message : "chat failed" },
      { status: 503 }
    );
  }
}
