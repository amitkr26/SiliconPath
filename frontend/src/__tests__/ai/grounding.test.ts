/**
 * QA audit P0 — AI assistant grounding.
 * a) JRF + VLSI query retrieves records
 * b) Response contains real retrieved opportunity titles
 * c) Response URLs exist in the retrieved records
 * d) Empty retrieval → explicit no-results fallback
 * e) Malicious prompt cannot make the assistant invent an official domain
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

const RECORDS = [
  {
    id: "o1",
    title: "JRF Position in VLSI Design at C-DAC",
    organization: "C-DAC",
    category: "Research",
    location: "Bengaluru",
    deadline: "2026-09-30",
    stipend: "₹37,000/month",
    eligibility: "M.Tech in VLSI",
    apply_url: "https://www.cdac.in/jrf-vlsi-2026",
    source_url: "https://www.cdac.in/jobs",
    description: "Junior Research Fellow for VLSI physical design project.",
    slug: "jrf-vlsi-cdac",
  },
  {
    id: "o2",
    title: "Research Associate — ASIC Design",
    organization: "IIT Madras",
    category: "Research",
    location: "Chennai",
    deadline: "2026-10-15",
    stipend: "₹42,000/month",
    eligibility: "PhD or M.Tech",
    apply_url: "https://iitm.ac.in/rasic-2026",
    source_url: "https://iitm.ac.in/careers",
    description: "Work on ASIC design and verification.",
    slug: "ra-asic-iitm",
  },
];

function makeSupabaseMock() {
  const chain: any = (..._args: any[]) => chain;
  chain.then = (_onfulfilled: any, _onrejected?: any) => Promise.resolve({ data: [], error: null }).then(_onfulfilled);
  chain.eq = () => chain;
  chain.neq = () => chain;
  chain.or = () => chain;
  chain.order = () => chain;
  chain.ilike = () => chain;
  chain.limit = () => chain;
  chain.select = () => chain;
  chain.range = () => chain;
  chain.contains = () => chain;

  const mock: any = { supabaseAdmin: null, isAdminConfigured: true };
  mock.supabaseAdmin = {
    from: (table: string) => {
      if (table === "opportunities") {
        return { ...chain, or: () => ({ ...chain, then: (fn: any) => Promise.resolve({ data: RECORDS, error: null }).then(fn) }) };
      }
      if (table === "news_articles") {
        return { ...chain, then: (fn: any) => Promise.resolve({ data: [], error: null }).then(fn) };
      }
      return chain;
    },
  };
  return mock;
}

// Route under test imports @/lib/ai/providers (gateway) and @/lib/supabase.
jest.mock("@/lib/supabase", () => {
  const real = jest.requireActual("@/lib/ai/grounding");
  return {
    isAdminConfigured: true,
    supabaseAdmin: {
      from: (table: string) => {
        const chain: any = (..._a: any[]) => chain;
        chain.then = (fn: any) => Promise.resolve({ data: table === "opportunities" ? RECORDS : [], error: null }).then(fn);
        chain.eq = () => chain; chain.neq = () => chain; chain.or = () => chain;
        chain.order = () => chain; chain.ilike = () => chain; chain.limit = () => chain;
        chain.select = () => chain; chain.range = () => chain; chain.contains = () => chain;
        return chain;
      },
    },
  };
});

import { POST } from "@/app/api/ai/chat/route";
import {
  buildGroundedSystemPrompt,
  buildRecordListing,
  extractSearchTerms,
  isOpportunityIntent,
  retrieveGrounding,
  sanitizeAnswerUrls,
  filterRelevantOpportunities,
  NO_MATCH_FALLBACK,
} from "@/lib/ai/grounding";

// Mock the AI gateway so tests never hit a real provider.
const mockCallAI = jest.fn();
jest.mock("@/lib/ai/providers", () => ({
  callAI: (...args: any[]) => mockCallAI(...args),
  callAIAdvanced: jest.fn(),
}));

function req(body: any) {
  const MockNextRequest = (jest.requireMock("next/server") as any).NextRequest;
  return new MockNextRequest("http://localhost/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("P0 grounding — retrieval", () => {
  test("a) JRF + VLSI query extracts retrieval terms", () => {
    const terms = extractSearchTerms("What are the latest JRF opportunities in VLSI design in India?");
    expect(terms).toContain("jrf");
    expect(terms).toContain("vlsi");
    expect(terms).toContain("design");
  });

  test("b) grounded prompt contains real retrieved opportunity titles", () => {
    const prompt = buildGroundedSystemPrompt("JRF in VLSI", RECORDS, [], "base");
    expect(prompt).toContain("JRF Position in VLSI Design at C-DAC");
    expect(prompt).toContain("https://www.cdac.in/jrf-vlsi-2026");
    expect(prompt).toContain("https://iitm.ac.in/rasic-2026");
  });

  test("c) only URLs from retrieved records survive the answer", () => {
    const allowed = new Set(["https://www.cdac.in/jrf-vlsi-2026"]);
    const dirty =
      "Apply at https://www.cdac.in/jrf-vlsi-2026 for details. The official portal is https://www.iit.ac.in/apply.";
    const clean = sanitizeAnswerUrls(dirty, allowed);
    expect(clean).toContain("https://www.cdac.in/jrf-vlsi-2026");
    expect(clean).not.toContain("www.iit.ac.in");
    expect(clean).not.toContain("iit.ac.in");
  });

  test("e) no URL may be invented even if the model suggests one", () => {
    const allowed = new Set(["https://cdac.in/jobs"]);
    const hallucinated =
      "Visit https://cdac.in/jobs or https://www.rac.gov.in/apply for official notification.";
    const clean = sanitizeAnswerUrls(hallucinated, allowed);
    expect(clean).toContain("https://cdac.in/jobs");
    expect(clean).not.toContain("rac.gov.in");
  });
});

describe("P0 grounding — chat route", () => {
  beforeEach(() => mockCallAI.mockReset());

  test("d) zero relevant records → explicit no-results fallback, LLM not called", async () => {
    // Make retrieval return nothing by pointing the mock at empty data
    const emptyMock = jest.requireMock("@/lib/supabase") as any;
    const origFrom = emptyMock.supabaseAdmin.from;
    emptyMock.supabaseAdmin.from = (table: string) => {
      const chain: any = (..._a: any[]) => chain;
      chain.then = (fn: any) => Promise.resolve({ data: [], error: null }).then(fn);
      chain.eq = () => chain; chain.neq = () => chain; chain.or = () => chain;
      chain.order = () => chain; chain.ilike = () => chain; chain.limit = () => chain;
      chain.select = () => chain; chain.range = () => chain; chain.contains = () => chain;
      return chain;
    };

    const res = await POST(req({ messages: [{ role: "user", content: "Are there any JRF vacancies in quantum banana farming?" }] }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.message).toContain("couldn't find a matching opportunity");
    expect(mockCallAI).not.toHaveBeenCalled();

    emptyMock.supabaseAdmin.from = origFrom;
  });

  test("returns grounded answer using real record titles and URLs when records exist", async () => {
    mockCallAI.mockResolvedValue({
      text: "The JRF Position in VLSI Design at C-DAC in Bengaluru has a deadline of 2026-09-30. Apply: https://www.cdac.in/jrf-vlsi-2026",
      provider: "groq",
      model: "test-model",
    });

    const res = await POST(req({ messages: [{ role: "user", content: "Latest JRF opportunities in VLSI design in India?" }] }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.message).toContain("JRF Position in VLSI Design at C-DAC");
    expect(body.message).toContain("https://www.cdac.in/jrf-vlsi-2026");
    expect(body.grounded).toBe(true);
    // callAI was invoked with a grounded system prompt
    const [promptArg, systemPrompt] = mockCallAI.mock.calls[0];
    expect(systemPrompt).toContain("RETRIEVED OPPORTUNITIES");
    expect(systemPrompt).toContain("JRF Position in VLSI Design at C-DAC");
    expect(promptArg).toBe("Latest JRF opportunities in VLSI design in India?");
  });

  test("general (non-opportunity) question still gets LLM answer without records", async () => {
    mockCallAI.mockResolvedValue({ text: "JRF stands for Junior Research Fellow.", provider: "groq", model: "m" });
    const res = await POST(req({ messages: [{ role: "user", content: "What does JRF stand for?" }] }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.message).toContain("Junior Research Fellow");
    expect(mockCallAI).toHaveBeenCalled();
  });

  test("missing messages → 400", async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });
});

describe("P0 grounding — intent", () => {
  test("opportunity intent detection", () => {
    expect(isOpportunityIntent("latest JRF openings")).toBe(true);
    expect(isOpportunityIntent("internship at Intel")).toBe(true);
    expect(isOpportunityIntent("what is a stipend?")).toBe(true);
    expect(isOpportunityIntent("how are you")).toBe(false);
  });
});

describe("P0 grounding — relevance filter (no-match safety)", () => {
  const rows = [
    { id: "1", title: "DRDO Scientist 'B' Recruitment", category: "government", organization: "DRDO" },
    { id: "2", title: "Embedded Systems Internship at Intel", category: "internship", organization: "Intel" },
    // Fuzzy row: matches only in description, none of the terms in primary fields
    { id: "3", title: "Test Development Engineer", category: "jrf", organization: null, description: "requires knowledge of embedded systems and semiconductor design" },
  ] as any[];

  test("keeps rows with a primary-field match (title/category/org)", () => {
    const kept = filterRelevantOpportunities(["drdo"], rows);
    expect(kept.map((r) => r.id)).toEqual(["1"]);
  });

  test("keeps rows with two distinct terms anywhere (strong fuzzy match)", () => {
    const kept = filterRelevantOpportunities(["embedded", "systems"], rows);
    expect(kept.map((r) => r.id).sort()).toEqual(["2", "3"]);
  });

  test("drops description-only single-term matches (unrelated query)", () => {
    const kept = filterRelevantOpportunities(["zulu", "antarctica"], rows);
    expect(kept).toEqual([]);
  });
});

test("fallback message is explicit about the database", () => {
  expect(NO_MATCH_FALLBACK).toContain("BerojgarDegreeWala's current database");
});

// ---------------------------------------------------------------------------
// AI-QUALITY-2026-08-13 regression: context selection + no-match parroting.
// Prod evidence: "DRDO JRF" and "JRF VLSI" returned grounded:true but the
// model echo of the fallback sentence — the top-8 records in context were all
// category="jrf" flood rows (New Careers & Internships, …) because a single
// OR'd window plus unweighted scoring drowned the real DRDO/VLSI rows.
// ---------------------------------------------------------------------------

/** db mock returning the same rows for every opportunities query. */
function dbReturning(rows: any[]): any {
  const chain: any = (..._a: any[]) => chain;
  chain.then = (fn: any) => Promise.resolve({ data: rows, error: null }).then(fn);
  chain.eq = () => chain; chain.neq = () => chain; chain.or = () => chain;
  chain.order = () => chain; chain.ilike = () => chain; chain.limit = () => chain;
  chain.select = () => chain;
  return {
    from: (table: string) =>
      table === "opportunities"
        ? chain
        : { ...chain, then: (fn: any) => Promise.resolve({ data: [], error: null }).then(fn) },
  };
}

describe("AI-QUALITY regression — context selection", () => {
  test("1) real DRDO row outranks category=jrf flood rows for 'DRDO JRF'", async () => {
    const db = dbReturning([
      { id: "f1", title: "New Careers & Internships", category: "jrf", organization: null },
      { id: "f2", title: "Software Engineering Opportunities", category: "jrf", organization: null },
      { id: "s1", title: "DRDO JRF in VLSI Design", category: "jrf", organization: "DRDO" },
    ]);
    const { opportunities } = await retrieveGrounding(db, "DRDO JRF");
    expect(opportunities[0]).toBeDefined();
    expect(opportunities[0].id).toBe("s1");
  });

  test("5) primary-field match ranks above description-only match at equal intent", async () => {
    const db = dbReturning([
      { id: "a1", title: "Semiconductor Process Engineer", category: "jrf", organization: null },
      {
        id: "b1",
        title: "New Careers",
        category: "jrf",
        organization: null,
        description: "semiconductor semiconductor semiconductor roles at a fab",
      },
    ]);
    const { opportunities } = await retrieveGrounding(db, "semiconductor jrf");
    expect(opportunities.map((o) => o.id)).toEqual(["a1", "b1"]);
  });
});

describe("AI-QUALITY regression — no-match parroting guard", () => {
  beforeEach(() => mockCallAI.mockReset());

  test("2) model echoing the fallback sentence with records in context → records listed, no false 'couldn't find'", async () => {
    mockCallAI.mockResolvedValue({
      text: "I couldn't find a matching opportunity in BerojgarDegreeWala's current database.",
      provider: "groq",
      model: "test-model",
    });
    const res = await POST(req({ messages: [{ role: "user", content: "Latest JRF opportunities in VLSI design in India?" }] }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.message).toContain("JRF Position in VLSI Design at C-DAC");
    expect(body.message).toContain("https://www.cdac.in/jrf-vlsi-2026");
    expect(body.message).not.toContain("couldn't find");
    expect(body.grounded).toBe(true);
  });

  test("3) same fallback text with NO records retrieved passes through untouched", async () => {
    mockCallAI.mockResolvedValue({
      text: "I couldn't find a matching opportunity in BerojgarDegreeWala's current database.",
      provider: "groq",
      model: "test-model",
    });
    const emptyMock = jest.requireMock("@/lib/supabase") as any;
    const origFrom = emptyMock.supabaseAdmin.from;
    emptyMock.supabaseAdmin.from = (table: string) => {
      const chain: any = (..._a: any[]) => chain;
      chain.then = (fn: any) => Promise.resolve({ data: [], error: null }).then(fn);
      chain.eq = () => chain; chain.neq = () => chain; chain.or = () => chain;
      chain.order = () => chain; chain.ilike = () => chain; chain.limit = () => chain;
      chain.select = () => chain; chain.range = () => chain; chain.contains = () => chain;
      return chain;
    };
    const res = await POST(req({ messages: [{ role: "user", content: "Tell me about quantum banana farming" }] }));
    const body = await res.json();
    expect(body.message).toContain("couldn't find a matching opportunity");
    expect(body.grounded).toBe(false);
    emptyMock.supabaseAdmin.from = origFrom;
  });

  test("4) deterministic listing contains only retrieved titles and URLs", () => {
    const listing = buildRecordListing(RECORDS);
    expect(listing).toContain("JRF Position in VLSI Design at C-DAC");
    expect(listing).toContain("https://www.cdac.in/jrf-vlsi-2026");
    expect(listing).toContain("https://iitm.ac.in/rasic-2026");
    // every URL in the listing survives the sanitizer (allowed set = records)
    const clean = sanitizeAnswerUrls(listing, new Set(RECORDS.map((r) => r.apply_url)));
    expect(clean).toBe(listing);
  });
});
