import { Router } from "express";
import { AppError, ForbiddenError, NotFoundError } from "@berojgardegreewala/api";
import type { Deps } from "../types.js";
import { requireAuth } from "../middleware/auth.js";

// Mirrors frontend /api/messages and /api/messages/[conversationId]:
// conversation discovery/creation + message list/send with is_read marking.
export function messagesRouter(deps: Deps): Router {
  const r = Router();
  r.use(requireAuth(deps.supabase));

  const PROFILE_COLUMNS = "id, username, display_name, avatar_url, headline, current_company";

  // GET /api/v1/messages — conversations for the user, with other participant + last message
  r.get("/", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const me = req.authUser!.id;
      const { data, error } = await deps.supabaseAdmin
        .from("conversations")
        .select(`id, participant_a, participant_b, last_message_at, participantA:user_profiles!conversations_participant_a_fkey(${PROFILE_COLUMNS}), participantB:user_profiles!conversations_participant_b_fkey(${PROFILE_COLUMNS})`)
        .or(`participant_a.eq.${me},participant_b.eq.${me}`)
        .order("last_message_at", { ascending: false });
      if (error) throw error;

      const list = [];
      for (const row of data || []) {
        const otherId = row.participant_a === me ? row.participant_b : row.participant_a;
        const other = row.participant_a === me ? row.participantB : row.participantA;
        const { data: last } = await deps.supabaseAdmin
          .from("messages")
          .select("id, body, sender_id, created_at, is_read")
          .eq("conversation_id", row.id)
          .order("created_at", { ascending: false })
          .limit(1);
        const { count: unreadCount } = await deps.supabaseAdmin
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", row.id)
          .eq("sender_id", otherId)
          .eq("is_read", false);
        list.push({
          id: row.id,
          last_message_at: row.last_message_at,
          other_user: { id: otherId, ...(other || {}) },
          last_message: last?.[0] ?? null,
          unread_count: unreadCount ?? 0,
        });
      }
      res.json({ success: true, data: list });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/messages/with/:userId — find or create the conversation with a user
  r.get("/with/:userId", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const me = req.authUser!.id;
      const them = req.params.userId;
      if (them === me) throw new AppError("Cannot message yourself", 400, "VALIDATION_ERROR");
      const { data: existing } = await deps.supabaseAdmin
        .from("conversations")
        .select("id")
        .or(`and(participant_a.eq.${me},participant_b.eq.${them}),and(participant_a.eq.${them},participant_b.eq.${me})`)
        .maybeSingle();
      if (existing) {
        res.json({ success: true, data: existing });
        return;
      }
      const { data, error } = await deps.supabaseAdmin
        .from("conversations")
        .insert({ participant_a: me, participant_b: them })
        .select("id")
        .single();
      if (error) throw error;
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/messages/:conversationId — messages + mark incoming read
  r.get("/:conversationId", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const me = req.authUser!.id;
      const { data: conv } = await deps.supabaseAdmin
        .from("conversations")
        .select("participant_a, participant_b")
        .eq("id", req.params.conversationId)
        .maybeSingle();
      if (!conv) throw new NotFoundError("Conversation not found");
      if (conv.participant_a !== me && conv.participant_b !== me) throw new ForbiddenError("Not a participant");

      const { data: messages, error } = await deps.supabaseAdmin
        .from("messages")
        .select("*")
        .eq("conversation_id", req.params.conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;

      await deps.supabaseAdmin
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", req.params.conversationId)
        .neq("sender_id", me)
        .eq("is_read", false);

      res.json({ success: true, data: messages || [] });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/messages/:conversationId — send message (content|body|message)
  r.post("/:conversationId", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const me = req.authUser!.id;
      const { data: conv } = await deps.supabaseAdmin
        .from("conversations")
        .select("participant_a, participant_b")
        .eq("id", req.params.conversationId)
        .maybeSingle();
      if (!conv) throw new NotFoundError("Conversation not found");
      if (conv.participant_a !== me && conv.participant_b !== me) throw new ForbiddenError("Not a participant");

      const raw = req.body || {};
      const content = String(raw.content || raw.body || raw.message || "").trim();
      if (!content) throw new AppError("content is required", 400, "VALIDATION_ERROR");

      const { data: message, error } = await deps.supabaseAdmin
        .from("messages")
        .insert({ conversation_id: req.params.conversationId, sender_id: me, body: content })
        .select()
        .single();
      if (error) throw error;

      const { data: other, error: otherErr } = await deps.supabaseAdmin
        .from("conversations")
        .select(conv.participant_a === me ? "participant_b" : "participant_a")
        .eq("id", req.params.conversationId)
        .single();
      if (!otherErr && other) {
        const otherId = Object.values(other)[0] as string;
        try {
          await deps.supabaseAdmin.from("notifications").insert({
            user_id: otherId,
            type: "message",
            actor_id: me,
            entity_type: "conversation",
            entity_id: req.params.conversationId,
          });
        } catch {
          // best-effort
        }
      }

      await deps.supabaseAdmin
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", req.params.conversationId);

      res.status(201).json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  });

  return r;
}