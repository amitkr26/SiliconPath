import { ResponseCache } from "../src/cache";
import type { GatewayResponse } from "../src/types/gateway";

describe("ResponseCache", () => {
  let cache: ResponseCache;

  beforeEach(() => {
    cache = new ResponseCache();
  });

  const sampleResponse: GatewayResponse = {
    text: "Hello world",
    provider: "gemini",
    model: "gemini-2.0-flash",
    latencyMs: 100,
    cached: false,
  };

  describe("buildKey", () => {
    it("generates a deterministic key for the same params", () => {
      const key1 = cache.buildKey({ prompt: "hello", model: "gemini-2.0-flash" });
      const key2 = cache.buildKey({ prompt: "hello", model: "gemini-2.0-flash" });
      expect(key1).toBe(key2);
    });

    it("generates different keys for different params", () => {
      const key1 = cache.buildKey({ prompt: "hello", model: "gemini-2.0-flash" });
      const key2 = cache.buildKey({ prompt: "world", model: "gemini-2.0-flash" });
      expect(key1).not.toBe(key2);
    });

    it("handles messages in key generation", () => {
      const key1 = cache.buildKey({
        messages: [{ role: "user", content: "hi" }],
      });
      const key2 = cache.buildKey({
        messages: [{ role: "user", content: "hello" }],
      });
      expect(key1).not.toBe(key2);
    });
  });

  describe("get/set", () => {
    it("stores and retrieves a response", async () => {
      const key = "test-key";
      await cache.set(key, sampleResponse, 60_000);
      const result = await cache.get(key);
      expect(result).toEqual(sampleResponse);
    });

    it("returns null for missing key", async () => {
      const result = await cache.get("nonexistent");
      expect(result).toBeNull();
    });

    it("returns null after TTL expires", async () => {
      const key = "ttl-key";
      await cache.set(key, sampleResponse, 0);
      await new Promise((r) => setTimeout(r, 10));
      const result = await cache.get(key);
      expect(result).toBeNull();
    });

    it("tracks hit/miss stats", async () => {
      await cache.get("miss");
      await cache.set("hit", sampleResponse, 60_000);
      await cache.get("hit");
      const stats = await cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });
  });

  describe("delete/clear", () => {
    it("deletes a specific key", async () => {
      const key = "delete-key";
      await cache.set(key, sampleResponse, 60_000);
      await cache.delete(key);
      const result = await cache.get(key);
      expect(result).toBeNull();
    });

    it("clears all entries", async () => {
      await cache.set("a", sampleResponse, 60_000);
      await cache.set("b", sampleResponse, 60_000);
      await cache.clear();
      expect(await cache.get("a")).toBeNull();
      expect(await cache.get("b")).toBeNull();
      const stats = await cache.getStats();
      expect(stats.size).toBe(0);
    });
  });
});
