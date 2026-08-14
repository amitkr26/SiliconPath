import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai/providers";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { serverError } from "@berojgardegreewala/api";
import {
  buildGroundedSystemPrompt,
  buildRecordListing,
  extractSearchTerms,
  isOpportunityIntent,
  NO_MATCH_FALLBACK,
  retrieveGrounding,
  allowedUrls,
  sanitizeAnswerUrls,
} from "@/lib/ai/grounding";

const BASE_SYSTEM_PROMPT = `You are BerojgarDegreeWala Assistant, a helpful AI for electronics and semiconductor researchers in India.
You help users:
- Find relevant JRF, PhD, and job opportunities
- Understand eligibility criteria (NET, GATE, age limits)
- Know about DRDO, ISRO, CSIR, IIT opportunities
- Learn about international fellowships (DAAD, SINGA, MEXT)
- Understand the difference between JRF, SRF, RA, Project Associate
- Prepare for interviews and applications

Be concise, accurate, and helpful. If you don't know something specific, say so.
Do not make up deadlines or stipends — say "check the official website" only when no deadline/stipend is listed in the retrieved records.`;

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

    // 1. Retrieve matching records from the ACTUAL database (opportunities +
    //    news) so the model never answers from memory alone.
    const { opportunities, news } = await retrieveGrounding(
      isAdminConfigured ? supabaseAdmin : null,
      userMessage
    );

    // 2. Zero relevant records + opportunity intent → deterministic fallback,
    //    no LLM call, nothing invented.
    if (
      opportunities.length === 0 &&
      news.length === 0 &&
      isOpportunityIntent(userMessage)
    ) {
      return NextResponse.json({
        message: NO_MATCH_FALLBACK,
        provider: null,
        model: null,
        grounded: false,
      });
    }

    // 3. Grounded prompt with hard rules; keep the existing provider fallback
    //    architecture (gateway in @/lib/ai/providers).
    const systemPrompt = buildGroundedSystemPrompt(
      userMessage,
      opportunities,
      news,
      BASE_SYSTEM_PROMPT
    );

    const response = await callAI(userMessage, systemPrompt, {
      preferredProvider: "groq",
      feature: "chat",
    });

    // 4. Deterministic guard: the model parroting the no-match fallback
    //    sentence while records ARE in its context contradicts rule 2
    //    (observed on llama-3.1-8b-class models). Surface the retrieved
    //    records instead of a false "couldn't find".
    let text = response.text;
    if (
      opportunities.length > 0 &&
      text.includes("I couldn't find a matching opportunity in BerojgarDegreeWala's current database")
    ) {
      text = buildRecordListing(opportunities);
    }
    // 5. Final deterministic guard: no URL outside the retrieved records.
    text = sanitizeAnswerUrls(text, allowedUrls(opportunities, news));

    return NextResponse.json({
      message: text,
      provider: response.provider,
      model: response.model,
      grounded: opportunities.length > 0 || news.length > 0,
    });
  } catch (error) {
    console.error("Error in AI chat:", error);
    return serverError("Chat failed");
  }
}
