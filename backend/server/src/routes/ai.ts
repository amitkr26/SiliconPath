import { Router } from "express";
import { AppError } from "@berojgardegreewala/api";
import { gateway } from "@berojgardegreewala/ai-gateway";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Deps } from "../types.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";

const DEFAULT_PROMPT =
  "Generate 3 actionable career tips for a recent Indian graduate searching for their first job or internship. Format as a numbered list, keep each tip under 2 lines.";

const NO_MATCH_FALLBACK =
  "I could not find any current opportunities matching your query in our database. " +
  "Try different keywords (e.g. \"JRF\", \"DRDO\", \"fellowship\") or check the opportunities page directly.";

// Minimal grounding: keyword-extract from the user's latest message, pull up
// to 8 matching live opportunities, and constrain the assistant to them
// (same spirit as frontend/src/lib/ai/grounding.ts — record-listing guard,
// no invented deadlines, no URLs outside the retrieved rows).
async function groundOpportunities(client: SupabaseClient, message: string) {
  const words = message
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !["what", "which", "where", "there", "about", "would", "could", "find", "show", "tell", "with", "from", "that", "this", "have", "your", "jobs", "job", "work", "apply"].includes(w))
    .slice(0, 4);

  if (words.length === 0) return [];

  const clauses = words.map((w) => `title.ilike.%${w}%,description.ilike.%${w}%,eligibility.ilike.%${w}%`);
  const { data, error } = await client
    .from("opportunities")
    .select("id, slug, title, organization_id, deadline, apply_url, category, location, organizations(name)")
    .eq("is_active", true)
    .or(clauses.join(","))
    .limit(8);
  if (error) throw error;
  return data || [];
}

function buildGroundedSystemPrompt(rows: any[]): string {
  if (rows.length === 0) {
    return "You are BerojgarDegreeWala's career assistant. Answer briefly from general knowledge, but do NOT invent specific opportunities, deadlines, or URLs.";
  }
  const listing = rows
    .map((o, i) => `${i + 1}. ${o.title} — ${o.category ?? "n/a"} — ${o.location ?? "n/a"} — deadline: ${o.deadline ?? "not stated"} — apply: ${o.apply_url ?? "n/a"}`)
    .join("\n");
  return (
    "You are BerojgarDegreeWala's career assistant. Use ONLY the following opportunities from our database to answer. " +
    "Never mention deadlines or URLs that are not in this list. If the question is not about these, say so briefly.\n\n" +
    `AVAILABLE OPPORTUNITIES:\n${listing}`
  );
}

// Extracts a JSON array from LLM output (strip fences, first [...] block).
function extractJsonArray(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end <= start) throw new Error("no JSON array");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export function aiRouter(deps: Deps): Router {
  const r = Router();
  r.use(requireAuth(deps.supabase));
  r.use(rateLimit("ai"));

  r.post("/insights", async (req, res, next) => {
    try {
      const { prompt, context } = req.body || {};
      const text = typeof prompt === "string" && prompt.trim() ? prompt.trim() : DEFAULT_PROMPT;
      const content = typeof context === "string" && context.trim() ? `${context.trim()}\n\n${text}` : text;

      try {
        const result = await gateway.generate(
          { messages: [{ role: "user", content }], model: undefined },
          "api-insights"
        );
        res.json({
          success: true,
          data: { text: result.text, provider: result.provider, model: result.model },
        });
      } catch {
        throw new AppError("AI providers unavailable", 502, "AI_UNAVAILABLE");
      }
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/ai/chat — grounded career chat (mirrors /api/ai/chat)
  r.post("/chat", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const { messages } = req.body || {};
      if (!Array.isArray(messages) || messages.length === 0) {
        throw new AppError("messages[] is required", 400, "VALIDATION_ERROR");
      }
      const last = messages[messages.length - 1];
      const query = typeof last?.content === "string" ? last.content : "";
      const rows = await groundOpportunities(deps.supabaseAdmin, query);

      if (rows.length === 0) {
        res.json({ success: true, data: { text: NO_MATCH_FALLBACK, grounded: false, matches: 0 } });
        return;
      }

      const allowed = new Set((rows.map((o: any) => o.apply_url).filter(Boolean) as string[]).map((u: string) => new URL(u).hostname));
      const systemPrompt = buildGroundedSystemPrompt(rows) +
        "\n\nYou may only reference apply URLs whose hostname is one of: " + [...allowed].join(", ");

      const result = await gateway.generate(
        { messages, model: undefined, systemPrompt },
        "api-ai-chat"
      );
      res.json({
        success: true,
        data: { text: result.text, provider: result.provider, model: result.model, grounded: true, matches: rows.length },
      });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/ai/match — top-10 opportunity matches for a profile (mirrors /api/ai/match)
  r.post("/match", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const { profile } = req.body || {};
      if (!profile || typeof profile !== "object") {
        throw new AppError("profile object is required", 400, "VALIDATION_ERROR");
      }
      const { data } = await deps.supabaseAdmin
        .from("opportunities")
        .select("id, title, category, location, deadline, eligibility, description")
        .eq("is_active", true)
        .limit(50);
      if (!data || data.length === 0) {
        res.json({ success: true, data: { matches: [], candidates: 0 } });
        return;
      }
      const pool = JSON.stringify(data.map((o) => ({ id: o.id, title: o.title, category: o.category, location: o.location, deadline: o.deadline, eligibility: o.eligibility })));
      const prompt = `Given this candidate profile: ${JSON.stringify(profile)}\n\nPick the 10 best-matching opportunities from this pool (respond with ONLY a JSON array of {id, reason}):\n${pool}`;
      const result = await gateway.generate({ messages: [{ role: "user", content: prompt }] }, "api-ai-match");
      const parsed = extractJsonArray(result.text) as { id?: string; reason?: string }[];
      const ids = new Set(data.map((o) => o.id));
      const matches = (Array.isArray(parsed) ? parsed : [])
        .filter((m) => m && typeof m.id === "string" && ids.has(m.id))
        .slice(0, 10)
        .map((m) => {
          const opp = data.find((o) => o.id === m.id)!;
          return { id: m.id, title: opp.title, category: opp.category, location: opp.location, reason: String(m.reason ?? "") };
        });
      res.json({ success: true, data: { matches, candidates: data.length } });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/ai/search — parse a natural-language query into opportunity
  // filters, then run the filter (mirrors /api/ai/search)
  r.post("/search", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const { query } = req.body || {};
      if (typeof query !== "string" || !query.trim()) {
        throw new AppError("query string is required", 400, "VALIDATION_ERROR");
      }
      const prompt =
        `Parse this search query into opportunity filters: "${query}". ` +
        `Respond with ONLY a JSON object using keys from: category (one of jrf|srf|phd|government|fellowship|internship|industry), eligibility, location, search. ` +
        `Use the free-text search key for anything unmatched. Empty values: omit the key.`;
      const result = await gateway.generate({ messages: [{ role: "user", content: prompt }] }, "api-ai-search");
      const cleaned = result.text.replace(/```(?:json)?/gi, "").trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      let filters: Record<string, string> = {};
      if (start !== -1 && end > start) {
        try {
          filters = JSON.parse(cleaned.slice(start, end + 1));
        } catch {
          filters = { search: query };
        }
      } else {
        filters = { search: query };
      }
      const safe = ["category", "eligibility", "location", "search"].filter((k) => typeof filters[k] === "string" && filters[k].trim());
      const parsed: any = {};
      for (const k of safe) parsed[k] = String(filters[k]).trim();

      const { data, error } = await deps.supabaseAdmin
        .from("opportunities")
        .select("id, slug, title, category, location, deadline, eligibility, description, apply_url, organizations(name)")
        .eq("is_active", true)
        .limit(20);
      if (error) throw error;
      const results = (data || []).filter((o) => {
        if (parsed.category && o.category !== parsed.category) return false;
        if (parsed.location && !String(o.location ?? "").toLowerCase().includes(parsed.location.toLowerCase())) return false;
        if (parsed.eligibility && !String(o.eligibility ?? "").toLowerCase().includes(parsed.eligibility.toLowerCase())) return false;
        if (parsed.search) {
          const hay = `${o.title} ${o.description ?? ""}`.toLowerCase();
          if (!hay.includes(parsed.search.toLowerCase())) return false;
        }
        return true;
      });
      res.json({ success: true, data: { filters: parsed, results } });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/ai/summarize — short text summary (mirrors /api/ai/summarize)
  r.post("/summarize", async (req, res, next) => {
    const { text } = req.body || {};
    if (typeof text !== "string" || !text.trim()) {
      next(new AppError("text is required", 400, "VALIDATION_ERROR"));
      return;
    }
    try {
      const result = await gateway.generate(
        { messages: [{ role: "user", content: `Summarize the following in 3-4 crisp bullet points:\n\n${text.slice(0, 4000)}` }] },
        "api-ai-summarize"
      );
      res.json({ success: true, data: { text: result.text, provider: result.provider, model: result.model } });
    } catch {
      next(new AppError("AI providers unavailable", 502, "AI_UNAVAILABLE"));
    }
  });

  return r;
}