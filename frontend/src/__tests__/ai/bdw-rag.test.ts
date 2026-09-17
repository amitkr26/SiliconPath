/**
 * BDW Career Intelligence RAG System — Unit Tests
 *
 * Tests for intent detection, search filter extraction, domain scoring,
 * system prompt generation, and source citation building.
 */

import {
  detectDomain,
  extractSearchFilters,
  buildBDWSystemPrompt,
  buildSourceCitations,
  type RAGContext,
} from "@/lib/ai/bdw-rag";

// ─── Domain Detection Tests ────────────────────────────────────────────────

describe("BDW RAG — detectDomain", () => {
  test("detects opportunity_search intent", () => {
    expect(detectDomain("What JRF positions are available?")).toBe("opportunity_search");
    expect(detectDomain("Any PhD openings in ISRO?")).toBe("opportunity_search");
    expect(detectDomain("Show me internship opportunities")).toBe("opportunity_search");
    expect(detectDomain("DRDO recruitment 2026")).toBe("opportunity_search");
    expect(detectDomain("S Fellowship in VLSI")).toBe("opportunity_search");
  });

  test("detects organization_search intent", () => {
    expect(detectDomain("Tell me about ISRO")).toBe("organization_search");
    expect(detectDomain("Which IITs have VLSI labs?")).toBe("organization_search");
    expect(detectDomain("List DRDO laboratories")).toBe("organization_search");
  });

  test("detects eligibility_check intent", () => {
    expect(detectDomain("Am I eligible for JRF?")).toBe("eligibility_check");
    expect(detectDomain("What are the qualification requirements?")).toBe("eligibility_check");
    expect(detectDomain("Age limit for GATE")).toBe("eligibility_check");
  });

  test("detects career_planning intent", () => {
    expect(detectDomain("How to become a VLSI engineer?")).toBe("career_planning");
    expect(detectDomain("Career path in semiconductors")).toBe("career_planning");
    expect(detectDomain("Roadmap for embedded systems")).toBe("career_planning");
    expect(detectDomain("How to enter chip design")).toBe("career_planning");
  });

  test("detects skill_gap intent", () => {
    expect(detectDomain("What tools should I learn?")).toBe("skill_gap");
    expect(detectDomain("What EDA tools are required?")).toBe("skill_gap");
    expect(detectDomain("Missing skills gap analysis")).toBe("skill_gap");
  });

  test("detects news_update intent", () => {
    expect(detectDomain("Latest ISRO news")).toBe("news_update");
    expect(detectDomain("Recent announcements")).toBe("news_update");
    expect(detectDomain("Current semiconductor policy")).toBe("news_update");
  });

  test("returns general for ambiguous queries", () => {
    expect(detectDomain("Hello")).toBe("general");
    expect(detectDomain("Help me")).toBe("general");
    expect(detectDomain("What is this?")).toBe("general");
  });

  test("handles multiple domain signals — picks highest score", () => {
    // Both opportunity_search and eligibility_check keywords present
    const result = detectDomain("JRF eligibility for B.Tech students");
    expect(["opportunity_search", "eligibility_check"]).toContain(result);
  });
});

// ─── Search Filter Extraction Tests ────────────────────────────────────────

describe("BDW RAG — extractSearchFilters", () => {
  test("extracts category filter", () => {
    expect(extractSearchFilters("JRF positions in VLSI")).toEqual(
      expect.objectContaining({ category: "jrf" })
    );
    expect(extractSearchFilters("PhD openings at IIT")).toEqual(
      expect.objectContaining({ category: "phd" })
    );
    expect(extractSearchFilters("internship opportunities")).toEqual(
      expect.objectContaining({ category: "internship" })
    );
    expect(extractSearchFilters("SRF at DRDO")).toEqual(
      expect.objectContaining({ category: "srf" })
    );
    expect(extractSearchFilters("government jobs")).toEqual(
      expect.objectContaining({ category: "government" })
    );
  });

  test("extracts field filter", () => {
    expect(extractSearchFilters("VLSI design positions")).toEqual(
      expect.objectContaining({ field: "vlsi" })
    );
    expect(extractSearchFilters("embedded systems engineer")).toEqual(
      expect.objectContaining({ field: "embedded" })
    );
    expect(extractSearchFilters("semiconductor fabrication")).toEqual(
      expect.objectContaining({ field: "semiconductor" })
    );
  });

  test("extracts location filter", () => {
    expect(extractSearchFilters("Jobs in Bengaluru")).toEqual(
      expect.objectContaining({ location: "Bengaluru" })
    );
    expect(extractSearchFilters("Hyderabad openings")).toEqual(
      expect.objectContaining({ location: "Hyderabad" })
    );
    expect(extractSearchFilters("remote positions")).toEqual(
      expect.objectContaining({ location: "Remote" })
    );
  });

  test("extracts eligibility filter", () => {
    expect(extractSearchFilters("M.Tech required")).toEqual(
      expect.objectContaining({ eligibility: "M.Tech" })
    );
    expect(extractSearchFilters("B.Tech students eligible")).toEqual(
      expect.objectContaining({ eligibility: "B.Tech" })
    );
    expect(extractSearchFilters("PhD preferred")).toEqual(
      expect.objectContaining({ eligibility: "PhD" })
    );
  });

  test("extracts free-text search terms when no category/field", () => {
    const filters = extractSearchFilters("digital electronics opportunities");
    expect(filters.search).toBeDefined();
    expect(filters.search).toContain("digital");
    expect(filters.search).toContain("electronics");
  });

  test("removes stopwords from search terms", () => {
    const filters = extractSearchFilters("what are the electronics opportunities");
    expect(filters.search).toBeDefined();
    // "what", "are", "the" should be removed
    expect(filters.search).not.toContain("what");
    expect(filters.search).not.toContain("are");
    expect(filters.search).not.toContain("the");
  });

  test("returns empty filters for non-informative queries", () => {
    const filters = extractSearchFilters("hello");
    expect(filters.category).toBeUndefined();
    expect(filters.field).toBeUndefined();
    expect(filters.location).toBeUndefined();
    expect(filters.eligibility).toBeUndefined();
  });
});

// ─── System Prompt Tests ───────────────────────────────────────────────────

describe("BDW RAG — buildBDWSystemPrompt", () => {
  const mockContext: RAGContext = {
    domain: "opportunity_search",
    opportunities: [
      {
        id: "opp-1",
        title: "JRF in VLSI Design",
        organization: "IIT Madras",
        organization_id: "org-1",
        category: "JRF",
        location: "Chennai",
        deadline: "2026-12-31",
        stipend: "31000",
        eligibility: "M.Tech in ECE",
        description: "Research position in VLSI design",
        apply_url: "https://iitm.ac.in/apply",
        source_url: null,
        slug: "jrf-vlsi-iitm",
        verification_status: "verified",
      },
    ],
    organizations: [],
    news: [],
    resources: [],
    searchFilters: { category: "jrf", field: "vlsi" },
    sources: [{ type: "opportunity", id: "opp-1", title: "JRF in VLSI Design", url: "https://iitm.ac.in/apply" }],
  };

  test("includes BDW AI identity", () => {
    const prompt = buildBDWSystemPrompt("test query", mockContext);
    expect(prompt).toContain("BDW AI");
    expect(prompt).toContain("BerojgarDegreeWala");
  });

  test("includes RETRIEVED_DATA section", () => {
    const prompt = buildBDWSystemPrompt("test query", mockContext);
    expect(prompt).toContain("RETRIEVED_DATA");
  });

  test("includes opportunity data in context", () => {
    const prompt = buildBDWSystemPrompt("test query", mockContext);
    expect(prompt).toContain("JRF in VLSI Design");
    expect(prompt).toContain("IIT Madras");
    expect(prompt).toContain("Chennai");
    expect(prompt).toContain("https://iitm.ac.in/apply");
  });

  test("includes domain-specific guidance", () => {
    const prompt = buildBDWSystemPrompt("test query", mockContext);
    expect(prompt).toContain("Opportunity Search");
  });

  test("includes user profile when provided", () => {
    const profile = { degree: "B.Tech", branch: "ECE", skills: ["Verilog", "VLSI"] };
    const prompt = buildBDWSystemPrompt("test query", mockContext, profile);
    expect(prompt).toContain("B.Tech");
    expect(prompt).toContain("ECE");
    expect(prompt).toContain("Verilog");
  });

  test("does not include user profile when not provided", () => {
    const prompt = buildBDWSystemPrompt("test query", mockContext);
    expect(prompt).not.toContain("USER PROFILE CONTEXT");
  });

  test("includes hard rules", () => {
    const prompt = buildBDWSystemPrompt("test query", mockContext);
    expect(prompt).toContain("HARD RULES");
    expect(prompt).toContain("NEVER invent");
    expect(prompt).toContain("ONLY use information from RETRIEVED_DATA");
  });

  test("handles empty context gracefully", () => {
    const emptyContext: RAGContext = {
      domain: "general",
      opportunities: [],
      organizations: [],
      news: [],
      resources: [],
      searchFilters: {},
      sources: [],
    };
    const prompt = buildBDWSystemPrompt("test query", emptyContext);
    expect(prompt).toContain("No matching records found");
  });

  test("includes all domain guidance types", () => {
    const domains: RAGContext["domain"][] = [
      "opportunity_search", "organization_search", "eligibility_check",
      "career_planning", "skill_gap", "news_update", "general",
    ];
    for (const domain of domains) {
      const ctx = { ...mockContext, domain };
      const prompt = buildBDWSystemPrompt("test query", ctx);
      expect(prompt).toContain("BDW AI");
      expect(prompt).toContain("RETRIEVED_DATA");
    }
  });
});

// ─── Source Citation Tests ─────────────────────────────────────────────────

describe("BDW RAG — buildSourceCitations", () => {
  test("builds citations from all entity types", () => {
    const context: RAGContext = {
      domain: "opportunity_search",
      opportunities: [
        { id: "1", title: "JRF Position", organization: "IIT", organization_id: null, category: "JRF", location: null, deadline: null, stipend: null, eligibility: null, description: null, apply_url: "https://apply.com", source_url: null, slug: null, verification_status: null },
      ],
      organizations: [
        { id: "2", name: "IIT Madras", slug: "iit-madras", type: "academic", location: null, website: "https://iitm.ac.in", logo_url: null, description: null, opportunity_count: 5 },
      ],
      news: [
        { id: "3", title: "ISRO Announcement", summary: null, published_at: null, source_url: "https://isro.gov.in/news", slug: null, tags: null },
      ],
      resources: [],
      searchFilters: {},
      sources: [
        { type: "opportunity", id: "1", title: "JRF Position", url: "https://apply.com" },
        { type: "organization", id: "2", title: "IIT Madras", url: "https://iitm.ac.in" },
        { type: "news", id: "3", title: "ISRO Announcement", url: "https://isro.gov.in/news" },
      ],
    };

    const citations = buildSourceCitations(context);
    expect(citations).toHaveLength(3);
    expect(citations[0].type).toBe("opportunity");
    expect(citations[1].type).toBe("organization");
    expect(citations[2].type).toBe("news");
  });

  test("filters out citations without URLs or titles", () => {
    const context: RAGContext = {
      domain: "general",
      opportunities: [],
      organizations: [],
      news: [],
      resources: [],
      searchFilters: {},
      sources: [
        { type: "opportunity", id: "1", title: "Has URL", url: "https://example.com" },
        { type: "opportunity", id: "2", title: "Title Only", url: null },
        { type: "opportunity", id: "3", title: "", url: "" },
      ],
    };

    const citations = buildSourceCitations(context);
    // Keeps items with URL or with a title (title-only is useful context)
    expect(citations.length).toBeGreaterThanOrEqual(1);
    expect(citations[0].url).toBe("https://example.com");
  });

  test("returns empty for no sources", () => {
    const context: RAGContext = {
      domain: "general",
      opportunities: [],
      organizations: [],
      news: [],
      resources: [],
      searchFilters: {},
      sources: [],
    };

    const citations = buildSourceCitations(context);
    expect(citations).toHaveLength(0);
  });
});
