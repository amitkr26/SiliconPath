import { Router } from "express";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "@berojgardegreewala/api";
import type { Deps } from "../types.js";
import { requireAuth } from "../middleware/auth.js";

// Notification helper — mirrors frontend/src/lib/notifications.ts (service-role
// insert; RLS would block cross-user notification rows).
async function createNotification(
  admin: NonNullable<Deps["supabaseAdmin"]>,
  userId: string,
  type: string,
  actorId: string,
  entityType?: string,
  entityId?: string
) {
  try {
    await admin.from("notifications").insert({
      user_id: userId,
      type,
      actor_id: actorId,
      entity_type: entityType || null,
      entity_id: entityId || null,
    });
  } catch {
    // notifications are best-effort
  }
}

// ---------- Feed (mirrors /api/feed, /api/feed/posts/[id], like, comment, repost) ----------

export function feedRouter(deps: Deps): Router {
  const r = Router();
  r.use(requireAuth(deps.supabase));

  // GET /api/v1/feed — global feed of posts + author profile
  r.get("/", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10) || 20));
      const { data, error } = await deps.supabaseAdmin
        .from("feed_posts")
        .select("*, user_profiles(username, display_name, headline, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      res.json({ success: true, data: data || [] });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/feed — create post + notify followers
  r.post("/", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const content = String(req.body?.content || "").trim();
      if (!content) throw new AppError("content is required", 400, "VALIDATION_ERROR");
      const { data, error } = await deps.supabaseAdmin
        .from("feed_posts")
        .insert({ author_id: req.authUser!.id, content })
        .select()
        .single();
      if (error) throw error;
      const { data: followers } = await deps.supabaseAdmin
        .from("user_follows")
        .select("follower_id")
        .eq("following_id", req.authUser!.id);
      for (const f of followers || []) {
        await createNotification(deps.supabaseAdmin, f.follower_id, "post", req.authUser!.id, "feed_post", data?.id);
      }
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  // PATCH /api/v1/feed/posts/:id — owner only
  r.patch("/posts/:id", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const { data: post } = await deps.supabaseAdmin
        .from("feed_posts")
        .select("author_id")
        .eq("id", req.params.id)
        .maybeSingle();
      if (!post) throw new NotFoundError("Post not found");
      if (post.author_id !== req.authUser!.id) throw new ForbiddenError("Not your post");
      const content = String(req.body?.content || "").trim();
      if (!content) throw new AppError("content is required", 400, "VALIDATION_ERROR");
      const { data, error } = await deps.supabaseAdmin
        .from("feed_posts")
        .update({ content })
        .eq("id", req.params.id)
        .select()
        .single();
      if (error) throw error;
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/v1/feed/posts/:id — owner only
  r.delete("/posts/:id", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const { data: post } = await deps.supabaseAdmin
        .from("feed_posts")
        .select("author_id")
        .eq("id", req.params.id)
        .maybeSingle();
      if (!post) throw new NotFoundError("Post not found");
      if (post.author_id !== req.authUser!.id) throw new ForbiddenError("Not your post");
      const { error } = await deps.supabaseAdmin.from("feed_posts").delete().eq("id", req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/feed/posts/:id/like — toggle like (counts are trigger-maintained)
  r.post("/posts/:id/like", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const { data: existing } = await deps.supabaseAdmin
        .from("feed_post_likes")
        .select("id")
        .eq("post_id", req.params.id)
        .eq("user_id", req.authUser!.id)
        .maybeSingle();
      if (existing) {
        await deps.supabaseAdmin.from("feed_post_likes").delete().eq("id", existing.id);
        res.json({ success: true, data: { liked: false } });
        return;
      }
      await deps.supabaseAdmin.from("feed_post_likes").insert({ post_id: req.params.id, user_id: req.authUser!.id });
      const { data: post } = await deps.supabaseAdmin
        .from("feed_posts")
        .select("author_id")
        .eq("id", req.params.id)
        .maybeSingle();
      if (post && post.author_id !== req.authUser!.id) {
        await createNotification(deps.supabaseAdmin, post.author_id, "post_like", req.authUser!.id, "feed_post", req.params.id);
      }
      res.json({ success: true, data: { liked: true } });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/feed/posts/:id/comment
  r.post("/posts/:id/comment", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const content = String(req.body?.content || "").trim();
      if (!content) throw new AppError("content is required", 400, "VALIDATION_ERROR");
      const { data, error } = await deps.supabaseAdmin
        .from("feed_post_comments")
        .insert({ post_id: req.params.id, user_id: req.authUser!.id, content })
        .select()
        .single();
      if (error) throw error;
      const { data: post } = await deps.supabaseAdmin
        .from("feed_posts")
        .select("author_id")
        .eq("id", req.params.id)
        .maybeSingle();
      if (post && post.author_id !== req.authUser!.id) {
        await createNotification(deps.supabaseAdmin, post.author_id, "post_comment", req.authUser!.id, "feed_post", req.params.id);
      }
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/feed/posts/:id/repost — toggle repost
  r.post("/posts/:id/repost", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const { data: existing } = await deps.supabaseAdmin
        .from("feed_post_reposts")
        .select("id")
        .eq("post_id", req.params.id)
        .eq("user_id", req.authUser!.id)
        .maybeSingle();
      if (existing) {
        await deps.supabaseAdmin.from("feed_post_reposts").delete().eq("id", existing.id);
        res.json({ success: true, data: { reposted: false } });
        return;
      }
      await deps.supabaseAdmin.from("feed_post_reposts").insert({ post_id: req.params.id, user_id: req.authUser!.id });
      res.json({ success: true, data: { reposted: true } });
    } catch (err) {
      next(err);
    }
  });

  return r;
}

// ---------- Network (mirrors /api/network/*) ----------

const PROFILE_COLUMNS = "id, username, display_name, headline, current_company, avatar_url";

export function networkRouter(deps: Deps): Router {
  const r = Router();
  r.use(requireAuth(deps.supabase));

  // POST /api/v1/network/connect { receiverId|recipientId|targetUserId|addressee_id }
  r.post("/connect", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const body = req.body || {};
      const receiverId = body.receiverId || body.recipientId || body.targetUserId || body.addressee_id || body.user_id;
      if (typeof receiverId !== "string" || receiverId.length === 0) {
        throw new AppError("receiverId is required", 400, "VALIDATION_ERROR");
      }
      if (receiverId === req.authUser!.id) throw new AppError("Cannot connect with yourself", 400, "VALIDATION_ERROR");
      const { data: existing } = await deps.supabaseAdmin
        .from("connections")
        .select("id, status")
        .eq("requester_id", req.authUser!.id)
        .eq("addressee_id", receiverId)
        .maybeSingle();
      if (existing) throw new ConflictError(`Connection already ${existing.status}`);
      const { data, error } = await deps.supabaseAdmin
        .from("connections")
        .insert({ requester_id: req.authUser!.id, addressee_id: receiverId, status: "pending" })
        .select()
        .single();
      if (error) {
        if (String(error.message).includes("duplicate") || String(error.code) === "23505") {
          throw new ConflictError("Connection already exists");
        }
        throw error;
      }
      await createNotification(deps.supabaseAdmin, receiverId, "connection_request", req.authUser!.id, "connection", data?.id);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/network/connect — pending requests with direction
  r.get("/connect", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const me = req.authUser!.id;
      const { data, error } = await deps.supabaseAdmin
        .from("connections")
        .select(`id, status, requester_id, addressee_id, requester:user_profiles!connections_requester_id_fkey(${PROFILE_COLUMNS}), addressee:user_profiles!connections_addressee_id_fkey(${PROFILE_COLUMNS})`)
        .eq("status", "pending")
        .or(`requester_id.eq.${me},addressee_id.eq.${me}`);
      if (error) throw error;
      const requests = (data || []).map((row: any) => {
        const incoming = row.addressee_id === me;
        const person = incoming ? row.requester : row.addressee;
        return {
          id: row.id,
          direction: incoming ? "incoming" : "outgoing",
          status: row.status,
          user_id: person?.id ?? (incoming ? row.requester_id : row.addressee_id),
          ...(person || {}),
        };
      });
      res.json({ success: true, data: requests });
    } catch (err) {
      next(err);
    }
  });

  // PATCH /api/v1/network/connect/:id { status: accepted|rejected|withdrawn }
  r.patch("/connect/:id", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const { status } = req.body || {};
      if (!["accepted", "rejected", "withdrawn"].includes(status)) {
        throw new AppError("status must be accepted|rejected|withdrawn", 400, "VALIDATION_ERROR");
      }
      const me = req.authUser!.id;
      const { data: row } = await deps.supabaseAdmin
        .from("connections")
        .select("id, requester_id, addressee_id, status")
        .eq("id", req.params.id)
        .maybeSingle();
      if (!row) throw new NotFoundError("Connection request not found");

      if (status === "withdrawn") {
        if (row.requester_id !== me) throw new ForbiddenError("Only the requester can withdraw");
        await deps.supabaseAdmin.from("connections").delete().eq("id", row.id);
        res.json({ success: true, data: { status: "withdrawn" } });
        return;
      }
      if (row.addressee_id !== me) throw new ForbiddenError("Only the addressee can accept or decline");
      const { data, error } = await deps.supabaseAdmin
        .from("connections")
        .update({ status })
        .eq("id", row.id)
        .select()
        .single();
      if (error) throw error;
      if (status === "accepted") {
        await createNotification(deps.supabaseAdmin, row.requester_id, "connection_accepted", me, "connection", row.id);
      }
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/network/connections — accepted list OR ?myId=&theirId= status
  r.get("/connections", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const { myId, theirId } = req.query;
      if (typeof myId === "string" && typeof theirId === "string") {
        const rel1 = await deps.supabaseAdmin
          .from("connections")
          .select("status")
          .eq("requester_id", myId)
          .eq("addressee_id", theirId)
          .maybeSingle();
        const rel2 = await deps.supabaseAdmin
          .from("connections")
          .select("status")
          .eq("requester_id", theirId)
          .eq("addressee_id", myId)
          .maybeSingle();
        res.json({ success: true, data: { status: rel1?.status || rel2?.status || "none" } });
        return;
      }
      const me = req.authUser!.id;
      const { data: conns, error } = await deps.supabaseAdmin
        .from("connections")
        .select("requester_id, addressee_id, status")
        .eq("status", "accepted")
        .or(`requester_id.eq.${me},addressee_id.eq.${me}`);
      if (error) throw error;
      const ids = (conns || []).map((c) => (c.requester_id === me ? c.addressee_id : c.requester_id));
      if (ids.length === 0) {
        res.json({ success: true, data: { connections: [] } });
        return;
      }
      const { data: profiles, error: pErr } = await deps.supabaseAdmin
        .from("user_profiles")
        .select(PROFILE_COLUMNS)
        .in("id", ids);
      if (pErr) throw pErr;
      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      const connections = (conns || []).map((c) => {
        const otherId = c.requester_id === me ? c.addressee_id : c.requester_id;
        return { ...(profileMap.get(otherId) || {}), user_id: otherId, requester_id: c.requester_id, addressee_id: c.addressee_id, status: c.status };
      });
      res.json({ success: true, data: { connections } });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/network/suggestions — candidates not connected to me
  r.get("/suggestions", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const me = req.authUser!.id;
      const limit = Math.min(20, Math.max(1, parseInt(String(req.query.limit || "10"), 10) || 10));
      const { data: conns } = await deps.supabaseAdmin
        .from("connections")
        .select("requester_id, addressee_id")
        .or(`requester_id.eq.${me},addressee_id.eq.${me}`);
      const exclude = new Set((conns || []).flatMap((c) => [c.requester_id, c.addressee_id]));
      exclude.add(me);
      const { data, error } = await deps.supabaseAdmin
        .from("user_profiles")
        .select(PROFILE_COLUMNS)
        .not("username", "like", "qa_probe_%")
        .not("username", "like", "e2e_bot_%")
        .order("connection_count", { ascending: false })
        .limit(50);
      if (error) throw error;
      const suggestions = (data || []).filter((p) => !exclude.has(p.id)).slice(0, limit);
      res.json({ success: true, data: suggestions });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/network/follow/:userId — follow state
  r.get("/follow/:userId", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const { data } = await deps.supabaseAdmin
        .from("user_follows")
        .select("id")
        .eq("follower_id", req.authUser!.id)
        .eq("following_id", req.params.userId)
        .maybeSingle();
      res.json({ success: true, data: { following: !!data } });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/network/follow/:userId — follow (23505 → 409)
  r.post("/follow/:userId", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      if (req.params.userId === req.authUser!.id) throw new AppError("Cannot follow yourself", 400, "VALIDATION_ERROR");
      const { error } = await deps.supabaseAdmin
        .from("user_follows")
        .insert({ follower_id: req.authUser!.id, following_id: req.params.userId });
      if (error) {
        if (String(error.code) === "23505") throw new ConflictError("Already following");
        throw error;
      }
      await createNotification(deps.supabaseAdmin, req.params.userId, "follow", req.authUser!.id);
      res.status(201).json({ success: true, data: { following: true } });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/network/followers — who follows me (+ am I following back)
  r.get("/followers", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const me = req.authUser!.id;
      const { data, error } = await deps.supabaseAdmin
        .from("user_follows")
        .select(`follower_id, follower:user_profiles!user_follows_follower_id_fkey(${PROFILE_COLUMNS})`)
        .eq("following_id", me);
      if (error) throw error;
      const { data: back } = await deps.supabaseAdmin
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", me);
      const followingBack = new Set((back || []).map((r) => r.following_id));
      const users = (data || []).map((row: any) => ({ ...(row.follower || {}), is_following_back: followingBack.has(row.follower_id) }));
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/network/following — who I follow (+ do they follow me back)
  r.get("/following", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const me = req.authUser!.id;
      const { data, error } = await deps.supabaseAdmin
        .from("user_follows")
        .select(`following_id, following:user_profiles!user_follows_following_id_fkey(${PROFILE_COLUMNS})`)
        .eq("follower_id", me);
      if (error) throw error;
      const ids = (data || []).map((row: any) => row.following_id);
      const { data: back } = ids.length
        ? await deps.supabaseAdmin.from("user_follows").select("follower_id").eq("following_id", me).in("follower_id", ids)
        : { data: [] };
      const followingBack = new Set((back || []).map((r) => r.follower_id));
      const users = (data || []).map((row: any) => ({ ...(row.following || {}), is_following_back: followingBack.has(row.following_id) }));
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  });

  return r;
}

// ---------- Notifications (mirrors /api/notifications) ----------

export function notificationsRouter(deps: Deps): Router {
  const r = Router();
  r.use(requireAuth(deps.supabase));

  // GET /api/v1/notifications — latest 100 (+ actor profile)
  r.get("/", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const { data, error } = await deps.supabaseAdmin
        .from("notifications")
        .select("*, actor:user_profiles!notifications_actor_id_fkey(username, display_name, avatar_url)")
        .eq("user_id", req.authUser!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      res.json({ success: true, data: data || [] });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/notifications/count
  r.get("/count", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const { count, error } = await deps.supabaseAdmin
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", req.authUser!.id)
        .eq("is_read", false);
      if (error) throw error;
      res.json({ success: true, data: { unreadCount: count ?? 0 } });
    } catch (err) {
      next(err);
    }
  });

  // PATCH /api/v1/notifications — mark all read
  r.patch("/", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const { error } = await deps.supabaseAdmin
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", req.authUser!.id)
        .eq("is_read", false);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  // PATCH /api/v1/notifications/:id — mark one read
  r.patch("/:id", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const { data: notif } = await deps.supabaseAdmin
        .from("notifications")
        .select("id")
        .eq("id", req.params.id)
        .eq("user_id", req.authUser!.id)
        .maybeSingle();
      if (!notif) throw new NotFoundError("Notification not found");
      const { error } = await deps.supabaseAdmin.from("notifications").update({ is_read: true }).eq("id", req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  return r;
}