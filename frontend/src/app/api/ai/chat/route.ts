import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai/providers";
import { serverError } from "@berojgardegreewala/api";

const SYSTEM_PROMPT = `You are SiliconPath Assistant, a expert AI for VLSI design, semiconductor engineering, and hardware career advancement.
You help users:
- Master Verilog, SystemVerilog, UVM, Physical Design, STA, and Analog Design
- Understand ASIC/FPGA design flows and RTL verification methodologies
- Connect with hardware engineers and explore VLSI career roadmaps
- Prepare for semiconductor technical interviews and tapeout challenges

Be concise, technical, accurate, and encouraging. If you don't know something specific, say so.`;

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
