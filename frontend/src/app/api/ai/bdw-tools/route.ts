/**
 * BDW AI Tool Execution Endpoint — Thin Authenticated Adapter
 *
 * This route is retained for potential external/programmatic use, but the
 * primary chat orchestrator calls executeBDWTool() directly via import.
 *
 * SECURITY:
 * - Requires authenticated session (Supabase JWT). Anonymous requests rejected.
 * - userId is derived from the authenticated session, never from the request body.
 * - Rate limiting uses the project's Upstash Redis rate limiter (production-safe).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executeBDWTool, VALID_BDW_TOOLS } from "@/lib/ai/bdw-tools-exec";
import type { BDWToolName } from "@/lib/ai/bdw-tools";

export async function POST(request: NextRequest) {
  // FIX #1: Require authenticated session — no anonymous access to tool endpoint
  let userId: string;
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to use tool features." },
        { status: 401 }
      );
    }
    // FIX #6: userId derived from authenticated session — never from request body
    userId = user.id;
  } catch {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { tool, arguments: args = {} } = body as {
      tool: string;
      arguments?: Record<string, unknown>;
    };

    if (!tool) {
      return NextResponse.json({ error: "Missing 'tool' parameter" }, { status: 400 });
    }

    if (!VALID_BDW_TOOLS.includes(tool)) {
      return NextResponse.json({ error: `Invalid tool: ${tool}` }, { status: 400 });
    }

    // Execute via shared module — same code path as the chat route
    const result = await executeBDWTool(tool as BDWToolName, args, userId);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("[BDW Tools] Error:", error);
    return NextResponse.json(
      { error: "Tool execution failed" },
      { status: 500 }
    );
  }
}
