/**
 * @jest-environment node
 */
// Regression tests for the secure unsubscribe fix: DELETE /api/subscribe used
// to delete by raw email with no token (anyone could unsubscribe anyone).
// Pins: token required, wrong token rejected 403, matching token deletes,
// subscribe returns a generated token.
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

let deleteEq: string | null = null;
let row: { id: string; unsubscribe_token: string | null } | null = null;

jest.mock("@/lib/supabase", () => ({
  isAdminConfigured: true,
  supabaseAdmin: {
    from: jest.fn((table: string) => {
      const chain: any = (...args: any[]) => chain;
      chain.then = (onfulfilled: any) => {
        const result = { data: row, error: null };
        return Promise.resolve(result).then(onfulfilled);
      };
      chain.select = () => chain;
      chain.eq = (col: string, val: string) => { deleteEq = val; return chain; };
      chain.maybeSingle = () => chain;
      chain.insert = () => ({
        select: () => ({
          then: (onfulfilled: any) =>
            Promise.resolve({ data: [{ id: "sub-1" }], error: null }).then(onfulfilled),
        }),
      });
      chain.delete = () => chain;
      return chain;
    }),
  },
}));

jest.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: jest.fn(() => Promise.resolve({ success: true })),
}));

import { POST, DELETE } from "@/app/api/subscribe/route";

describe("POST /api/subscribe", () => {
  beforeEach(() => { row = null; deleteEq = null; jest.clearAllMocks(); });

  it("generates an unsubscribe token on subscribe", async () => {
    const { NextRequest } = require("next/server");
    const res = await POST(new NextRequest("http://localhost/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com" }),
    }));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.unsubscribe_token).toBeTruthy();
  });
});

describe("DELETE /api/subscribe (unsubscribe)", () => {
  beforeEach(() => { row = null; deleteEq = null; jest.clearAllMocks(); });

  it("rejects unsubscribe without a token", async () => {
    const { NextRequest } = require("next/server");
    const res = await DELETE(new NextRequest("http://localhost/api/subscribe?email=a@b.com", { method: "DELETE" }));
    expect(res.status).toBe(400);
  });

  it("rejects a mismatched token with 403", async () => {
    row = { id: "sub-1", unsubscribe_token: "real-token" };
    const { NextRequest } = require("next/server");
    const res = await DELETE(new NextRequest("http://localhost/api/subscribe?email=a@b.com&token=wrong", { method: "DELETE" }));
    expect(res.status).toBe(403);
  });

  it("deletes only after email + token match", async () => {
    row = { id: "sub-1", unsubscribe_token: "real-token" };
    const { NextRequest } = require("next/server");
    const { supabaseAdmin } = require("@/lib/supabase");
    const res = await DELETE(new NextRequest("http://localhost/api/subscribe?email=a@b.com&token=real-token", { method: "DELETE" }));
    expect(res.status).toBe(200);
    expect(deleteEq).toBe("sub-1");
    expect(supabaseAdmin.from).toHaveBeenCalledWith("subscribers");
  });
});
