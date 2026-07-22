import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai/providers";
import { serverError } from "@berojgardegreewala/api";

const SYSTEM_PROMPT = `You are BerojgarDegreeWala Assistant, a helpful AI for electronics and semiconductor researchers in India.
You help users:
- Find relevant JRF, PhD, and job opportunities
- Understand eligibility criteria (NET, GATE, age limits)
- Know about DRDO, ISRO, CSIR, IIT opportunities
- Learn about international fellowships (DAAD, SINGA, MEXT)
- Understand the difference between JRF, SRF, RA, Project Associate
- Prepare for interviews and applications

Be concise, accurate, and helpful. If you don't know something specific, say so.
Do not make up deadlines or stipends — say "check the official website".`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required." },
        { status: 400 }
      );
    }

    const userMessage = messages[messages.length - 1].content || "";

    const response = await callAI(userMessage, SYSTEM_PROMPT, {
      preferredProvider: "groq",
      feature: "chat",
    });

    return NextResponse.json({
      message: response.text,
      provider: response.provider,
      model: response.model,
    });
  } catch (error) {
    console.error("Error in AI chat:", error);
    return serverError("Chat failed");
  }
}
