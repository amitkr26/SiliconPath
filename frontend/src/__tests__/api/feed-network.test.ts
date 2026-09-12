/**
 * @jest-environment node
 */
jest.mock("next/server", () => {
  class MockNextRequest {
    url: string;
    method: string;
    body: string;
    headers: { get: (n: string) => string | null };
    constructor(url: string, init?: any) {
      this.url = url;
      this.method = init?.method || "GET";
      this.body = init?.body || "";
      this.headers = { get: () => null };
    }
    async json() { return JSON.parse(this.body || "{}"); }
  }
  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      json: (body: any, init?: any) => ({
        status: init?.status || 200,
        json: async () => body,
      }),
    },
  };
});

// Shared mock state
let mockUser: { id: string } | null = null;
let existingLike: { id: string } | null = null;
let existingRepost: { id: string } | null = null;
let existingFollow: { id: string } | null = null;
let followInsertError: { code: string } | null = null;

jest.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: () => Promise.resolve({ data: { user: mockUser } }) },
  }),
}));

jest.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: (table: string) => {
      const chain: any = (...args: any[]) => chain;
      chain.then = (onfulfilled: any) => {
        let data = null;
        if (table === "feed_post_likes") data = existingLike;
        else if (table === "feed_post_reposts") data = existingRepost;
        else if (table === "user_follows") data = existingFollow;
        return Promise.resolve({ data, error: null }).then(onfulfilled);
      };
      chain.select = () => chain;
      chain.insert = () => {
        if (table === "user_follows" && followInsertError) {
          return {
            then: (onfulfilled: any) =>
              Promise.resolve({ data: null, error: followInsertError }).then(onfulfilled),
          };
        }
        return chain;
      };
      chain.delete = () => chain;
      chain.eq = () => chain;
      chain.maybeSingle = () => chain;
      return chain;
    },
  },
}));

jest.mock("@/lib/notifications", () => ({
  createNotification: jest.fn(() => Promise.resolve()),
}));

// --- Feed Like Toggle ---
import { POST as likePost } from "@/app/api/feed/posts/[id]/like/route";

describe("Feed like toggle", () => {
  beforeEach(() => {
    mockUser = { id: "user-1" };
    existingLike = null;
  });

  it("returns 401 when not authenticated", async () => {
    mockUser = null;
    const { NextRequest } = require("next/server");
    const res = await likePost(new NextRequest("http://localhost/api/feed/posts/p1/like", { method: "POST" }), { params: { id: "p1" } });
    expect(res.status).toBe(401);
  });

  it("inserts a like when none exists", async () => {
    existingLike = null;
    const { NextRequest } = require("next/server");
    const res = await likePost(new NextRequest("http://localhost/api/feed/posts/p1/like", { method: "POST" }), { params: { id: "p1" } });
    const body = await res.json();
    expect(body.liked).toBe(true);
  });

  it("removes an existing like (toggle off)", async () => {
    existingLike = { id: "like-1" };
    const { NextRequest } = require("next/server");
    const res = await likePost(new NextRequest("http://localhost/api/feed/posts/p1/like", { method: "POST" }), { params: { id: "p1" } });
    const body = await res.json();
    expect(body.liked).toBe(false);
  });
});

// --- Network Follow Self-Guard ---
import { POST as followUser } from "@/app/api/network/follow/[userId]/route";

describe("Network follow self-guard", () => {
  beforeEach(() => {
    mockUser = { id: "user-1" };
    existingFollow = null;
    followInsertError = null;
  });

  it("returns 400 when trying to follow yourself", async () => {
    const { NextRequest } = require("next/server");
    const res = await followUser(new NextRequest("http://localhost/api/network/follow/user-1", { method: "POST" }), { params: { userId: "user-1" } });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Cannot follow yourself/i);
  });

  it("returns 401 when not authenticated", async () => {
    mockUser = null;
    const { NextRequest } = require("next/server");
    const res = await followUser(new NextRequest("http://localhost/api/network/follow/user-2", { method: "POST" }), { params: { userId: "user-2" } });
    expect(res.status).toBe(401);
  });

  it("allows following another user", async () => {
    existingFollow = null;
    const { NextRequest } = require("next/server");
    const res = await followUser(new NextRequest("http://localhost/api/network/follow/user-2", { method: "POST" }), { params: { userId: "user-2" } });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 409 when already following", async () => {
    followInsertError = { code: "23505" };
    const { NextRequest } = require("next/server");
    const res = await followUser(new NextRequest("http://localhost/api/network/follow/user-2", { method: "POST" }), { params: { userId: "user-2" } });
    expect(res.status).toBe(409);
  });
});
