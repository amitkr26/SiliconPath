import { Router } from "express";
import { AppError } from "@berojgardegreewala/api";
import { gateway } from "@berojgardegreewala/ai-gateway";
import type { Deps } from "../types.js";
import { requireAuth } from "../middleware/auth.js";

const DEFAULT_PROMPT =
  "Generate 3 actionable career tips for a recent Indian graduate searching for their first job or internship. Format as a numbered list, keep each tip under 2 lines.";

// POST /api/v1/ai/insights — minimal wrapped AI capability over the shared
// ai-gateway (provider fallback chain). Optional { prompt, context } body,
// defaults to a curated prompt when omitted.
export function aiRouter(deps: Deps): Router {
  const r = Router();
  r.use(requireAuth(deps.supabase));

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

  return r;
}