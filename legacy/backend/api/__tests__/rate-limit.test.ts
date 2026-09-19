import { createRateLimiter } from "../src/rate-limit";

describe("Rate Limiter Bounded Store & Sanitization", () => {
  it("1. Allows requests within limits and rejects requests over limit with 429", async () => {
    const limiter = createRateLimiter({
      windowMs: 10_000,
      maxRequests: 3,
      keyPrefix: "test-limit",
    });

    const makeReq = () =>
      new Request("http://localhost:8080/api/test", {
        headers: { "x-forwarded-for": "192.168.1.50" },
      });

    expect(await limiter(makeReq())).toBeNull();
    expect(await limiter(makeReq())).toBeNull();
    expect(await limiter(makeReq())).toBeNull();

    const blocked = await limiter(makeReq());
    expect(blocked).not.toBeNull();
    expect(blocked?.status).toBe(429);
    const body = await blocked?.json();
    expect(body.code).toBe("RATE_LIMITED");
  });

  it("2. Safely sanitizes malformed IP headers without crashing", async () => {
    const limiter = createRateLimiter({
      windowMs: 10_000,
      maxRequests: 5,
      keyPrefix: "test-sanitize",
    });

    const maliciousReq = new Request("http://localhost:8080/api/test", {
      headers: { "x-forwarded-for": "<script>alert(1)</script>; DROP TABLE;" },
    });

    const res = await limiter(maliciousReq);
    expect(res).toBeNull();
  });

  it("3. Authenticated requests partition limits by Bearer token", async () => {
    const limiter = createRateLimiter({
      windowMs: 10_000,
      maxRequests: 2,
      keyPrefix: "test-auth",
    });

    const reqUser1 = new Request("http://localhost:8080/api/test", {
      headers: { authorization: "Bearer token_user_1_abc123" },
    });
    const reqUser2 = new Request("http://localhost:8080/api/test", {
      headers: { authorization: "Bearer token_user_2_xyz789" },
    });

    expect(await limiter(reqUser1)).toBeNull();
    expect(await limiter(reqUser1)).toBeNull();
    expect((await limiter(reqUser1))?.status).toBe(429);

    // User 2 should not be affected by User 1 being rate-limited
    expect(await limiter(reqUser2)).toBeNull();
  });
});
