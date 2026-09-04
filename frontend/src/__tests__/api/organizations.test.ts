/**
 * @jest-environment node
 */
// Regression tests for the organizations API pagination fix: page/per_page
// were ignored (every page returned the full list, page1 === page2). Pins:
// range() receives the correct offsets per page and the response carries
// total/page/per_page/total_pages.
jest.mock("next/server", () => {
  class MockNextRequest {
    url: string;
    constructor(url: string) {
      this.url = url;
    }
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

const ORG_ROWS = Array.from({ length: 10 }, (_, i) => ({
  id: `org-${i}`,
  name: `Org ${i}`,
  slug: `org-${i}`,
  type: "institute",
  logo_url: null,
  location: "India",
  country: "India",
  website: null,
  is_verified: false,
}));

const rangeCalls: Array<[number, number]> = [];
const oppChain: any = (...args: any[]) => oppChain;
oppChain.then = (onfulfilled: any) =>
  Promise.resolve({ data: [{ organization_id: "org-1" }], error: null }).then(onfulfilled);
oppChain.eq = () => oppChain;
oppChain.or = () => oppChain;
oppChain.select = () => oppChain;

jest.mock("@/lib/supabase", () => ({
  isAdminConfigured: true,
}));
jest.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: jest.fn((table: string) => {
      if (table === "opportunities") return oppChain;
      const chain: any = (...args: any[]) => chain;
      chain.then = (onfulfilled: any) =>
        Promise.resolve({ data: ORG_ROWS, count: 88, error: null }).then(onfulfilled);
      chain.order = () => chain;
      chain.range = (a: number, b: number) => { rangeCalls.push([a, b]); return chain; };
      chain.select = () => chain;
      return chain;
    }),
  },
  isAdminConfigured: true,
}));

import { GET } from "@/app/api/organizations/route";

describe("GET /api/organizations pagination", () => {
  beforeEach(() => { rangeCalls.length = 0; jest.clearAllMocks(); });

  it("page=1&per_page=10 queries range (0,9) and returns page metadata", async () => {
    const { NextRequest } = require("next/server");
    const res = await GET(new NextRequest("http://localhost/api/organizations?per_page=10&page=1"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(rangeCalls).toEqual([[0, 9]]);
    expect(body.page).toBe(1);
    expect(body.per_page).toBe(10);
    expect(body.total).toBe(88);
    expect(body.total_pages).toBe(9);
    expect(body.organizations.length).toBe(10);
  });

  it("page=2&per_page=10 queries range (10,19) — distinct from page 1", async () => {
    const { NextRequest } = require("next/server");
    await GET(new NextRequest("http://localhost/api/organizations?per_page=10&page=2"));
    expect(rangeCalls).toEqual([[10, 19]]);
  });

  it("page=3&per_page=20 queries range (40,59)", async () => {
    const { NextRequest } = require("next/server");
    await GET(new NextRequest("http://localhost/api/organizations?per_page=20&page=3"));
    expect(rangeCalls).toEqual([[40, 59]]);
  });

  it("rejects per_page above 100 by capping at 100", async () => {
    const { NextRequest } = require("next/server");
    await GET(new NextRequest("http://localhost/api/organizations?per_page=500&page=1"));
    expect(rangeCalls).toEqual([[0, 99]]);
  });
});
