import { HealthMonitor } from "../src/telemetry/health";

describe("HealthMonitor", () => {
  let monitor: HealthMonitor;

  beforeEach(() => {
    monitor = new HealthMonitor();
  });

  describe("recordSuccess / recordFailure", () => {
    it("starts as unknown for providers with no data", () => {
      expect(monitor.getStatus("gemini")).toBe("unknown");
    });

    it("becomes healthy after successful requests", () => {
      for (let i = 0; i < 10; i++) {
        monitor.recordSuccess("gemini", 100);
      }
      const health = monitor.getHealth("gemini");
      expect(health.status).toBe("healthy");
      expect(health.successRate).toBe(1);
    });

    it("becomes degraded after some failures", () => {
      for (let i = 0; i < 10; i++) {
        monitor.recordSuccess("gemini", 100);
      }
      monitor.recordFailure("gemini", "ERROR");
      monitor.recordFailure("gemini", "ERROR");
      monitor.recordFailure("gemini", "ERROR");
      const health = monitor.getHealth("gemini");
      expect(health.status).toBe("degraded");
    });

    it("becomes unhealthy with many consecutive failures", () => {
      for (let i = 0; i < 10; i++) {
        monitor.recordFailure("gemini", "ERROR");
      }
      const health = monitor.getHealth("gemini");
      expect(health.status).toBe("unhealthy");
    });
  });

  describe("recordTimeout", () => {
    it("counts as a failure", () => {
      monitor.recordTimeout("gemini");
      const health = monitor.getHealth("gemini");
      expect(health.consecutiveFailures).toBe(1);
    });
  });

  describe("getAllHealth", () => {
    it("returns health for all providers", () => {
      const all = monitor.getAllHealth();
      expect(Object.keys(all)).toEqual([
        "gemini", "openai", "anthropic", "openrouter",
        "groq", "together", "deepseek", "ollama",
      ]);
    });
  });

  describe("isHealthy / isAvailable", () => {
    it("isAvailable returns true for healthy providers", () => {
      for (let i = 0; i < 10; i++) {
        monitor.recordSuccess("gemini", 100);
      }
      expect(monitor.isAvailable("gemini")).toBe(true);
    });

    it("isAvailable returns true for degraded providers", () => {
      for (let i = 0; i < 20; i++) {
        monitor.recordSuccess("gemini", 100);
      }
      monitor.recordFailure("gemini", "ERROR");
      monitor.recordFailure("gemini", "ERROR");
      monitor.recordFailure("gemini", "ERROR");
      expect(monitor.isAvailable("gemini")).toBe(true);
    });

    it("isHealthy returns false for degraded providers", () => {
      monitor.recordSuccess("gemini", 100);
      monitor.recordFailure("gemini", "ERROR");
      monitor.recordFailure("gemini", "ERROR");
      monitor.recordFailure("gemini", "ERROR");
      expect(monitor.isHealthy("gemini")).toBe(false);
    });
  });

  describe("getAggregateHealth", () => {
    it("counts healthy, degraded, unhealthy providers", () => {
      for (let i = 0; i < 10; i++) {
        monitor.recordSuccess("gemini", 100);
        monitor.recordSuccess("openai", 100);
        monitor.recordFailure("anthropic", "ERROR");
      }
      const agg = monitor.getAggregateHealth();
      expect(agg.total).toBe(8);
    });
  });

  describe("reset", () => {
    it("resets a single provider", () => {
      monitor.recordFailure("gemini", "ERROR");
      monitor.reset("gemini");
      expect(monitor.getStatus("gemini")).toBe("unknown");
    });

    it("resets all providers", () => {
      monitor.recordFailure("gemini", "ERROR");
      monitor.recordFailure("openai", "ERROR");
      monitor.resetAll();
      expect(monitor.getStatus("gemini")).toBe("unknown");
      expect(monitor.getStatus("openai")).toBe("unknown");
    });
  });
});
