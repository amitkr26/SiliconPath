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
import { buildRAGContext, buildBDWSystemPrompt, buildSourceCitations, type RAGContext } from "@/lib/ai/bdw-rag";
import { formatToolsForPrompt, type BDWToolName } from "@/lib/ai/bdw-tools";

// Rate limiting for guest visitors (15 queries per hour per IP)
// Uses Upstash Redis when configured, falls back to per-instance Map for local dev.
const GUEST_LIMIT = 15;
const WINDOW_SECONDS = 3600;

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

    const userMessage = messages[messages.length - 1].content || "";
    const supabase = isAdminConfigured ? supabaseAdmin : null;
    const bdwEnabled = process.env.BDW_AI_ENABLED === "true";

    // ─── BDW Tool Loop Path ─────────────────────────────────────────────
    // When BDW is enabled, use the full RAG + tool system.
    // The AI can emit <tool_call> tags which are executed server-side,
    // and the results are fed back for a grounded final answer.
    if (bdwEnabled && supabase) {
      return handleBDWChat(userMessage, messages, supabase);
    }

    // ─── Legacy Grounded Path (fallback) ────────────────────────────────
    // Original flow: retrieve → grounded prompt → single AI call → sanitize.
    const { opportunities, news } = await retrieveGrounding(supabase, userMessage);

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

/**
 * Parse <tool_call> tags from AI output.
 * Supports: <tool_call>name="tool_name"arguments={...} /> and
 * <tool_call name="tool_name" arguments={...} />.
 */
function parseToolCalls(text: string): ToolCall[] {
  const calls: ToolCall[] = [];

  // Pattern 1: <tool_call>name="x"arguments={...} />  (no space)
  const pattern1 = /<tool_call>\s*name="([^"]+)"\s*arguments=(\{[^}]*\})\s*\/?>/g;
  let match1;
  while ((match1 = pattern1.exec(text)) !== null) {
    try {
      calls.push({
        name: match1[1],
        arguments: JSON.parse(match1[2]),
      });
    } catch { /* skip malformed */ }
  }

  // Pattern 2: <tool_call> name="x" arguments={...} /> (with spaces)
  const pattern2 = /<tool_call\s+name="([^"]+)"\s+arguments=(\{[^}]*\})\s*\/?>/g;
  let match2;
  while ((match2 = pattern2.exec(text)) !== null) {
    try {
      calls.push({
        name: match2[1],
        arguments: JSON.parse(match2[2]),
      });
    } catch { /* skip malformed */ }
  }

  // Cap at 3 tool calls per response
  return calls.slice(0, 3);
}

/**
 * Execute a single tool call via the server-side tool endpoint.
 */
async function executeToolCall(
  toolName: string,
  toolArgs: Record<string, unknown>
): Promise<{ tool: string; success: boolean; data: unknown; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/ai/bdw-tools`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: toolName, arguments: toolArgs }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return { tool: toolName, success: false, data: null, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    return data.result || { tool: toolName, success: false, data: null, error: "No result" };
  } catch (error) {
    return {
      tool: toolName,
      success: false,
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * BDW-aware chat handler with tool loop.
 * Up to 2 rounds of tool calls → re-prompt for grounded answer.
 */
async function handleBDWChat(
  userMessage: string,
  messages: Array<{ role: string; content: string }>,
  supabase: any
): Promise<NextResponse> {
  const MAX_TOOL_ROUNDS = 2;

  // 1. Build RAG context from the user query
  const ragContext = await buildRAGContext(supabase, userMessage);

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
  let toolResults: Array<{ tool: string; result: unknown }> = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const toolCalls = parseToolCalls(text);
    if (toolCalls.length === 0) break;

    // Execute tool calls in parallel
    const results = await Promise.all(
      toolCalls.map(async (tc) => ({
        tool: tc.name,
        result: await executeToolCall(tc.name, tc.arguments),
      }))
    );

    toolResults.push(...results);

    // Build a follow-up prompt with tool results
    const toolResultsText = results
      .map((r) => {
        const resultData = r.result as any;
        return `[Tool: ${r.tool}] ${resultData.success ? JSON.stringify(resultData.data, null, 2).slice(0, 3000) : `Error: ${resultData.error}`}`;
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
    isAuthenticated: true,
  });
}
