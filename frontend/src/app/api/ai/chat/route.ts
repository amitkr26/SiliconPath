import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai/providers";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
import { serverError } from "@berojgardegreewala/api";
import { createClient } from "@/lib/supabase/server";
import { sanitizeAIContent } from "@/lib/ai/reasoning-sanitizer";
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

// In-memory rate limiting for guest visitors (15 queries per hour per IP)
const guestRateLimits = new Map<string, { count: number; resetTime: number }>();
const GUEST_LIMIT = 15;
const WINDOW_MS = 60 * 60 * 1000;

function checkGuestRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = guestRateLimits.get(ip);

  if (!record || now > record.resetTime) {
    guestRateLimits.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }

  if (record.count >= GUEST_LIMIT) {
    return false;
  }

  record.count += 1;
  return true;
}

const BASE_SYSTEM_PROMPT = `You are BerojgarDegreeWala Assistant, a helpful AI for electronics, VLSI, and semiconductor researchers and engineers in India.
You help users:
- Find relevant JRF, PhD, and semiconductor job opportunities
- Understand eligibility criteria (NET, GATE, age limits)
- Know about DRDO, ISRO, CSIR, IIT, and industry opportunities
- Learn about international fellowships (DAAD, SINGA, MEXT)
- Understand the difference between JRF, SRF, RA, Project Associate, RTL Design, and Verification roles
- Prepare for technical interviews and applications

Be concise, accurate, and helpful. If you don't know something specific, say so.
Do not make up deadlines or stipends — say "check the official website" only when no deadline/stipend is listed in the retrieved records.
IMPORTANT: Output ONLY your final answer. Do NOT include <think>, <analysis>, <reasoning>, or any internal chain-of-thought tags. The user must never see your reasoning process.`;

export async function POST(request: NextRequest) {
  // Check authenticated user
  let isAuthenticated = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isAuthenticated = !!user;
  } catch {
    isAuthenticated = false;
  }

  // If unauthenticated guest, enforce IP rate limit
  if (!isAuthenticated) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous-client";

    const allowed = checkGuestRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        {
          error: "Guest rate limit reached (15 queries/hour). Please sign in to enjoy unrestricted career intelligence and cloud conversation sync.",
          isRateLimited: true,
        },
        { status: 429 }
      );
    }
  }

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

    // 2. Zero relevant records + opportunity intent -> deterministic fallback
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
        isAuthenticated,
      });
    }

    // 3. Grounded prompt with hard rules
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

    // 4. Layer 2 Defense: Strip any reasoning content that slipped past the gateway
    let text = sanitizeAIContent(response.text);

    // Empty after stripping -> model returned only reasoning or empty response
    if (!text) {
      if (opportunities.length > 0) {
        text = buildRecordListing(opportunities);
      } else {
        text = "I apologize — I wasn't able to generate a clear response. Please try rephrasing your question.";
      }
    }

    if (
      opportunities.length > 0 &&
      text.includes("I couldn't find a matching opportunity in BerojgarDegreeWala's current database")
    ) {
      text = buildRecordListing(opportunities);
    }

    // 5. Final deterministic guard: no URL outside the retrieved records.
    text = sanitizeAnswerUrls(text, allowedUrls(opportunities, news));

    const sourceList = Array.from(
      new Map(
        opportunities
          .map((o) => ({
            name: o.organization || "Official Institutional Portal",
            url: o.apply_url || o.source_url || "",
            tier: "Tier 1 — Official Source",
          }))
          .filter((s) => Boolean(s.url))
          .map((s) => [s.url, s])
      ).values()
    );

    return NextResponse.json({
      message: text,
      answer: text,
      opportunities,
      sources: sourceList,
      freshness: {
        generatedAt: new Date().toISOString(),
        dataLastUpdated: new Date().toISOString(),
        activeCount: opportunities.length,
      },
      provider: response.provider,
      model: response.model,
      grounded: opportunities.length > 0 || news.length > 0,
      isAuthenticated,
    });
  } catch (error) {
    console.error("Error in AI chat:", error);
    return serverError("Chat failed");
  }
}
