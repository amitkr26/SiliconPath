import { CostTracker } from "../src/telemetry/cost";

describe("CostTracker", () => {
  let tracker: CostTracker;

  beforeEach(() => {
    tracker = new CostTracker();
  });

  describe("calculateCost", () => {
    it("returns 0 for no tokens", () => {
      const cost = tracker.calculateCost("gemini", "gemini-1.5-flash", 0, 0);
      expect(cost).toBe(0);
    });

    it("calculates cost for gemini-1.5-flash correctly", () => {
      const cost = tracker.calculateCost("gemini", "gemini-1.5-flash", 1_000_000, 1_000_000);
      expect(cost).toBe(0.375);
    });

    it("calculates cost for gpt-4o correctly", () => {
      const cost = tracker.calculateCost("openai", "gpt-4o", 1_000_000, 1_000_000);
      expect(cost).toBe(12.5);
    });

    it("uses wildcard rates when exact model not found", () => {
      const cost = tracker.calculateCost("groq", "some-model", 1_000_000, 1_000_000);
      expect(cost).toBe(0.8);
    });

    it("uses default rate when provider not found", () => {
      const cost = tracker.calculateCost("unknown" as any, "model", 1_000_000, 1_000_000);
      expect(cost).toBe(3);
    });
  });

  describe("recordCost / getTotalCost", () => {
    it("records and aggregates costs", () => {
      tracker.recordCost("gemini", "gemini-1.5-flash", 1000, 500);
      expect(tracker.getTotalCost()).toBeGreaterThan(0);
    });

    it("returns 0 when no records", () => {
      expect(tracker.getTotalCost()).toBe(0);
    });
  });

  describe("getCostByProvider", () => {
    it("groups costs by provider", () => {
      tracker.recordCost("gemini", "gemini-1.5-flash", 1000, 500);
      tracker.recordCost("openai", "gpt-4o", 1000, 500);
      const byProvider = tracker.getCostByProvider();
      expect(Object.keys(byProvider)).toContain("gemini");
      expect(Object.keys(byProvider)).toContain("openai");
    });
  });

  describe("getCostByFeature", () => {
    it("groups costs by feature", () => {
      tracker.recordCost("gemini", "gemini-1.5-flash", 1000, 500, "summarize");
      tracker.recordCost("gemini", "gemini-1.5-flash", 1000, 500, "chat");
      const byFeature = tracker.getCostByFeature();
      expect(Object.keys(byFeature)).toContain("summarize");
      expect(Object.keys(byFeature)).toContain("chat");
    });
  });

  describe("getCostByDay", () => {
    it("returns costs by day", () => {
      tracker.recordCost("gemini", "gemini-1.5-flash", 1000, 500);
      const byDay = tracker.getCostByDay(7);
      const today = new Date().toISOString().slice(0, 10);
      expect(byDay[today]).toBeDefined();
    });
  });

  describe("getProjectedCost", () => {
    it("returns 0 when no records", () => {
      expect(tracker.getProjectedCost(30)).toBe(0);
    });

    it("returns a positive projection with records", () => {
      tracker.recordCost("gemini", "gemini-1.5-flash", 1_000_000, 500_000);
      const projected = tracker.getProjectedCost(30);
      expect(projected).toBeGreaterThan(0);
    });
  });

  describe("reset", () => {
    it("clears all records", () => {
      tracker.recordCost("gemini", "gemini-1.5-flash", 1000, 500);
      tracker.reset();
      expect(tracker.getTotalCost()).toBe(0);
    });
  });
});
