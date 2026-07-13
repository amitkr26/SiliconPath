import { hashPrompt } from "../src/utils/hash";
import { sanitizePrompt } from "../src/utils/sanitize";
import { calculateCost, truncate, now, generateId, sleep } from "../src/utils";
import { validateResponse } from "../src/utils";
import { z } from "zod";

describe("hashPrompt", () => {
  it("produces a consistent hash for the same input", () => {
    const h1 = hashPrompt("hello world");
    const h2 = hashPrompt("hello world");
    expect(h1).toBe(h2);
  });

  it("produces different hashes for different inputs", () => {
    const h1 = hashPrompt("hello");
    const h2 = hashPrompt("world");
    expect(h1).not.toBe(h2);
  });
});

describe("sanitizePrompt", () => {
  it("removes API keys from text", () => {
    const sanitized = sanitizePrompt("My api_key=abcdefghijklmnopqrstuvwxyz123456 and more text");
    expect(sanitized).toContain("[REDACTED]");
  });

  it("removes sk- prefixed keys", () => {
    const sanitized = sanitizePrompt("My key is sk-abcdefghijklmnopqrstuvwxyz123456 and more text");
    expect(sanitized).toContain("[REDACTED]");
  });

  it("removes bearer tokens", () => {
    const sanitized = sanitizePrompt("Bearer abcdefghijklmnopqrstuvwxyz123456");
    expect(sanitized).toContain("[REDACTED]");
  });

  it("returns non-sensitive text unchanged", () => {
    const sanitized = sanitizePrompt("Hello, how are you?");
    expect(sanitized).toBe("Hello, how are you?");
  });
});

describe("calculateCost", () => {
  it("calculates cost for gemini", () => {
    const cost = calculateCost("gemini", "gemini-2.0-flash", 1000, 500);
    expect(cost).toBeGreaterThan(0);
  });

  it("returns 0 for zero tokens", () => {
    const cost = calculateCost("gemini", "gemini-2.0-flash", 0, 0);
    expect(cost).toBe(0);
  });
});

describe("truncate", () => {
  it("returns string unchanged when within limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates and adds ellipsis when over limit", () => {
    expect(truncate("hello world this is long", 10)).toBe("hello w...");
  });
});

describe("now", () => {
  it("returns current timestamp", () => {
    const before = Date.now();
    const ts = now();
    const after = Date.now();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});

describe("generateId", () => {
  it("generates a 32-character hex string", () => {
    const id = generateId();
    expect(id).toHaveLength(32);
    expect(/^[0-9a-f]{32}$/.test(id)).toBe(true);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe("sleep", () => {
  it("resolves after the specified time", async () => {
    const start = Date.now();
    await sleep(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(40);
  });
});

describe("validateResponse", () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
  });

  it("validates data matching the schema", () => {
    const result = validateResponse({ name: "Alice", age: 30 }, schema);
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  it("throws for data not matching schema", () => {
    expect(() => validateResponse({ name: "Alice" }, schema)).toThrow();
  });
});
