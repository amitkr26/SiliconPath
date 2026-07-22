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
        return { status, json: async () => body };
      },
      redirect: (url: string) => ({ status: 302, headers: new Map([['location', url]]) }),
    },
  };
});

jest.mock('@/lib/ai/providers', () => ({
  callAI: jest.fn(),
}));

import { POST } from "@/app/api/ai/classify/route";
import { callAI } from "@/lib/ai/providers";

const mockedCallAI = callAI as jest.MockedFunction<typeof callAI>;

beforeEach(() => {
  mockedCallAI.mockReset();
  mockedCallAI.mockResolvedValue({ text: "JRF", provider: "groq", model: "mixtral-8x7b" });
});

describe("POST /api/ai/classify", () => {
  it("returns 400 when title is missing", async () => {
    const req = new (require("next/server").NextRequest)("http://localhost/api/ai/classify", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("title is required");
  });

  it("classifies a valid opportunity", async () => {
    const req = new (require("next/server").NextRequest)("http://localhost/api/ai/classify", {
      method: "POST",
      body: JSON.stringify({ title: "Junior Research Fellow at IIT Bombay", description: "VLSI design" }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.category).toBe("JRF");
    expect(body.confidence).toBe("high");
  });

  it("returns Unclassified for unknown category", async () => {
    mockedCallAI.mockResolvedValue({ text: "SomethingRandom", provider: "groq", model: "mixtral-8x7b" });
    const req = new (require("next/server").NextRequest)("http://localhost/api/ai/classify", {
      method: "POST",
      body: JSON.stringify({ title: "Some weird title" }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body.category).toBe("Unclassified");
    expect(body.confidence).toBe("low");
  });

  it("handles server error gracefully", async () => {
    mockedCallAI.mockRejectedValue(new Error("API down"));
    const req = new (require("next/server").NextRequest)("http://localhost/api/ai/classify", {
      method: "POST",
      body: JSON.stringify({ title: "JRF at IISc" }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(500);
  });
});
