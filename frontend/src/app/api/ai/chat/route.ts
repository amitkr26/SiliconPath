import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai/providers";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
import { serverError } from "@berojgardegreewala/api";
import { createClient } from "@/lib/supabase/server";
import { sanitizeAIContent } from "@/lib/ai/reasoning-sanitizer";
import { rateLimit } from "@/lib/rate-limiter";
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

// BDW Career Intelligence Engine
import { buildRAGContext, buildBDWSystemPrompt, buildSourceCitations, sanitizeUserMessage, type RAGContext } from "@/lib/ai/bdw-rag";
import { formatToolsForPrompt, type BDWToolName } from "@/lib/ai/bdw-tools";
// FIX #5: Direct import — no HTTP self-fetch
import { executeBDWTool, VALID_BDW_TOOLS } from "@/lib/ai/bdw-tools-exec";

// Rate limiting for guest visitors (15 queries per hour per IP)
// Uses Upstash Redis when configured, falls back to per-instance Map for local dev.
const GUEST_LIMIT = 15;
const WINDOW_SECONDS = 3600;

// FIX #12: Maximum user message length
const MAX_USER_MESSAGE_LENGTH = 4000;

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
  let userId = "anonymous";
  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    isAuthenticated = !!user;
    if (user) userId = user.id;
  } catch {
    isAuthenticated = false;
  }

  // If unauthenticated guest, enforce IP rate limit
  if (!isAuthenticated) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous-client";

    const { success } = await rateLimit(`ai-chat:guest:${ip}`, GUEST_LIMIT, WINDOW_SECONDS);
    if (!success) {
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

    const rawMessage = messages[messages.length - 1].content || "";

    // FIX #12: Validate and sanitize user input length
    const userMessage = sanitizeUserMessage(rawMessage);
    if (!userMessage) {
      return NextResponse.json(
        { error: "Empty message." },
        { status: 400 }
      );
    }

    const ragDb = isAdminConfigured ? supabaseAdmin : null;
    const bdwEnabled = process.env.BDW_AI_ENABLED === "true";

    // ─── BDW Tool Loop Path ─────────────────────────────────────────────
    // When BDW is enabled, use the full RAG + tool system.
    // FIX #2: Pass actual isAuthenticated value.
    // FIX #5: Tool execution is direct function call — no HTTP self-fetch.
    if (bdwEnabled && ragDb) {
      return handleBDWChat(userMessage, messages, ragDb, isAuthenticated, userId);
    }

    // ─── Legacy Grounded Path (fallback) ────────────────────────────────
    // Original flow: retrieve → grounded prompt → single AI call → sanitize.
    const { opportunities, news } = await retrieveGrounding(ragDb, userMessage);

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

    let text = sanitizeAIContent(response.text);

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

// ─── BDW Tool Loop Handler ────────────────────────────────────────────────

interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

// FIX #10: Balanced-brace JSON extraction — replaces fragile \{[^}]*\} regex.
function extractBalancedJSON(text: string, startIdx: number): string | null {
  if (text[startIdx] !== "{") return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(startIdx, i + 1);
    }
  }
  return null;
}

/**
 * Parse <tool_call> tags from AI output using balanced-brace JSON extraction.
 * Handles nested objects, arrays, strings with braces, and escaped quotes.
 */
function parseToolCalls(text: string): ToolCall[] {
  const calls: ToolCall[] = [];
  // Match <tool_call> or <tool_call with name="..." arguments=...
  const tagPattern = /<tool_call[\s>]+name="([^"]+)"[\s]+arguments=/gi;
  let tagMatch;
  while ((tagMatch = tagPattern.exec(text)) !== null) {
    const name = tagMatch[1];
    const jsonStart = tagPattern.lastIndex; // position right after "arguments="
    if (jsonStart < text.length && text[jsonStart] === "{") {
      const jsonStr = extractBalancedJSON(text, jsonStart);
      if (jsonStr) {
        try {
          const args = JSON.parse(jsonStr);
          calls.push({ name, arguments: args });
          // Advance past the extracted JSON for the next iteration
          tagPattern.lastIndex = jsonStart + jsonStr.length;
        } catch { /* skip malformed JSON */ }
      }
    }
  }
  // Cap at 3 tool calls per response
  return calls.slice(0, 3);
}

// FIX #9: Maximum total tool result context (chars) to prevent model overflow.
const MAX_TOTAL_TOOL_CHARS = 4000;

/**
 * BDW-aware chat handler with tool loop.
 * FIX #2: accepts isAuthenticated and userId from caller.
 * FIX #5: tool execution via direct import — no HTTP round-trip.
 * FIX #9: caps total tool result context.
 */
async function handleBDWChat(
  userMessage: string,
  messages: Array<{ role: string; content: string }>,
  ragDb: any,
  isAuthenticated: boolean,
  userId: string
): Promise<NextResponse> {
  const MAX_TOOL_ROUNDS = 2;

  // 1. Build RAG context from the user query
  const ragContext = await buildRAGContext(ragDb, userMessage);

  // 2. Build the BDW system prompt with RAG data + tool definitions
  const basePrompt = buildBDWSystemPrompt(userMessage, ragContext);
  const toolsPrompt = formatToolsForPrompt();
  const systemPrompt = `${basePrompt}\n${toolsPrompt}`;

  // 3. Call the AI model
  const response = await callAI(userMessage, systemPrompt, {
    preferredProvider: "bdw",
    feature: "bdw-chat",
  });

  let text = sanitizeAIContent(response.text);

  // 4. Tool loop: detect and execute tool calls
  const toolResults: Array<{ tool: string; result: unknown }> = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const toolCalls = parseToolCalls(text);
    if (toolCalls.length === 0) break;

    // Validate tool names before execution
    const validCalls = toolCalls.filter((tc) => VALID_BDW_TOOLS.includes(tc.name));

    // FIX #5: Direct function call — no HTTP fetch.
    // FIX #6: userId derived from authenticated session, not request body.
    const results = await Promise.all(
      validCalls.map(async (tc) => ({
        tool: tc.name,
        result: await executeBDWTool(tc.name as BDWToolName, tc.arguments, userId),
      }))
    );

    toolResults.push(...results);

    // FIX #9: Cap TOTAL tool result context to prevent model overflow.
    let totalChars = 0;
    const toolResultsText = results
      .map((r) => {
        const resultData = r.result as any;
        const raw = resultData.success
          ? JSON.stringify(resultData.data, null, 2)
          : `Error: ${resultData.error}`;
        // Reserve space: each result gets proportional share of budget
        const remaining = MAX_TOTAL_TOOL_CHARS - totalChars;
        if (remaining <= 0) return `[Tool: ${r.tool}] (truncated — budget exhausted)`;
        const truncated = raw.length > remaining ? raw.slice(0, remaining) : raw;
        totalChars += truncated.length;
        return `[Tool: ${r.tool}] ${truncated}`;
      })
      .join("\n\n");

    // Re-prompt with tool results
    const followUpPrompt = `Here are the results from your tool calls:\n\n${toolResultsText}\n\nNow provide your final answer to the user based on this data. Do NOT call any more tools.`;
    const followUpResponse = await callAI(followUpPrompt, systemPrompt, {
      preferredProvider: "bdw",
      feature: "bdw-chat-tools",
    });

    text = sanitizeAIContent(followUpResponse.text);
    break; // One round of tools is sufficient for most queries
  }

  // 5. Fallback: if empty after stripping, provide a structured answer from RAG data
  if (!text) {
    if (ragContext.opportunities.length > 0) {
      text = buildRecordListing(ragContext.opportunities as any);
    } else {
      text = "I apologize — I wasn't able to generate a clear response. Please try rephrasing your question.";
    }
  }

  // 6. Build source citations from RAG context
  const citations = buildSourceCitations(ragContext);
  const sourceList = citations.map((c) => ({
    name: c.title,
    url: c.url || "",
    type: c.type,
    tier: "Tier 1 — BDW Verified",
  })).filter((s) => s.url);

  // FIX #2: Pass actual isAuthenticated — never hardcode true
  return NextResponse.json({
    message: text,
    answer: text,
    opportunities: ragContext.opportunities,
    sources: sourceList,
    citations,
    domain: ragContext.domain,
    toolResults: toolResults.length > 0 ? toolResults : undefined,
    freshness: {
      generatedAt: new Date().toISOString(),
      dataLastUpdated: new Date().toISOString(),
      activeCount: ragContext.opportunities.length,
    },
    provider: response.provider,
    model: response.model,
    grounded: ragContext.opportunities.length > 0 || ragContext.news.length > 0,
    isAuthenticated,
  });
}
