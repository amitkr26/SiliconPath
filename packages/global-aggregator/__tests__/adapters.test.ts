import { AdapterFactory, BaseAdapter, GreenhouseAdapter } from "../src/adapters";
import type { SourceConfig } from "../src/types";

describe("BaseAdapter", () => {
  class TestAdapter extends BaseAdapter {
    readonly type = "custom" as const;

    async scrape(source: SourceConfig): Promise<{ title: string; organization: string }[]> {
      return [
        {
          title: "Test Job",
          organization: "Test Corp",
        },
      ];
    }
  }

  it("scrapes via the scrape method", async () => {
    const config: SourceConfig = {
      id: "test", name: "Test", category: "other", country: "US", priority: 1,
      adapter: "custom", health: "healthy", status: "active",
      retryStrategy: { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 30000, backoffMultiplier: 2, retryableErrors: [] },
      scheduling: { interval: "1h", batchId: 1, priority: 1, maxConcurrent: 1 },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000, requestsPerDay: 10000, concurrency: 1 },
      authentication: { type: "none" },
      validationRules: [], owner: "test", notes: "",
    };
    const adapter = new TestAdapter();
    const items = await adapter.scrape(config);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Test Job");
  });

  it("canHandle checks adapter type", () => {
    const adapter = new TestAdapter();
    const matchingConfig: SourceConfig = {
      id: "test", name: "Test", category: "other", country: "US", priority: 1,
      adapter: "custom", health: "healthy", status: "active",
      retryStrategy: { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 30000, backoffMultiplier: 2, retryableErrors: [] },
      scheduling: { interval: "1h", batchId: 1, priority: 1, maxConcurrent: 1 },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000, requestsPerDay: 10000, concurrency: 1 },
      authentication: { type: "none" },
      validationRules: [], owner: "test", notes: "",
    };
    const nonMatchingConfig = { ...matchingConfig, adapter: "greenhouse" as const };
    expect(adapter.canHandle(matchingConfig)).toBe(true);
    expect(adapter.canHandle(nonMatchingConfig)).toBe(false);
  });

  it("sanitizes text", () => {
    const adapter = new TestAdapter();
    expect(adapter["sanitizeText"]("  hello  ")).toBe("hello");
    expect(adapter["sanitizeText"](null)).toBe("");
    expect(adapter["sanitizeText"](undefined)).toBe("");
  });
});

describe("AdapterFactory", () => {
  const factory = new AdapterFactory();

  it("creates a greenhouse adapter", () => {
    const adapter = factory.get("greenhouse");
    expect(adapter).toBeInstanceOf(GreenhouseAdapter);
  });

  it("returns null for unknown type", () => {
    expect(factory.get("unknown-adapter" as never)).toBeNull();
  });

  it("returns adapter for source config", () => {
    const config: SourceConfig = {
      id: "test", name: "Test", category: "other", country: "US", priority: 1,
      adapter: "lever", health: "healthy", status: "active",
      retryStrategy: { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 30000, backoffMultiplier: 2, retryableErrors: [] },
      scheduling: { interval: "1h", batchId: 1, priority: 1, maxConcurrent: 1 },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000, requestsPerDay: 10000, concurrency: 1 },
      authentication: { type: "none" },
      validationRules: [], owner: "test", notes: "",
    };
    expect(factory.getForSource(config)).not.toBeNull();
  });

  it("returns all supported types", () => {
    const types = factory.getSupportedTypes();
    expect(types).toContain("greenhouse");
    expect(types).toContain("lever");
    expect(types).toContain("rss");
  });

  it("returns all adapters", () => {
    expect(factory.getAll().length).toBeGreaterThan(10);
  });
});
