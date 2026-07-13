import { TelemetryCollector } from "../src/telemetry";
import type { TelemetryEvent } from "../src/types/telemetry";

function makeEvent(overrides?: Partial<TelemetryEvent>): TelemetryEvent {
  return {
    id: "evt-1",
    timestamp: Date.now(),
    provider: "gemini",
    model: "gemini-2.0-flash",
    mode: "chat",
    inputTokens: 10,
    outputTokens: 20,
    latencyMs: 100,
    cost: 0.001,
    success: true,
    cached: false,
    retries: 0,
    fallbackChain: [],
    ...overrides,
  };
}

describe("TelemetryCollector", () => {
  let collector: TelemetryCollector;

  beforeEach(() => {
    collector = new TelemetryCollector();
  });

  describe("record", () => {
    it("stores events", () => {
      collector.record(makeEvent());
      expect(collector.getEventCount()).toBe(1);
    });

    it("culls old events when exceeding max", () => {
      for (let i = 0; i < 10_100; i++) {
        collector.record(makeEvent({ id: `evt-${i}` }));
      }
      expect(collector.getEventCount()).toBe(10_000);
    });
  });

  describe("getEvents", () => {
    it("returns all events without filters", () => {
      collector.record(makeEvent({ provider: "gemini" }));
      collector.record(makeEvent({ provider: "openai" }));
      expect(collector.getEvents()).toHaveLength(2);
    });

    it("filters by provider", () => {
      collector.record(makeEvent({ provider: "gemini" }));
      collector.record(makeEvent({ provider: "openai" }));
      const geminiEvents = collector.getEvents({ provider: "gemini" });
      expect(geminiEvents).toHaveLength(1);
      expect(geminiEvents[0].provider).toBe("gemini");
    });

    it("filters by success", () => {
      collector.record(makeEvent({ success: true }));
      collector.record(makeEvent({ success: false }));
      expect(collector.getEvents({ success: true })).toHaveLength(1);
    });
  });

  describe("getEventsInRange", () => {
    it("returns events within time range", () => {
      const t1 = 1000;
      const t2 = 2000;
      const t3 = 3000;
      collector.record(makeEvent({ timestamp: t1 }));
      collector.record(makeEvent({ timestamp: t2 }));
      collector.record(makeEvent({ timestamp: t3 }));
      const range = collector.getEventsInRange(1500, 2500);
      expect(range).toHaveLength(1);
      expect(range[0].timestamp).toBe(t2);
    });
  });

  describe("getRecentEvents", () => {
    it("returns the last N events", () => {
      for (let i = 0; i < 10; i++) {
        collector.record(makeEvent({ id: `evt-${i}` }));
      }
      const recent = collector.getRecentEvents(3);
      expect(recent).toHaveLength(3);
    });

    it("returns empty for count <= 0", () => {
      expect(collector.getRecentEvents(0)).toEqual([]);
      expect(collector.getRecentEvents(-1)).toEqual([]);
    });
  });

  describe("clear and flush", () => {
    it("clears all events", () => {
      collector.record(makeEvent());
      collector.clear();
      expect(collector.getEventCount()).toBe(0);
    });

    it("flush does not throw", async () => {
      await expect(collector.flush()).resolves.toBeUndefined();
    });
  });
});
