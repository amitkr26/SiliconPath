import { UsageTracker } from "../src/telemetry/usage";

describe("UsageTracker", () => {
  let tracker: UsageTracker;

  beforeEach(() => {
    tracker = new UsageTracker();
  });

  describe("recordUsage / getTotalTokens", () => {
    it("tracks total tokens", () => {
      tracker.recordUsage("gemini", "gemini-2.0-flash", 100, 200);
      const total = tracker.getTotalTokens();
      expect(total.input).toBe(100);
      expect(total.output).toBe(200);
      expect(total.total).toBe(300);
    });

    it("aggregates multiple records", () => {
      tracker.recordUsage("gemini", "gemini-2.0-flash", 50, 100);
      tracker.recordUsage("gemini", "gemini-2.0-flash", 50, 100);
      const total = tracker.getTotalTokens();
      expect(total.input).toBe(100);
      expect(total.output).toBe(200);
    });

    it("returns zeros when no records", () => {
      const total = tracker.getTotalTokens();
      expect(total.input).toBe(0);
      expect(total.output).toBe(0);
    });
  });

  describe("getTokensByProvider", () => {
    it("groups tokens by provider", () => {
      tracker.recordUsage("gemini", "gemini-2.0-flash", 100, 200);
      tracker.recordUsage("openai", "gpt-4o", 300, 400);
      const byProvider = tracker.getTokensByProvider();
      expect(byProvider["gemini"]?.input).toBe(100);
      expect(byProvider["gemini"]?.output).toBe(200);
      expect(byProvider["openai"]?.input).toBe(300);
    });
  });

  describe("getTokensByFeature", () => {
    it("groups by feature", () => {
      tracker.recordUsage("gemini", "gemini-2.0-flash", 100, 200, "summarize");
      tracker.recordUsage("gemini", "gemini-2.0-flash", 300, 400, "chat");
      const byFeature = tracker.getTokensByFeature();
      expect(byFeature["summarize"]?.input).toBe(100);
      expect(byFeature["chat"]?.input).toBe(300);
    });
  });

  describe("getTokensByUser", () => {
    it("groups by user", () => {
      tracker.recordUsage("gemini", "gemini-2.0-flash", 100, 200, "chat", "user1");
      tracker.recordUsage("gemini", "gemini-2.0-flash", 300, 400, "chat", "user2");
      const byUser = tracker.getTokensByUser();
      expect(byUser["user1"]?.input).toBe(100);
      expect(byUser["user2"]?.input).toBe(300);
    });
  });

  describe("getProviderRanking", () => {
    it("returns providers sorted by usage", () => {
      tracker.recordUsage("gemini", "gemini-2.0-flash", 1000, 2000);
      tracker.recordUsage("openai", "gpt-4o", 100, 200);
      const ranking = tracker.getProviderRanking();
      expect(ranking[0]?.provider).toBe("gemini");
      expect(ranking[1]?.provider).toBe("openai");
    });
  });

  describe("reset", () => {
    it("clears all records", () => {
      tracker.recordUsage("gemini", "gemini-2.0-flash", 100, 200);
      tracker.reset();
      expect(tracker.getTotalTokens().total).toBe(0);
    });
  });
});
