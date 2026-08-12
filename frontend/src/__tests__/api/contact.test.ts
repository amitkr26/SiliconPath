/**
 * QA audit P1 — POST /api/contact.
 * - successful request → 201
 * - failed request → 4xx/5xx with a meaningful error
 * - invalid type/notes/email rejected before any DB write
 */
/**
 * @jest-environment node
 */
jest.mock("next/server", () => {
  class MockNextRequest {
    url: string;
    method: string;
    headers: { get: (name: string) => string | null };
    private _body: any;
    constructor(url: string, init?: any) {
      this.url = url;
      this.method = init?.method || "GET";
      const headerMap: Record<string, string> = {};
      if (init?.headers) {
        for (const [k, v] of Object.entries(init.headers)) headerMap[k.toLowerCase()] = String(v ?? "");
      }
      this.headers = { get: (name: string) => headerMap[name.toLowerCase()] ?? null };
      this._body = init?.body ?? null;
    }
    async json() { return this._body ? JSON.parse(this._body) : null; }
  }
  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      json: (body: any, init?: any) => ({ status: init?.status || 200, json: async () => body }),
      redirect: (url: string) => ({ status: 302, headers: new Map([["location", url]]) }),
    },
  };
});

const insertMock = jest.fn();
jest.mock("@/lib/supabase", () => ({
  isAdminConfigured: true,
  supabaseAdmin: {
    from: jest.fn(() => ({
      insert: insertMock,
    })),
  },
}));
jest.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: jest.fn(() => Promise.resolve({ success: true })),
}));

import { POST } from "@/app/api/contact/route";

function req(body: any) {
  const { NextRequest } = require("next/server");
  return new NextRequest("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("P1 /api/contact", () => {
  beforeEach(() => insertMock.mockReset());

  test("successful request returns 201", async () => {
    insertMock.mockResolvedValue({ error: null });
    const res = await POST(req({
      type: "missing_opportunity",
      url: "https://rac.gov.in/notice",
      notes: "This JRF notification is missing from the database.",
      contact_email: "tester@example.com",
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(insertMock).toHaveBeenCalledWith([expect.objectContaining({
      report_type: "other",
      reporter_email: "tester@example.com",
    })]);
  });

  test("invalid type returns 400 and never touches the DB", async () => {
    const res = await POST(req({ type: "nonsense", notes: "some details here" }));
    expect(res.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  test("missing notes returns 400", async () => {
    const res = await POST(req({ type: "general", notes: "" }));
    expect(res.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  test("invalid email returns 400", async () => {
    const res = await POST(req({ type: "general", notes: "This is a valid note.", contact_email: "not-an-email" }));
    expect(res.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  test("DB failure returns 500 with meaningful error", async () => {
    insertMock.mockResolvedValue({ error: { message: "connection refused" } });
    const res = await POST(req({ type: "broken_link", notes: "The DRDO link is dead." }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("try again");
  });

  test("invalid JSON body returns 400", async () => {
    const { NextRequest } = require("next/server");
    const req2 = new NextRequest("http://localhost/api/contact", { method: "POST", headers: {}, body: "{" });
    const res = await POST(req2);
    expect(res.status).toBe(400);
  });
});
