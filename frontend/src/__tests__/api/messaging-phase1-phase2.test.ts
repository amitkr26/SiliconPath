/**
 * @jest-environment node
 */

jest.mock('next/server', () => {
  class MockNextRequest {
    url: string;
    method: string;
    headers: { get: (name: string) => string | null };
    private _body: any;
    constructor(url: string, init?: any) {
      this.url = url;
      this.method = init?.method || 'GET';
      const headerMap: Record<string, string> = {};
      if (init?.headers) {
        for (const [k, v] of Object.entries(init.headers)) {
          headerMap[k.toLowerCase()] = String(v ?? '');
        }
      }
      this.headers = { get: (name: string) => headerMap[name.toLowerCase()] ?? null };
      this._body = init?.body ? JSON.parse(init.body) : null;
    }
    async json() { return this._body; }
  }
  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      json: (body: any, init?: any) => {
        const status = init?.status || 200;
        const headers = init?.headers || {};
        return {
          status,
          headers: { get: (k: string) => headers[k] || null },
          json: async () => body,
        };
      },
    },
  };
});

let mockCurrentUser: any = null;

jest.mock("@/lib/employer-auth", () => ({
  getAuthenticatedEmployerUser: jest.fn(async () => mockCurrentUser),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: {
      getUser: jest.fn(async () => ({ data: { user: mockCurrentUser }, error: null })),
    },
  })),
}));

const mockFrom = jest.fn();
const mockRpc = jest.fn();
jest.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: (...args: any[]) => mockFrom(...args),
    rpc: (...args: any[]) => mockRpc(...args),
  },
  isAdminConfigured: true,
}));

jest.mock("@/lib/notifications", () => ({
  createNotification: jest.fn().mockResolvedValue({ id: "notif-1" }),
}));

import { NextRequest } from "next/server";
import { GET as getConversations, POST as postMessage } from "@/app/api/messages/route";
import {
  GET as getThread,
  POST as postThreadMessage,
  PATCH as patchThreadMessages,
} from "@/app/api/messages/[conversationId]/route";
import { GET as getUnreadCount } from "@/app/api/messages/unread-count/route";

describe("BDW Messaging — Phase 1 & Phase 2 Verification Test Suite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = null;
  });

  describe("1. Authentication Boundaries", () => {
    it("returns 401 for anonymous GET /api/messages", async () => {
      const req = new NextRequest("http://localhost:3000/api/messages");
      const res = await getConversations(req);
      expect(res.status).toBe(401);
    });

    it("returns 401 for anonymous POST /api/messages", async () => {
      const req = new NextRequest("http://localhost:3000/api/messages", {
        method: "POST",
        body: JSON.stringify({ content: "hi", recipientId: "user-2" }),
      });
      const res = await postMessage(req);
      expect(res.status).toBe(401);
    });

    it("returns 401 for anonymous GET /api/messages/unread-count", async () => {
      const req = new NextRequest("http://localhost:3000/api/messages/unread-count");
      const res = await getUnreadCount(req);
      expect(res.status).toBe(401);
    });

    it("returns 401 for anonymous GET /api/messages/[conversationId]", async () => {
      const req = new NextRequest("http://localhost:3000/api/messages/conv-1");
      const res = await getThread(req, { params: { conversationId: "conv-1" } });
      expect(res.status).toBe(401);
    });
  });

  describe("2. Message Length & Boundary Validation (0, whitespace, 3999, 4000, 4001 chars)", () => {
    beforeEach(() => {
      mockCurrentUser = { id: "user-alice" };
    });

    const setupMockAllowed = () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "conversations") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: "conv-1", participant_a: "user-alice", participant_b: "user-bob" },
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
          };
        }
        if (table === "connections") {
          return {
            select: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === "messages") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "msg-ok", body: "ok", created_at: "2026-09-19T00:00:00Z" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });
    };

    // POST /api/messages
    it("POST /api/messages rejects empty body with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/messages", {
        method: "POST",
        body: JSON.stringify({ content: "", recipientId: "user-bob" }),
      });
      const res = await postMessage(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/content is required/i);
    });

    it("POST /api/messages rejects whitespace-only with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/messages", {
        method: "POST",
        body: JSON.stringify({ content: "    \n\t  ", recipientId: "user-bob" }),
      });
      const res = await postMessage(req);
      expect(res.status).toBe(400);
    });

    it("POST /api/messages allows exactly 3,999 characters (success 201)", async () => {
      setupMockAllowed();
      const content = "A".repeat(3999);
      const req = new NextRequest("http://localhost:3000/api/messages", {
        method: "POST",
        body: JSON.stringify({ content, recipientId: "user-bob" }),
      });
      const res = await postMessage(req);
      expect(res.status).toBe(201);
    });

    it("POST /api/messages allows exactly 4,000 characters (success 201)", async () => {
      setupMockAllowed();
      const content = "B".repeat(4000);
      const req = new NextRequest("http://localhost:3000/api/messages", {
        method: "POST",
        body: JSON.stringify({ content, recipientId: "user-bob" }),
      });
      const res = await postMessage(req);
      expect(res.status).toBe(201);
    });

    it("POST /api/messages rejects 4,001 characters with 400", async () => {
      const content = "C".repeat(4001);
      const req = new NextRequest("http://localhost:3000/api/messages", {
        method: "POST",
        body: JSON.stringify({ content, recipientId: "user-bob" }),
      });
      const res = await postMessage(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/exceeds 4,000 characters/i);
    });

    // POST /api/messages/[conversationId]
    it("POST /api/messages/[conversationId] rejects empty/whitespace with 400", async () => {
      setupMockAllowed();
      const req = new NextRequest("http://localhost:3000/api/messages/conv-1", {
        method: "POST",
        body: JSON.stringify({ content: "   " }),
      });
      const res = await postThreadMessage(req, { params: { conversationId: "conv-1" } });
      expect(res.status).toBe(400);
    });

    it("POST /api/messages/[conversationId] allows exactly 4,000 characters (success 201)", async () => {
      setupMockAllowed();
      const req = new NextRequest("http://localhost:3000/api/messages/conv-1", {
        method: "POST",
        body: JSON.stringify({ content: "D".repeat(4000) }),
      });
      const res = await postThreadMessage(req, { params: { conversationId: "conv-1" } });
      expect(res.status).toBe(201);
    });

    it("POST /api/messages/[conversationId] rejects 4,001 characters with 400", async () => {
      setupMockAllowed();
      const req = new NextRequest("http://localhost:3000/api/messages/conv-1", {
        method: "POST",
        body: JSON.stringify({ content: "E".repeat(4001) }),
      });
      const res = await postThreadMessage(req, { params: { conversationId: "conv-1" } });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/exceeds 4,000 characters/i);
    });
  });

  describe("3. Block Check Enforcement", () => {
    beforeEach(() => {
      mockCurrentUser = { id: "user-alice" };
    });

    it("blocks message creation if connections has status = 'blocked' (returns 403)", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "conversations") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: "conv-1", participant_a: "user-alice", participant_b: "user-bob" },
              error: null,
            }),
          };
        }
        if (table === "connections") {
          return {
            select: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: "conn-blocked", requester_id: "user-bob", addressee_id: "user-alice", status: "blocked" },
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const req = new NextRequest("http://localhost:3000/api/messages", {
        method: "POST",
        body: JSON.stringify({ conversationId: "conv-1", content: "Can you see this?" }),
      });

      const res = await postMessage(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/blocked communication/i);
    });
  });

  describe("4. Rate Limiting (20 msgs/minute rolling window & User Isolation)", () => {
    it("allows exactly 20 messages, rejects 21st with 429, and isolates user quotas", async () => {
      const userSpammer = "user-rate-test-" + Date.now();
      mockCurrentUser = { id: userSpammer };

      mockFrom.mockImplementation((table: string) => {
        if (table === "conversations") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: "conv-spam", participant_a: userSpammer, participant_b: "user-bob" },
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
          };
        }
        if (table === "connections") {
          return {
            select: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === "messages") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "msg-new", body: "Hello", created_at: new Date().toISOString() },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      // Send 20 messages rapidly (all should succeed 201)
      for (let i = 0; i < 20; i++) {
        const req = new NextRequest("http://localhost:3000/api/messages", {
          method: "POST",
          body: JSON.stringify({ conversationId: "conv-spam", content: `Msg ${i}` }),
        });
        const res = await postMessage(req);
        expect(res.status).toBe(201);
      }

      // The 21st message must be rejected with 429 Too Many Requests
      const reqExceeded = new NextRequest("http://localhost:3000/api/messages", {
        method: "POST",
        body: JSON.stringify({ conversationId: "conv-spam", content: "Msg 21" }),
      });
      const resExceeded = await postMessage(reqExceeded);
      expect(resExceeded.status).toBe(429);
      const json = await resExceeded.json();
      expect(json.error).toMatch(/Too many messages/i);
      expect(resExceeded.headers.get("Retry-After")).toBeTruthy();

      // User Isolation: User Bob / Other user should still have a full quota!
      const userOther = "user-other-" + Date.now();
      mockCurrentUser = { id: userOther };
      const reqOther = new NextRequest("http://localhost:3000/api/messages", {
        method: "POST",
        body: JSON.stringify({
          recipientId: "user-bob",
          content: "Msg from other user",
        }),
      });
      const resOther = await postMessage(reqOther);
      expect(resOther.status).toBe(201);
    });

    it("validation failure does NOT consume rate limit quota", async () => {
      const userClean = "user-clean-" + Date.now();
      mockCurrentUser = { id: userClean };

      // Send 5 invalid messages (empty body)
      for (let i = 0; i < 5; i++) {
        const reqInvalid = new NextRequest("http://localhost:3000/api/messages", {
          method: "POST",
          body: JSON.stringify({ conversationId: "conv-clean", content: "   " }),
        });
        const resInvalid = await postMessage(reqInvalid);
        expect(resInvalid.status).toBe(400);
      }

      // Mock setup for valid send
      mockFrom.mockImplementation((table: string) => {
        if (table === "conversations") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: "conv-clean", participant_a: userClean, participant_b: "user-bob" },
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
          };
        }
        if (table === "connections") {
          return {
            select: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === "messages") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: "msg-1", body: "Valid", created_at: new Date().toISOString() },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Send a valid message — it should succeed without quota penalty
      const reqValid = new NextRequest("http://localhost:3000/api/messages", {
        method: "POST",
        body: JSON.stringify({ conversationId: "conv-clean", content: "Valid message" }),
      });
      const resValid = await postMessage(reqValid);
      expect(resValid.status).toBe(201);
    });
  });

  describe("5. Query Optimization & RPC Routing", () => {
    it("uses get_user_conversations_overview RPC for single-query conversation listing", async () => {
      mockCurrentUser = { id: "user-alice" };

      mockRpc.mockResolvedValue({
        data: [
          {
            id: "conv-1",
            participant_a: "user-alice",
            participant_b: "user-bob",
            last_message_at: "2026-09-19T10:00:00Z",
            created_at: "2026-09-19T09:00:00Z",
            other_id: "user-bob",
            other_display_name: "Bob Engineer",
            other_avatar_url: "/bob.jpg",
            other_headline: "VLSI Lead",
            last_message_body: "Hi Alice",
            last_message_created_at: "2026-09-19T10:00:00Z",
            unread_count: 2,
          },
        ],
        error: null,
      });

      const req = new NextRequest("http://localhost:3000/api/messages");
      const res = await getConversations(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(mockRpc).toHaveBeenCalledWith("get_user_conversations_overview", { p_user_id: "user-alice" });
      expect(json.conversations).toHaveLength(1);
      expect(json.conversations[0].unread_count).toBe(2);
      expect(json.conversations[0].other_user.display_name).toBe("Bob Engineer");
      expect(json.conversations[0].last_message.content).toBe("Hi Alice");
    });

    it("uses get_unread_message_count RPC for scalar unread count endpoint", async () => {
      mockCurrentUser = { id: "user-alice" };
      mockRpc.mockResolvedValue({ data: 5, error: null });

      const req = new NextRequest("http://localhost:3000/api/messages/unread-count");
      const res = await getUnreadCount(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(mockRpc).toHaveBeenCalledWith("get_unread_message_count", { p_user_id: "user-alice" });
      expect(json.unread_count).toBe(5);
    });
  });

  describe("6. Composite Cursor Thread Pagination & Read-Only GET", () => {
    beforeEach(() => {
      mockCurrentUser = { id: "user-alice" };
    });

    it("GET /api/messages/[conversationId] returns composite cursor (created_at|id) and does NOT mutate is_read", async () => {
      const mockUpdate = jest.fn();
      const mockOr = jest.fn().mockReturnThis();

      mockFrom.mockImplementation((table: string) => {
        if (table === "conversations") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: "conv-1", participant_a: "user-alice", participant_b: "user-bob" },
              error: null,
            }),
          };
        }
        if (table === "messages") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            or: mockOr,
            limit: jest.fn().mockResolvedValue({
              data: [
                { id: "msg-1", body: "Hello", created_at: "2026-09-19T08:00:00Z", is_read: false },
              ],
              error: null,
            }),
            update: mockUpdate,
          };
        }
        return {};
      });

      const req = new NextRequest("http://localhost:3000/api/messages/conv-1?limit=1");
      const res = await getThread(req, { params: { conversationId: "conv-1" } });
      expect(res.status).toBe(200);

      // Crucial assertion: GET must NEVER call update
      expect(mockUpdate).not.toHaveBeenCalled();

      const json = await res.json();
      expect(json.messages).toHaveLength(1);
      expect(json.next_cursor).toBe("2026-09-19T08:00:00Z|msg-1");
      expect(json.has_more).toBe(true);

      // Second page with composite cursor passed
      const reqPage2 = new NextRequest("http://localhost:3000/api/messages/conv-1?limit=1&before=2026-09-19T08:00:00Z|msg-1");
      const resPage2 = await getThread(reqPage2, { params: { conversationId: "conv-1" } });
      expect(resPage2.status).toBe(200);
      expect(mockOr).toHaveBeenCalledWith(
        expect.stringContaining("created_at.lt.2026-09-19T08:00:00Z")
      );
    });

    it("PATCH /api/messages/[conversationId] marks incoming messages as read", async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "conversations") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: "conv-1", participant_a: "user-alice", participant_b: "user-bob" },
              error: null,
            }),
          };
        }
        if (table === "messages") {
          return {
            update: mockUpdate,
          };
        }
        return {};
      });

      const req = new NextRequest("http://localhost:3000/api/messages/conv-1", {
        method: "PATCH",
        body: JSON.stringify({ messageIds: ["msg-1", "msg-2"] }),
      });

      const res = await patchThreadMessages(req, { params: { conversationId: "conv-1" } });
      expect(res.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
    });
  });
});
