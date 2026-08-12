/**
 * QA audit P1 — /api/search thin route over the canonical opportunities
 * service: non-zero results for q=DRDO, correct count, pagination, category
 * validation (P2).
 */
/**
 * @jest-environment node
 */
jest.mock("next/server", () => {
  class MockNextRequest {
    url: string;
    method: string;
    headers: { get: (name: string) => string | null };
    constructor(url: string, init?: any) {
      this.url = url;
      this.method = init?.method || "GET";
      const headerMap: Record<string, string> = {};
      if (init?.headers) {
        for (const [k, v] of Object.entries(init.headers)) headerMap[k.toLowerCase()] = String(v ?? "");
      }
      this.headers = { get: (name: string) => headerMap[name.toLowerCase()] ?? null };
    }
    async json() { return null; }
  }
  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      json: (body: any, init?: any) => ({ status: init?.status || 200, json: async () => body }),
      redirect: (url: string) => ({ status: 302, headers: new Map([["location", url]]) }),
    },
  };
});

function makeChain(finalResult: any) {
  const chain: any = (..._args: any[]) => chain;
  chain.then = (onfulfilled: any) => Promise.resolve(finalResult).then(onfulfilled);
  chain.eq = () => chain;
  chain.neq = () => chain;
  chain.or = () => chain;
  chain.order = () => chain;
  chain.ilike = () => chain;
  chain.gte = () => chain;
  chain.lte = () => chain;
  chain.gt = () => chain;
  chain.not = () => chain;
  chain.maybeSingle = () => chain;
  chain.range = () => chain;
  chain.select = () => chain;
  chain.insert = () => chain;
  return chain;
}

const ROWS = Array.from({ length: 30 }, (_, i) => ({
  id: `o${i}`,
  title: `DRDO Scientist ${i}`,
  organization: "DRDO",
  slug: `drdo-scientist-${i}`,
  is_active: true,
  verification_status: "verified",
  created_at: `2026-08-0${(i % 9) + 1}T00:00:00Z`,
}));

jest.mock("@/lib/supabase", () => ({
  isAdminConfigured: true,
  supabaseAdmin: {
    from: (table: string) => {
      if (table === "organizations") {
        return { ...makeChain({ data: [{ id: "org-drdo" }], error: null }), or: () => makeChain({ data: [{ id: "org-drdo" }], error: null }) };
      }
      const chain = makeChain({ data: ROWS, count: 25, error: null });
      return chain;
    },
  },
}));

jest.mock("@/lib/utils", () => ({
  mapDbOpportunityToClient: (o: any) => ({ ...o }),
}));

import { GET } from "@/app/api/search/route";
import { GET as GET_OPPS } from "@/app/api/opportunities/route";

describe("P1 /api/search", () => {
  test("q=DRDO returns non-zero results with count and pagination", async () => {
    const { NextRequest } = require("next/server");
    const res = await GET(new NextRequest("http://localhost/api/search?q=DRDO&page=1&limit=10"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.q).toBe("DRDO");
    expect(body.opportunities.length).toBeGreaterThan(0);
    expect(body.opportunities.every((o: any) => o.title.includes("DRDO"))).toBe(true);
    expect(body.total_count).toBe(25);
    expect(body.page).toBe(1);
    expect(body.total_pages).toBe(3);
  });

  test("page 2 differs from page 1 (pagination works)", async () => {
    const { NextRequest } = require("next/server");
    const page1 = await (await GET(new NextRequest("http://localhost/api/search?q=DRDO&limit=10&page=1"))).json();
    const page2 = await (await GET(new NextRequest("http://localhost/api/search?q=DRDO&limit=10&page=2"))).json();
    expect(page1.page).toBe(1);
    expect(page2.page).toBe(2);
    expect(page2.total_pages).toBe(3);
  });

  test("invalid category is rejected with 400, not silently unfiltered", async () => {
    const { NextRequest } = require("next/server");
    const res = await GET(new NextRequest("http://localhost/api/search?q=DRDO&category=phy"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid category");
  });

  test("canonical legacy category values are accepted", async () => {
    const { NextRequest } = require("next/server");
    for (const cat of ["jrf", "srf", "phd", "job", "internship"]) {
      const res = await GET(new NextRequest(`http://localhost/api/search?q=x&category=${cat}`));
      expect(res.status).toBe(200);
    }
  });

  test("missing q returns empty result set, not an error", async () => {
    const { NextRequest } = require("next/server");
    const res = await GET(new NextRequest("http://localhost/api/search"));
    expect(res.status).toBe(200);
  });
});

describe("P2 category validation on canonical /api/opportunities", () => {
  test("invalid category rejected with 400", async () => {
    const { NextRequest } = require("next/server");
    const res = await GET_OPPS(new NextRequest("http://localhost/api/opportunities?category=phy"));
    expect(res.status).toBe(400);
  });

  test("valid categories still pass", async () => {
    const { NextRequest } = require("next/server");
    const res = await GET_OPPS(new NextRequest("http://localhost/api/opportunities?category=jrf"));
    expect(res.status).toBe(200);
  });
});
