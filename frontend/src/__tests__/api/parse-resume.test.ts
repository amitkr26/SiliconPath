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
        for (const [k, v] of Object.entries(init.headers)) {
          headerMap[k.toLowerCase()] = String(v ?? "");
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
      redirect: (url: string) => ({ status: 302, headers: new Map([["location", url]]) }),
    },
  };
});

import { parseResumeTextDeterministically } from "@/lib/resume-text-parser";

describe("Resume Parser Unit Tests", () => {
  it("extracts email from text", () => {
    const text = "Contact: user@example.com";
    const parsed = parseResumeTextDeterministically(text);
    expect(parsed.email).toBe("user@example.com");
  });

  it("extracts phone from text", () => {
    const text = "Phone: +1-555-123-4567";
    const parsed = parseResumeTextDeterministically(text);
    expect(parsed.phone).toBe("+1-555-123-4567");
  });

  it("extracts full name from text", () => {
    const text = "John Doe\nSoftware Engineer";
    const parsed = parseResumeTextDeterministically(text);
    expect(parsed.full_name).toBe("John Doe");
  });

  it("extracts skills from text", () => {
    const text = "Skills: Verilog, SystemVerilog, FPGA";
    const parsed = parseResumeTextDeterministically(text);
    expect(parsed.skills).toContain("Verilog");
    expect(parsed.skills).toContain("SystemVerilog");
    expect(parsed.skills).toContain("FPGA");
  });

  it("handles empty text", () => {
    const parsed = parseResumeTextDeterministically("");
    expect(parsed.email).toBeUndefined();
    expect(parsed.phone).toBeUndefined();
    expect(parsed.full_name).toBeUndefined();
    expect(parsed.skills).toEqual([]);
  });

  it("handles text with only whitespace", () => {
    const parsed = parseResumeTextDeterministically("   \n  \n  ");
    expect(parsed.email).toBeUndefined();
    expect(parsed.skills).toEqual([]);
  });
});